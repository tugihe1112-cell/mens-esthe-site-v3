/**
 * POST /api/notify-review
 * 口コミ投稿時に管理者へメール通知する。
 * Headers: Authorization: Bearer {Supabase access_token}
 * Body: { reviewId }
 *
 * クライアントから受け取った本文や店名はメールに使わない。
 * JWTをSupabase Authで検証し、そのユーザーが所有する口コミだけをDBから再取得する。
 */
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SITE_URL = 'https://www.mens-esthe-map.jp';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const rawReviewId = req.body?.reviewId;
  const reviewId = typeof rawReviewId === 'string' ? rawReviewId.trim() : '';

  if (!token) return res.status(401).json({ error: 'Unauthorized: no token' });
  if (!reviewId || reviewId.length > 200) {
    return res.status(400).json({ error: 'Missing or invalid reviewId' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[notify-review] Supabase server credentials are not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // getSessionのユーザー情報は信頼せず、Authサーバーへ問い合わせてJWTを検証する。
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }

  const { data: review, error: reviewError } = await supabaseAdmin
    .from('reviews')
    .select('id,shop_id,therapist_name,user_id,user_name,rating,content')
    .eq('id', reviewId)
    .maybeSingle();

  if (reviewError) {
    console.error('[notify-review] review lookup failed:', reviewError.message);
    return res.status(500).json({ error: 'Failed to load review' });
  }
  if (!review) return res.status(404).json({ error: 'Review not found' });
  if (String(review.user_id) !== String(user.id)) {
    return res.status(403).json({ error: 'Forbidden: review owner mismatch' });
  }

  const { data: shop } = await supabaseAdmin
    .from('shops')
    .select('name')
    .eq('id', review.shop_id)
    .maybeSingle();

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('[notify-review] RESEND_API_KEY not set — skipping email');
    return res.status(200).json({ ok: true, skipped: 'no_resend_key' });
  }

  const toEmail = process.env.CONTACT_TO_EMAIL || 'tugihe1112@gmail.com';
  const siteUrl = (process.env.VITE_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  const adminUrl = `${siteUrl}/admin?review=${encodeURIComponent(review.id)}`;
  const shopName = shop?.name || review.shop_id || '不明';
  const therapistName = review.therapist_name || '指名なし';
  const userName = review.user_name || '名前なし';
  const rating = Number.isFinite(Number(review.rating)) ? Number(review.rating).toFixed(1) : '-';
  const rawContent = String(review.content || '');
  const preview = rawContent
    ? `${rawContent.slice(0, 160)}${rawContent.length > 160 ? '…' : ''}`
    : '（本文なし）';

  const html = `
    <div style="font-family:'Hiragino Sans','Noto Sans JP',sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;max-width:600px">
      <h2 style="color:#f472b6;margin:0 0 16px">📝 新しい口コミが投稿されました</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#94a3b8;width:120px">店舗</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(shopName)}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8">セラピスト</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(therapistName)}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8">投稿者</td><td style="padding:8px 0">${escapeHtml(userName)}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8">評価</td><td style="padding:8px 0">⭐ ${escapeHtml(rating)}</td></tr>
      </table>
      <div style="margin-top:16px;background:#1e293b;padding:16px;border-radius:8px;font-size:13px;line-height:1.7;color:#cbd5e1;white-space:pre-wrap">${escapeHtml(preview)}</div>
      <div style="margin-top:24px">
        <a href="${escapeHtml(adminUrl)}"
           style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;padding:13px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
          この口コミを管理画面で開く →
        </a>
      </div>
      <p style="margin:18px 0 0;color:#64748b;font-size:11px;line-height:1.6">未ログインの場合は、管理者ログイン後にこの口コミへ自動で戻ります。</p>
    </div>
  `;

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'メンエスマップ <noreply@mens-esthe-map.jp>',
        to: [toEmail],
        subject: `【新着口コミ】${shopName}${review.therapist_name ? ` / ${therapistName}` : ''} ⭐${rating}`,
        html,
      }),
    });
    const emailData = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok) {
      console.error('[notify-review] Resend error:', emailResponse.status, emailData);
      return res.status(502).json({ error: 'Failed to send email' });
    }
    return res.status(200).json({ ok: true, id: emailData.id });
  } catch (error) {
    console.error('[notify-review] unexpected error:', error);
    return res.status(502).json({ error: 'Failed to send email' });
  }
}
