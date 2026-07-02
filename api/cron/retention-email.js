// Tier 3-2: 週次リテンションメール「あなたの口コミが今週N回読まれました」
// Vercel Cron（vercel.json の crons）から週1で叩かれる。
// 実ユーザー（user_idがUUID）の口コミで、前回通知以降に閲覧が増えた分を集計してResendで送信。
import { createClient } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

export default async function handler(req, res) {
  // Vercel Cron 認証（CRON_SECRET を設定していれば検証。未設定なら素通り）
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // 週1（月曜UTC）だけ送信。Vercel Hobbyのcronが日次に丸められても二重送信しない安全ガード。
  // 手動テストは ?force=1 で任意日に実行可。
  const forceRun = req.query?.force === '1';
  if (!forceRun && new Date().getUTCDay() !== 1) {
    return res.status(200).json({ ok: true, skipped: 'not monday' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    // 閲覧が発生している口コミを取得（差分>0のものだけ後で対象化）
    const { data: revs, error } = await supabase
      .from('reviews')
      .select('id, user_id, therapist_name, view_count, last_notified_views')
      .gt('view_count', 0);
    if (error) throw error;

    // ユーザー単位に集計（実ユーザー=UUIDのみ）
    const byUser = {};
    for (const r of revs || []) {
      const delta = (r.view_count || 0) - (r.last_notified_views || 0);
      if (delta <= 0) continue;
      if (!UUID_RE.test(r.user_id || '')) continue;
      (byUser[r.user_id] ||= { total: 0, ids: [], names: new Set() });
      byUser[r.user_id].total += delta;
      byUser[r.user_id].ids.push(r.id);
      if (r.therapist_name) byUser[r.user_id].names.add(r.therapist_name);
    }

    let sent = 0, skipped = 0;
    const ackIds = [];
    for (const [userId, info] of Object.entries(byUser)) {
      const { data: u } = await supabase.auth.admin.getUserById(userId);
      const email = u?.user?.email;
      if (!email) { skipped++; continue; }

      if (process.env.RESEND_API_KEY) {
        const names = [...info.names].slice(0, 3).join('・');
        const html = `
          <div style="background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px;font-family:sans-serif;max-width:520px;margin:auto">
            <h1 style="font-size:20px;margin:0 0 12px">あなたの口コミが読まれています 👀</h1>
            <p style="color:#94a3b8;font-size:14px;margin:0 0 20px">今週、あなたの投稿した口コミが合計で読まれた回数です。</p>
            <div style="background:linear-gradient(135deg,#db2777,#7c3aed);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
              <div style="font-size:40px;font-weight:900;color:#fff">${info.total}<span style="font-size:18px">回</span></div>
              <div style="color:#fce7f3;font-size:12px;margin-top:4px">${names ? names + ' などの口コミ' : 'あなたの口コミ'}</div>
            </div>
            <p style="color:#94a3b8;font-size:13px;margin:0 0 20px">あなたの体験談が、次の誰かの参考になっています。新しい体験があればぜひ追加を。</p>
            <a href="${SITE}/post-review" style="display:inline-block;background:#fff;color:#0f172a;font-weight:900;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px">口コミを書く →</a>
          </div>`;
        try {
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'メンエスマップ <noreply@mens-esthe-map.jp>',
              to: email,
              subject: `あなたの口コミが今週${info.total}回読まれました 👀`,
              html,
            }),
          });
          if (r.ok) { sent++; ackIds.push(...info.ids); }
          else { skipped++; }
        } catch (e) { skipped++; }
      } else {
        skipped++;
      }
    }

    // 送信できた分だけ last_notified_views を現在値に更新（次週は新規閲覧のみ通知）
    if (ackIds.length) {
      await supabase.rpc('ack_review_views', { ids: ackIds });
    }

    return res.status(200).json({ ok: true, sent, skipped, users: Object.keys(byUser).length });
  } catch (e) {
    console.error('[retention-email]', e.message);
    return res.status(500).json({ error: e.message });
  }
}
