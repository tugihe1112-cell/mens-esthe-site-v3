/**
 * Vercel サーバーレス関数 — クレジット付与（管理者専用）
 * POST /api/admin-grant-credit
 * Headers: Authorization: Bearer {Supabase access_token}
 * Body: { target_user_id, days }
 *
 * anon key では叩けない。ログイン済みの管理者メールのみ許可。
 */
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['tugihe1112@gmail.com', 'master@mens-esthe.jp'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      .select('credits_days, expires_at, total_reviews_posted')
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
          total_reviews_posted: (existing.total_reviews_posted || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', target_user_id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from('user_credits').insert({
        user_id: target_user_id,
        credits_days: days,
        expires_at: newExpiry.toISOString(),
        total_reviews_posted: 1,
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
