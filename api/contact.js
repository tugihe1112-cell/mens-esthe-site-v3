/**
 * Vercel serverless function — contact form notification
 * POST /api/contact
 * Body: { name, email, category, message, company }
 */

const MAX_NAME_LENGTH = 80;
const MAX_CATEGORY_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 4000;

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const normalizeText = (value = '') => String(value).trim();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name: rawName,
    email: rawEmail,
    category: rawCategory,
    message: rawMessage,
    company,
  } = req.body || {};

  if (company) {
    return res.status(200).json({ ok: true });
  }

  const name = normalizeText(rawName).slice(0, MAX_NAME_LENGTH);
  const email = normalizeText(rawEmail).toLowerCase();
  const category = normalizeText(rawCategory || 'お問い合わせ').slice(0, MAX_CATEGORY_LENGTH);
  const message = normalizeText(rawMessage).slice(0, MAX_MESSAGE_LENGTH);

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (normalizeText(rawMessage).length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'Message too long' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set — skipping contact email');
    return res.status(200).json({ ok: true, skipped: 'no_resend_key' });
  }

  const to = process.env.CONTACT_TO_EMAIL || 'tugihe1112@gmail.com';
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCategory = escapeHtml(category);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const subject = `【メンエスマップ】${category}`;

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px;background:#0f172a;font-family:'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#1e293b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;">
    <tr>
      <td style="padding:28px;">
        <h1 style="margin:0 0 20px;font-size:20px;color:#fff;">お問い合わせが届きました</h1>
        <p style="margin:0 0 8px;color:#94a3b8;">種別: <strong style="color:#fff;">${safeCategory}</strong></p>
        <p style="margin:0 0 8px;color:#94a3b8;">名前: <strong style="color:#fff;">${safeName}</strong></p>
        <p style="margin:0 0 24px;color:#94a3b8;">メール: <a href="mailto:${safeEmail}" style="color:#f9a8d4;">${safeEmail}</a></p>
        <div style="padding:20px;background:#0f172a;border-radius:12px;line-height:1.8;color:#e2e8f0;">${safeMessage}</div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = [
    'お問い合わせが届きました',
    `種別: ${category}`,
    `名前: ${name}`,
    `メール: ${email}`,
    '',
    message,
  ].join('\n');

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'メンエスマップ <noreply@mens-esthe-map.jp>',
        to,
        reply_to: email,
        subject,
        html,
        text,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error('Resend contact error:', emailRes.status, errBody);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    const emailData = await emailRes.json();
    return res.status(200).json({ ok: true, email_id: emailData.id });
  } catch (e) {
    console.error('Contact email failed:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
