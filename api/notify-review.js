/**
 * POST /api/notify-review
 * 口コミ投稿時に管理者へメール通知
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'tugihe1112@gmail.com';

  if (!RESEND_API_KEY) {
    return res.status(200).json({ skipped: 'no_resend_key' });
  }

  const { shopName, therapistName, userName, rating, content } = req.body || {};

  const preview = content ? content.slice(0, 120) + (content.length > 120 ? '…' : '') : '（本文なし）';

  const html = `
    <div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;max-width:600px">
      <h2 style="color:#f472b6;margin:0 0 16px">📝 新しい口コミが投稿されました</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#94a3b8;width:120px">店舗</td><td style="padding:8px 0;font-weight:bold">${shopName || '不明'}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8">セラピスト</td><td style="padding:8px 0;font-weight:bold">${therapistName || '指名なし'}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8">投稿者</td><td style="padding:8px 0">${userName || '名無しさん'}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8">評価</td><td style="padding:8px 0">⭐ ${rating || '-'}</td></tr>
      </table>
      <div style="margin-top:16px;background:#1e293b;padding:16px;border-radius:8px;font-size:13px;line-height:1.7;color:#cbd5e1">
        ${preview}
      </div>
      <div style="margin-top:20px">
        <a href="https://www.mens-esthe-map.jp/admin"
           style="background:linear-gradient(135deg,#ec4899,#a855f7);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
          管理画面で確認する →
        </a>
      </div>
    </div>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'メンエスマップ <noreply@mens-esthe-map.jp>',
        to: [TO_EMAIL],
        subject: `【新着口コミ】${shopName || ''}${therapistName ? ' / ' + therapistName : ''} ⭐${rating || ''}`,
        html,
      }),
    });
    const json = await r.json();
    return res.status(200).json({ ok: true, id: json.id });
  } catch (e) {
    console.error('notify-review error:', e);
    return res.status(200).json({ ok: false, error: e.message });
  }
}
