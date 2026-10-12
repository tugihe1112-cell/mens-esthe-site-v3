/**
 * Vercel サーバーレス関数 — クレジット付与（管理者専用）
 * POST /api/admin-grant-credit
 * Headers: Authorization: Bearer {Supabase access_token}
 * Body: { target_user_id, days }
 *
 * anon key では叩けない。ログイン済みの管理者メールのみ許可。
 *
 * GET /api/admin-grant-credit（同じ Authorization）→ { admin: true|false }
 *   画面（管理画面・マイページ）が「この人は管理者か」を知るための窓口。
 *   🚩 2026-10-13: 以前は画面のJSに管理者のメールアドレスをそのまま書いて比べていたので、
 *      サイトを開いた誰でもJSから運営者の個人アドレスを読めた（オーナー「個人でやっているのがバレる」）。
 *      判定はサーバーだけで行い、画面には結果（true/false）しか渡さない。
 *      関数を増やさないのは、Hobby プランの api/ は12本まで（今12本）だから。
 */
import { createClient } from '@supabase/supabase-js';

// ⚠️ 2026-08-12: 'master@mens-esthe.jp' を削除した。
//    理由1: このアカウントのパスワードがログイン画面にハードコードされ本番配信されていた。
//    理由2: ドメイン `mens-esthe.jp` は当サイト（mens-esthe-map.jp）の所有ドメインではない。
//           管理者判定がメール完全一致のため、**そのドメインの所有者が同名のメールボックスを
//           作って新規登録すれば管理者になれてしまう**（アカウントを消すだけでは塞がらない）。
//    管理者を増やす場合も、他人が取得しうるドメインのアドレスは絶対に入れないこと。
const ADMIN_EMAILS = ['tugihe1112@gmail.com'];

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (req.method === 'GET') res.setHeader('Cache-Control', 'no-store');

  // ── ① Bearer token を取得 ──
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: no token' });
  }

  // ── ② Supabase Admin でトークンを検証し、管理者メールを確認 ──
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
  if (req.method === 'GET') {
    // 判定の結果だけを返す（管理者のアドレスは返さない）
    return res.status(200).json({ admin: ADMIN_EMAILS.includes(user.email) });
  }
  if (!ADMIN_EMAILS.includes(user.email)) {
    return res.status(403).json({ error: 'Forbidden: not an admin' });
  }

  // ── ③ 入力チェック ──
  const { target_user_id, days } = req.body || {};
  if (!target_user_id || !days || typeof days !== 'number' || days < 1 || days > 90) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  // ── ④ Service Role Key で user_credits を更新（RLS バイパス） ──
  try {
    const { data: existing } = await supabaseAdmin
      .from('user_credits')
      .select('credits_days, expires_at')
      .eq('user_id', target_user_id)
      .single();

    const newDays = (existing?.credits_days || 0) + days;
    const baseExpiry =
      existing?.expires_at && new Date(existing.expires_at) > new Date()
        ? new Date(existing.expires_at)
        : new Date();
    const newExpiry = new Date(baseExpiry.getTime() + days * 86_400_000);

    if (existing) {
      const { error } = await supabaseAdmin
        .from('user_credits')
        .update({
          credits_days: newDays,
          expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', target_user_id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from('user_credits').insert({
        user_id: target_user_id,
        credits_days: days,
        expires_at: newExpiry.toISOString(),
        // 管理者の手動付与は「投稿数」ではない。レビューINSERT時のDBトリガーだけが更新する。
        total_reviews_posted: 0,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    return res.status(200).json({
      ok: true,
      credits_days: newDays,
      expires_at: newExpiry.toISOString(),
    });
  } catch (e) {
    console.error('admin-grant-credit error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
