/**
 * POST /api/auth/signup
 * ユーザー作成 + 確認メール送信をサーバーサイドで完結させる
 * Body: { display_name, email, password }
 */
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, rejectRateLimit, requestIp } from '../../server/rateLimit.js';

const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const normalizeDisplayName = (value) => String(value || '')
  .normalize('NFKC')
  .trim()
  .replace(/\s+/g, ' ');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Cache-Control', 'no-store');

  const { display_name: rawDisplayName, email: rawEmail, password } = req.body || {};
  const displayName = normalizeDisplayName(rawDisplayName);
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!displayName || !email || !password) {
    return res.status(400).json({ error: '表示名・メールアドレス・パスワードは必須です' });
  }
  if (displayName.length > 30) {
    return res.status(400).json({ error: '表示名は30文字以内で入力してください' });
  }
  if (email.length > 254 || !isValidEmail(email)) {
    return res.status(400).json({ error: 'メールアドレスの形式が正しくありません' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'パスワードは8〜128文字で入力してください' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    return res.status(500).json({ error: '環境変数が不足しています' });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let userId = null;

  try {
    // admin.createUserは通常の /auth/v1/signup のレート制限を通らないため、
    // IPとメールの両方をDBで原子的に制限する。制限機構の障害時はfail-closed。
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumeRateLimit({ scope: 'signup-ip', subject: requestIp(req), limit: 5, windowSeconds: 3600 }),
      consumeRateLimit({ scope: 'signup-email', subject: email, limit: 3, windowSeconds: 86400 }),
    ]);
    if (!ipAllowed || !emailAllowed) return rejectRateLimit(res, ipAllowed ? 86400 : 3600);

    // Step1: ユーザー作成
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { display_name: displayName },
    });

    if (createError) {
      if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
        return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
      }
      throw createError;
    }

    userId = userData.user.id;

    // Step1.5: 新規登録ボーナス（閲覧権3日）
    // 失敗しても登録自体は続行。メール送信失敗時のユーザー削除で cascade 削除される
    try {
      const { error: bonusError } = await admin.from('user_credits').insert({
        user_id: userId,
        credits_days: 3,
        expires_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        total_reviews_posted: 0,
        updated_at: new Date().toISOString(),
      });
      if (bonusError) console.error('[signup bonus] ', bonusError.message);
    } catch (e) {
      console.error('[signup bonus] ', e.message);
    }

    // Step2: 確認リンク生成
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo: `${SITE_URL}/` }
    });

    if (linkError) throw linkError;

    const confirmUrl = linkData.properties?.action_link;
    if (!confirmUrl) throw new Error('確認リンクの生成に失敗しました');

    // Step3: Resendでメール送信
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:40px 32px;background:#0f0f1e;border-radius:24px;border:1px solid rgba(255,255,255,0.08);">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:26px;font-weight:900;color:#fff;">Mens Esthe<span style="color:#ff5599">.Map</span></span>
    </div>
    <p style="color:#c8b8e8;font-size:15px;line-height:1.7;margin:0 0 28px;">
      ご登録ありがとうございます。<br>以下のボタンをタップしてメールアドレスを確認してください。
    </p>
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${confirmUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#ff4488,#cc44ff);color:#fff;font-size:16px;font-weight:800;text-decoration:none;border-radius:14px;">
        メールアドレスを確認する
      </a>
    </div>
    <p style="color:#5a4a7a;font-size:12px;line-height:1.6;margin:0;">このリンクは24時間有効です。心当たりのない場合は無視してください。</p>
  </div>
</body>
</html>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'メンエスマップ <noreply@mens-esthe-map.jp>',
        to: email,
        subject: '【メンエスマップ】メールアドレスの確認',
        html,
      }),
    });

    const resendResult = await r.json();
    if (!r.ok) throw new Error(`メール送信失敗: ${resendResult.message || JSON.stringify(resendResult)}`);

    // ── 管理者へ新規登録の通知（2026-08-17 追加）──────────────────
    // ⚠️ これまで新規登録の通知が一切なく、誰かが登録しても Supabase を
    //    見に行かない限り気づけなかった（実際 2026-08-08 の初の一般ユーザー登録に
    //    数日間気づいていない）。登録者が2人しかいない段階では、1人増えることが
    //    最重要のイベントなので必ず知らせる。
    // ⚠️ ここで失敗しても**登録自体は成功扱いにする**。通知はおまけであり、
    //    これを理由にユーザー作成をロールバックしてはいけない
    //    （この関数の catch はユーザー削除を行うため、try の外に出さない）。
    try {
      const ADMIN_TO = process.env.CONTACT_TO_EMAIL || 'tugihe1112@gmail.com';
      const jstNow = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16);
      const adminNotifyResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'メンエスマップ <noreply@mens-esthe-map.jp>',
          to: [ADMIN_TO],
          subject: `【新規登録】${email}`,
          html: `
            <div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;max-width:600px">
              <p style="color:#f472b6;font-weight:bold;letter-spacing:.1em;font-size:12px;margin:0 0 8px">NEW SIGNUP</p>
              <h2 style="color:#fff;margin:0 0 20px;font-size:20px">新しいユーザーが登録しました</h2>
              <table style="width:100%;font-size:14px;line-height:2">
                <tr><td style="color:#94a3b8;width:120px">表示名</td><td style="color:#fff">${escapeHtml(displayName)}</td></tr>
                <tr><td style="color:#94a3b8;width:120px">メール</td><td style="color:#fff">${escapeHtml(email)}</td></tr>
                <tr><td style="color:#94a3b8">登録日時</td><td>${jstNow} JST</td></tr>
                <tr><td style="color:#94a3b8">プラン</td><td>free（自動）</td></tr>
              </table>
              <p style="color:#64748b;font-size:12px;margin-top:20px;line-height:1.8">
                この時点ではまだ「メール確認前」です。確認リンクを踏むまでログインできません。<br>
                投稿があれば別途「新着口コミ」の通知が届きます。
              </p>
              <a href="https://supabase.com/dashboard/project/azuetkuzzmshqfbrhqmf/auth/users"
                 style="display:inline-block;margin-top:16px;background:#ec4899;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;font-size:14px">
                ユーザー一覧を開く
              </a>
            </div>`,
        }),
      });
      if (!adminNotifyResponse.ok) {
        const adminNotifyBody = await adminNotifyResponse.text();
        throw new Error(`管理者への登録通知に失敗: HTTP ${adminNotifyResponse.status} ${adminNotifyBody.slice(0, 200)}`);
      }
    } catch (notifyErr) {
      // 通知の失敗は登録の成否に影響させない
      console.error('[auth/signup] 管理者通知に失敗（登録は成功）:', notifyErr.message);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[auth/signup] error:', err.message);
    // メール送信失敗時はユーザーを削除してロールバック
    if (userId) {
      await admin.auth.admin.deleteUser(userId).catch(() => {});
    }
    const limiterFailed = err.message?.startsWith('Rate limiter') || err.message === 'Rate limiter is not configured';
    return res.status(limiterFailed ? 503 : 500).json({
      error: limiterFailed ? '現在登録を受け付けられません。時間をおいて再度お試しください。' : err.message,
    });
  }
}
