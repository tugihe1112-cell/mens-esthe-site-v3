/**
 * POST /api/auth/signup
 * ユーザー作成 + 確認メール送信をサーバーサイドで完結させる
 * Body: { display_name, email, password, return_to }
 *
 * ⚠️ return_to は「確認メールを踏んだあとに戻るページ」。
 *    クライアントの申告をそのまま使わず、**サーバー側で必ず再検証する**
 *    （normalizeReturnTo。外部origin・プロトコル相対・二重エンコードを拒否）。
 */
import { createClient } from '@supabase/supabase-js';
import { consumeRateLimit, rejectRateLimit, requestIp } from '../../server/rateLimit.js';
import {
  normalizeReturnTo,
  buildAuthCompleteUrl,
  AUTH_RETURN_TO_FALLBACKS,
} from '../../src/utils/authRedirect.js';

const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const normalizeDisplayName = (value) => String(value || '')
  .normalize('NFKC')
  .trim()
  .replace(/\s+/g, ' ');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('Cache-Control', 'no-store');

  const { display_name: rawDisplayName, email: rawEmail, password, return_to: rawReturnTo } = req.body || {};
  const displayName = normalizeDisplayName(rawDisplayName);
  const email = String(rawEmail || '').trim().toLowerCase();
  // 戻り先が無い/不正なら、登録直後に価値が分かる公開口コミ一覧へ送る
  const returnTo = normalizeReturnTo(rawReturnTo, AUTH_RETURN_TO_FALLBACKS.signup);
  if (!displayName || !email || !password) {
    return res.status(400).json({ error: '表示名・メールアドレス・パスワードは必須です' });
  }
  if (displayName.length > 30) {
    return res.status(400).json({ error: '表示名は30文字以内で入力してください' });
  }
  if (email.length > 254 || !isValidEmail(email)) {
    return res.status(400).json({ error: 'メールアドレスの形式が正しくありません' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'パスワードは8〜128文字で入力してください' });
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
    // admin.createUserは通常の /auth/v1/signup のレート制限を通らないため、
    // IPとメールの両方をDBで原子的に制限する。制限機構の障害時はfail-closed。
    const [ipAllowed, emailAllowed] = await Promise.all([
      consumeRateLimit({ scope: 'signup-ip', subject: requestIp(req), limit: 5, windowSeconds: 3600 }),
      consumeRateLimit({ scope: 'signup-email', subject: email, limit: 3, windowSeconds: 86400 }),
    ]);
    if (!ipAllowed || !emailAllowed) return rejectRateLimit(res, ipAllowed ? 86400 : 3600);

    // Step1: ユーザー作成
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { display_name: displayName },
    });

    if (createError) {
      if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
        return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
      }
      // ⚠️ 2026-09-08: ここで throw すると下の catch に落ちて **500** になる。
      //    500 は画面側が固定文言（「送信できませんでした」）へ写すため、
      //    「メールアドレスが受け付けられない」ことが利用者に一切伝わらなかった。
      //    実際に `+t1@gmail.com` で登録できず、原因が誰にも分からない状態になった。
      //    利用者が直せる失敗は 4xx ＋ 日本語で返すこと（画面はそのまま表示する）。
      const createMsg = String(createError.message || '');
      if (createError.code === 'email_address_invalid' || /email address|invalid format|unable to validate email/i.test(createMsg)) {
        return res.status(400).json({ error: 'このメールアドレスは受け付けられませんでした。入力に誤りがないか確認してください' });
      }
      if (createError.code === 'weak_password' || /password/i.test(createMsg)) {
        return res.status(400).json({ error: 'このパスワードは使用できません。8文字以上で、推測されにくいものを設定してください' });
      }
      throw createError;
    }

    userId = userData.user.id;

    // Step1.5: 新規登録ボーナス（閲覧権3日）
    // ⚠️ 2026-09-08（FIXES.md F08）: 以前はINSERT失敗を**ログに出すだけ**で
    //    確認メール送信へ進んでいた。利用者は「3日間読み放題」の案内を読んで
    //    メールを踏むのに、閲覧権が付いていない状態で着地する。
    //    付与を確認できなければ成功レスポンスも確認メールも出さない。
    // ⚠️ 起算は「APIがアカウントを作る時点から72時間」。
    //    メール確認時点からへ変更するのは商品仕様の変更なので行わない。
    // ⚠️ 既に正しい行があれば再INSERTで延長しない（二重付与を作らない）。
    {
      const bonusDays = 3;
      const expiresAt = new Date(Date.now() + bonusDays * 86_400_000).toISOString();
      let bonusError = null;
      try {
        ({ error: bonusError } = await admin.from('user_credits').insert({
          user_id: userId,
          credits_days: bonusDays,
          expires_at: expiresAt,
          total_reviews_posted: 0,
          updated_at: new Date().toISOString(),
        }));
      } catch (e) {
        // 通信上は不明。書けている可能性があるので、この後の読み戻しで判定する。
        bonusError = e;
      }
      if (bonusError) console.error('[signup bonus] ', bonusError.message);

      // 応答が失われた場合も含めて、**必ず読み戻して**成否を判断する。
      const { data: bonusRows, error: bonusReadError } = await admin
        .from('user_credits')
        .select('credits_days, expires_at, total_reviews_posted')
        .eq('user_id', userId)
        .limit(1);
      if (bonusReadError) throw new Error(`Signup bonus verification failed: ${bonusReadError.message}`);
      const bonus = Array.isArray(bonusRows) ? bonusRows[0] : null;
      const grantedOk = !!bonus
        && Number(bonus.credits_days) === bonusDays
        && Number(bonus.total_reviews_posted || 0) === 0
        && bonus.expires_at
        && new Date(bonus.expires_at).getTime() > Date.now();
      if (!grantedOk) {
        // ⚠️ 後始末（このリクエストが作ったuserIdの削除）は下の catch が行う。
        //    既存会員は絶対に削除しない（userId はこのリクエストで作った分だけ）。
        throw new Error('Signup bonus was not granted');
      }
    }

    // Step2: 確認リンク生成
    // ⚠️ 2026-09-07（FIXES.md F01）: ここが `${SITE_URL}/` 固定だったため、
    //    どこから登録しても確認メールの着地点は**必ずホーム**だった。
    //    自社の固定パス `/auth/complete` へ送り、戻り先は検証済みの相対URLとして
    //    `next` に載せる（クライアントに絶対URLを指定させない）。
    //    ⚠️ Supabase の Authentication → URL Configuration → Redirect URLs に
    //       `https://www.mens-esthe-map.jp/auth/complete` の許可が必要。
    //       未許可なら Supabase は Site URL（ホーム）へ落とすだけなので、
    //       「戻れない」現状に劣化するだけで壊れはしない。
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo: buildAuthCompleteUrl(returnTo, 'signup') }
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

    // ── 管理者へ新規登録の通知（2026-08-17 追加）──────────────────
    // ⚠️ これまで新規登録の通知が一切なく、誰かが登録しても Supabase を
    //    見に行かない限り気づけなかった（実際 2026-08-08 の初の一般ユーザー登録に
    //    数日間気づいていない）。登録者が2人しかいない段階では、1人増えることが
    //    最重要のイベントなので必ず知らせる。
    // ⚠️ ここで失敗しても**登録自体は成功扱いにする**。通知はおまけであり、
    //    これを理由にユーザー作成をロールバックしてはいけない
    //    （この関数の catch はユーザー削除を行うため、try の外に出さない）。
    try {
      const ADMIN_TO = process.env.CONTACT_TO_EMAIL || 'tugihe1112@gmail.com';
      const jstNow = new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16);
      const adminNotifyResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'メンエスマップ <noreply@mens-esthe-map.jp>',
          to: [ADMIN_TO],
          subject: `【新規登録】${email}`,
          html: `
            <div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;max-width:600px">
              <p style="color:#f472b6;font-weight:bold;letter-spacing:.1em;font-size:12px;margin:0 0 8px">NEW SIGNUP</p>
              <h2 style="color:#fff;margin:0 0 20px;font-size:20px">新しいユーザーが登録しました</h2>
              <table style="width:100%;font-size:14px;line-height:2">
                <tr><td style="color:#94a3b8;width:120px">表示名</td><td style="color:#fff">${escapeHtml(displayName)}</td></tr>
                <tr><td style="color:#94a3b8;width:120px">メール</td><td style="color:#fff">${escapeHtml(email)}</td></tr>
                <tr><td style="color:#94a3b8">登録日時</td><td>${jstNow} JST</td></tr>
                <tr><td style="color:#94a3b8">プラン</td><td>free（自動）</td></tr>
              </table>
              <p style="color:#64748b;font-size:12px;margin-top:20px;line-height:1.8">
                この時点ではまだ「メール確認前」です。確認リンクを踏むまでログインできません。<br>
                投稿があれば別途「新着口コミ」の通知が届きます。
              </p>
              <a href="https://supabase.com/dashboard/project/azuetkuzzmshqfbrhqmf/auth/users"
                 style="display:inline-block;margin-top:16px;background:#ec4899;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;font-size:14px">
                ユーザー一覧を開く
              </a>
            </div>`,
        }),
      });
      if (!adminNotifyResponse.ok) {
        const adminNotifyBody = await adminNotifyResponse.text();
        throw new Error(`管理者への登録通知に失敗: HTTP ${adminNotifyResponse.status} ${adminNotifyBody.slice(0, 200)}`);
      }
    } catch (notifyErr) {
      // 通知の失敗は登録の成否に影響させない
      console.error('[auth/signup] 管理者通知に失敗（登録は成功）:', notifyErr.message);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[auth/signup] error:', err.message);
    // メール送信失敗・特典付与失敗時はユーザーを削除してロールバック。
    // ⚠️ F08: 削除対象は**このリクエストが新しく作った userId** だけ。
    //    既存会員を削除する経路をここに足さないこと。
    if (userId) {
      const { error: rollbackError } = await admin.auth.admin.deleteUser(userId).then(
        (r) => r || {},
        (e) => ({ error: e })
      );
      if (rollbackError) {
        // ⚠️ 後始末そのものが失敗＝「アカウントだけ残って特典もメールも無い」状態。
        //    人手の回復が要るので、探せる形でサーバーログに残す。
        console.error('[auth/signup] ROLLBACK FAILED (needs manual recovery) userId=', userId, rollbackError.message);
      }
    }
    const limiterFailed = err.message?.startsWith('Rate limiter') || err.message === 'Rate limiter is not configured';
    // ⚠️ 2026-09-08: ここは `err.message` をそのまま返していた。
    //    Supabaseやライブラリの英語文・内部パスが利用者と通信経路へ出る。
    //    500 は「利用者が直せない失敗」なので、固定の日本語文だけを返す。
    //    原因の追跡は上の console.error（サーバーログ）で行うこと。
    return res.status(limiterFailed ? 503 : 500).json({
      error: limiterFailed
        ? '現在登録を受け付けられません。時間をおいて再度お試しください。'
        : '登録手続きを完了できませんでした。時間をおいて、もう一度お試しください。解決しない場合はお問い合わせください。',
    });
  }
}
