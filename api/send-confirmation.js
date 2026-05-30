/**
 * POST /api/send-confirmation
 * サインアップ後に確認メールをResend APIで送信する
 * Body: { email }
 */
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

  console.log('[send-confirmation] called for:', email);
  console.log('[send-confirmation] RESEND_API_KEY exists:', !!RESEND_API_KEY);
  console.log('[send-confirmation] SUPABASE_URL exists:', !!SUPABASE_URL);
  console.log('[send-confirmation] SERVICE_ROLE_KEY exists:', !!SERVICE_ROLE_KEY);

  try {
    // Step1: 確認リンク生成
    let confirmUrl = `${SITE_URL}/`;
    try {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data, error } = await admin.auth.admin.generateLink({
        type: 'signup',
        email,
        options: { redirectTo: `${SITE_URL}/` }
      });
      if (error) {
        console.error('[send-confirmation] generateLink error:', error.message);
      } else {
        confirmUrl = data.properties?.action_link || confirmUrl;
        console.log('[send-confirmation] confirmUrl generated:', !!confirmUrl);
      }
    } catch (genErr) {
      console.error('[send-confirmation] generateLink threw:', genErr.message);
    }

    // Step2: Resendでメール送信
    if (!RESEND_API_KEY) {
      return res.status(500).json({ error: 'RESEND_API_KEY not set' });
    }

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
    <p style="color:#5a4a7a;font-size:12px;line-height:1.6;margin:0;">このリンクは24時間有効です。</p>
  </div>
</body>
</html>`;

    console.log('[send-confirmation] calling Resend API...');
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

    const result = await r.json();
    console.log('[send-confirmation] Resend response:', r.status, JSON.stringify(result));

    if (!r.ok) throw new Error(`Resend ${r.status}: ${result.message || JSON.stringify(result)}`);

    return res.status(200).json({ ok: true, id: result.id });
  } catch (err) {
    console.error('[send-confirmation] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
