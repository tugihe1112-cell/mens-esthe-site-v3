/**
 * POST /api/auth/signup
 * ユーザー作成 + 確認メール送信をサーバーサイドで完結させる
 * Body: { email, password }
 */
import { createClient } from '@supabase/supabase-js';

const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email と password は必須です' });
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
    // Step1: ユーザー作成
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
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

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[auth/signup] error:', err.message);
    // メール送信失敗時はユーザーを削除してロールバック
    if (userId) {
      await admin.auth.admin.deleteUser(userId).catch(() => {});
    }
    return res.status(500).json({ error: err.message });
  }
}
