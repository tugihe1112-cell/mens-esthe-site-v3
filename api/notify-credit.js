/**
 * Vercel サーバーレス関数 — クレジット付与メール通知
 * POST /api/notify-credit
 * Headers: Authorization: Bearer {Supabase access_token}
 * Body: { user_id, days }
 */
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['tugihe1112@gmail.com'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[notify-credit] Supabase server credentials are not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── ① 呼び出し元JWTをAuthサーバーで検証し、管理者だけを許可 ──
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized: no token' });

  const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !caller) return res.status(401).json({ error: 'Unauthorized: invalid token' });
  if (!ADMIN_EMAILS.includes(caller.email)) {
    return res.status(403).json({ error: 'Forbidden: not an admin' });
  }

  const { user_id, days } = req.body || {};
  if (!UUID_PATTERN.test(String(user_id || '')) || !Number.isInteger(days) || days < 1 || days > 90) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  // ── ② 送信先と現在の付与状態はクライアント値を信頼せずDBから再取得 ──
  let userEmail = null;
  let creditsDays = 0;
  let expiresAt = null;
  try {
    const [{ data, error }, { data: credit, error: creditError }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(user_id),
      supabaseAdmin
        .from('user_credits')
        .select('credits_days,expires_at')
        .eq('user_id', user_id)
        .maybeSingle(),
    ]);
    if (error || creditError) throw error || creditError;
    userEmail = data?.user?.email;
    creditsDays = Number(credit?.credits_days || 0);
    expiresAt = credit?.expires_at || null;
  } catch (e) {
    console.error('Failed to get user email:', e.message);
    // 付与処理は別APIですでに完了しているためロールバックしないが、送信失敗は明示する。
    return res.status(502).json({ ok: false, error: 'Failed to load recipient' });
  }

  if (!userEmail) {
    return res.status(404).json({ ok: false, error: 'Recipient email not found' });
  }

  // ── ③ 有効期限フォーマット ──
  const expiryDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '不明';

  const siteUrl = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

  // ── ④ メール本文（HTML） ──
  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>口コミ承認のお知らせ</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- ヘッダー -->
          <tr>
            <td style="text-align:center;padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);border-radius:12px;padding:10px 20px;">
                <span style="color:#fff;font-size:14px;font-weight:900;letter-spacing:0.05em;">メンエスマップ</span>
              </div>
            </td>
          </tr>

          <!-- カード本体 -->
          <tr>
            <td style="background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 32px;">

              <!-- タイトル -->
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#fff;text-align:center;">
                🎉 口コミを承認しました！
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;text-align:center;">
                ご投稿いただきありがとうございます
              </p>

              <!-- 付与内容ボックス -->
              <div style="background:linear-gradient(135deg,rgba(236,72,153,0.15),rgba(168,85,247,0.15));border:1px solid rgba(236,72,153,0.3);border-radius:16px;padding:24px;margin-bottom:28px;text-align:center;">
                <p style="margin:0 0 6px;font-size:12px;color:#f9a8d4;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">付与された閲覧日数</p>
                <p style="margin:0 0 12px;font-size:48px;font-weight:900;color:#fff;line-height:1;">
                  ${days}<span style="font-size:18px;color:#94a3b8;margin-left:4px;">日間</span>
                </p>
                <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;margin-top:4px;">
                  <p style="margin:0;font-size:13px;color:#94a3b8;">
                    有効期限：<strong style="color:#e2e8f0;">${expiryDate}</strong>まで
                  </p>
                  <p style="margin:4px 0 0;font-size:12px;color:#64748b;">
                    累計閲覧日数：${creditsDays}日
                  </p>
                </div>
              </div>

              <!-- 説明テキスト -->
              <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;line-height:1.7;">
                有効期限内は、他のユーザーが投稿した口コミをすべてご覧いただけます。
                素敵なセラピストとの出会いにお役立てください。
              </p>

              <!-- CTAボタン -->
              <div style="text-align:center;margin:28px 0;">
                <a href="${siteUrl}/popular-reviews"
                   style="display:inline-block;background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;text-decoration:none;font-size:15px;font-weight:900;padding:14px 32px;border-radius:100px;letter-spacing:0.02em;">
                  みんなの口コミを読む →
                </a>
              </div>

              <!-- 区切り線 -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:28px 0;">

              <!-- フッターメッセージ -->
              <p style="margin:0;font-size:13px;color:#64748b;text-align:center;line-height:1.6;">
                またお気に入りのセラピストに出会えましたら、<br>
                ぜひ口コミをお寄せください。皆さんの投稿が<br>
                サイトをより良くしてくれています 🙏
              </p>

            </td>
          </tr>

          <!-- フッター -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#334155;">
                このメールはメンエスマップから自動送信されています。<br>
                <a href="${siteUrl}" style="color:#475569;text-decoration:none;">${siteUrl}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // ── ⑤ Resend でメール送信 ──
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('RESEND_API_KEY not set — cannot send credit email');
    return res.status(500).json({ ok: false, error: 'Email service is not configured' });
  }

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'メンエスマップ <noreply@mens-esthe-map.jp>',
        to: userEmail,
        subject: `【閲覧権限付与】${days}日間の閲覧権限をお渡しします 🎉`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error('Resend error:', emailRes.status, errBody);
      return res.status(502).json({ ok: false, error: 'Email delivery failed' });
    }

    const emailData = await emailRes.json();
    return res.status(200).json({ ok: true, email_id: emailData.id });
  } catch (e) {
    console.error('Email send failed:', e.message);
    return res.status(502).json({ ok: false, error: 'Email delivery failed' });
  }
}
