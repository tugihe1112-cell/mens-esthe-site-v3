/**
 * Supabase Auth Hook — メール送信
 * POST /api/auth-email-hook
 * Supabase が確認メール等を送る代わりにこのエンドポイントを呼ぶ
 */

const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const HOOK_SECRET = process.env.SUPABASE_HOOK_SECRET || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Supabase Hook の署名検証（secret設定時）
  if (HOOK_SECRET) {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.includes(HOOK_SECRET)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const { user, email_data } = req.body || {};

  if (!user?.email || !email_data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { token, token_hash, redirect_to, email_action_type } = email_data;

  // 確認リンクを生成
  const confirmUrl = `${SITE_URL}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&next=${encodeURIComponent(redirect_to || '/')}`;

  // メール種類に応じた件名・本文
  const templates = {
    signup: {
      subject: '【メンエスマップ】メールアドレスの確認',
      action: 'メールアドレスを確認する',
      message: 'ご登録ありがとうございます。以下のボタンをタップしてメールアドレスを確認してください。',
    },
    recovery: {
      subject: '【メンエスマップ】パスワードのリセット',
      action: 'パスワードをリセットする',
      message: 'パスワードリセットのリクエストを受け付けました。以下のボタンをタップしてください。',
    },
    email_change: {
      subject: '【メンエスマップ】メールアドレスの変更確認',
      action: 'メールアドレスの変更を確認する',
      message: 'メールアドレス変更のリクエストを受け付けました。以下のボタンをタップして確認してください。',
    },
  };

  const tmpl = templates[email_action_type] || templates.signup;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:40px 32px;background:#0f0f1e;border-radius:24px;border:1px solid rgba(255,255,255,0.08);">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">Mens Esthe<span style="color:#ff5599">.Map</span></span>
    </div>
    <p style="color:#c8b8e8;font-size:15px;line-height:1.7;margin:0 0 28px;">${tmpl.message}</p>
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${confirmUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#ff4488,#cc44ff);color:#fff;font-size:16px;font-weight:800;text-decoration:none;border-radius:14px;letter-spacing:0.5px;">${tmpl.action}</a>
    </div>
    <p style="color:#5a4a7a;font-size:12px;line-height:1.6;margin:0;">このリンクは24時間有効です。心当たりのない場合は無視してください。</p>
  </div>
</body>
</html>`;

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set');
    return res.status(200).json({ message: 'skipped: no resend key' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'メンエスマップ <noreply@mens-esthe-map.jp>',
        to: user.email,
        subject: tmpl.subject,
        html,
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Resend error');

    return res.status(200).json({ message: 'sent', id: data.id });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: err.message });
  }
}
