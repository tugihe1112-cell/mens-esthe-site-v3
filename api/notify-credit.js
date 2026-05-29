/**
 * Vercel サーバーレス関数 — クレジット付与メール通知
 * POST /api/notify-credit
 * Body: { user_id, days, credits_days, expires_at }
 */
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, days, credits_days, expires_at } = req.body || {};
  if (!user_id || !days) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ── ① Supabase Admin でユーザーのメールアドレスを取得 ──
  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let userEmail = null;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (error) throw error;
    userEmail = data?.user?.email;
  } catch (e) {
    console.error('Failed to get user email:', e.message);
    // メール取得失敗はエラーにしない（付与自体は成功しているため）
    return res.status(200).json({ ok: true, skipped: 'no_email' });
  }

  if (!userEmail) {
    return res.status(200).json({ ok: true, skipped: 'no_email' });
  }

  // ── ② 有効期限フォーマット ──
  const expiryDate = expires_at
    ? new Date(expires_at).toLocaleDateString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '不明';

  const siteUrl = process.env.VITE_PUBLIC_SITE_URL || 'https://mens-esthe.jp';

  // ── ③ メール本文（HTML） ──
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
                <span style="color:#fff;font-size:14px;font-weight:900;letter-spacing:0.05em;">💆 メンズエステ情報</span>
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
                    累計閲覧日数：${credits_days}日
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
                このメールはメンズエステ情報サイトから自動送信されています。<br>
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

  // ── ④ Resend でメール送信 ──
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return res.status(200).json({ ok: true, skipped: 'no_resend_key' });
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
      return res.status(200).json({ ok: true, skipped: 'resend_error', detail: errBody });
    }

    const emailData = await emailRes.json();
    return res.status(200).json({ ok: true, email_id: emailData.id });
  } catch (e) {
    console.error('Email send failed:', e.message);
    return res.status(200).json({ ok: true, skipped: 'exception', detail: e.message });
  }
}
