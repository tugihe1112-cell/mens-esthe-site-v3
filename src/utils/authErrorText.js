/**
 * authErrorText.js — 認証の失敗理由を「利用者向けの説明」へ写す唯一の場所
 *
 * 【なぜ分けたか（2026-09-08）】
 * 1) 以前ログイン画面は `"ログインに失敗しました: " + err.message` を表示していた。
 *    Supabase の英語文がそのまま出て、利用者は次に何をすればいいか分からない。
 * 2) それを直す際、**全部を1つの固定文へ潰した**。今度は「なぜ登録できないのか」が
 *    誰にも分からなくなり、登録が止まっているのに原因を追えなかった（実際に起きた）。
 * どちらも「内部文言を出さない」と「理由を説明する」を同時に満たせなかったのが原因。
 * 分類（このファイル）と表示（画面）を分け、**分類結果は必ず固定の日本語文**に写す。
 *
 * ⚠️ 返す文字列に `err.message` を混ぜないこと。混ぜた瞬間に 1) へ戻る。
 * ⚠️ hint（次の一手）を空にしないこと。原因だけ出しても利用者は動けない。
 * ⚠️ この関数は scripts/ci/check_ssr_helpers.mjs から実際に呼んで検査している。
 *    .jsx に置くと Node から読めず検査できないので、ここ（.js）から動かさない。
 */

/** 分類できなかったときに倒す先。判定漏れが内部文言の露出にならない向きにする。 */
export const AUTH_ERROR_FALLBACK_CODE = 'server';

export const LOGIN_ERROR_TEXT = {
  invalid_credentials: {
    text: 'メールアドレスまたはパスワードが間違っています',
    hint: '入力を確認しても入れない場合は、下の「パスワードを忘れた方」から再設定できます',
  },
  email_not_confirmed: {
    text: 'メールの確認がまだ終わっていません',
    hint: '登録時に届いた確認メールのリンクを押してください。見当たらない場合は迷惑メールフォルダも確認してください',
  },
  rate_limit: {
    text: '試行が続いたため、一時的に受け付けを止めています',
    hint: '数分おいてから、もう一度お試しください',
  },
  network: {
    text: '通信できませんでした',
    hint: '入力内容はそのままです。電波の良い場所で、もう一度お試しください',
  },
  server: {
    text: 'ログインできませんでした',
    hint: '時間をおいて、もう一度お試しください。解決しない場合はお問い合わせください',
  },
};

export const RESET_ERROR_TEXT = {
  rate_limit: {
    text: '再設定メールの送信が続いたため、一時的に受け付けを止めています',
    hint: '数分おいてから、もう一度お試しください',
  },
  network: {
    text: '通信できませんでした',
    hint: '電波の良い場所で、もう一度お試しください',
  },
  server: {
    text: '再設定メールを送信できませんでした',
    hint: '時間をおいて、もう一度お試しください。解決しない場合はお問い合わせください',
  },
};

/**
 * Supabase / fetch の失敗を**分類だけ**する（文言そのものは画面に出さない）。
 * @param {unknown} err
 * @returns {'invalid_credentials'|'email_not_confirmed'|'rate_limit'|'network'|'server'}
 */
export function classifyAuthError(err) {
  const raw = typeof err?.message === 'string' ? err.message : '';
  const status = Number(err?.status) || 0;
  // ⚠️ 順番に意味がある。429 は本文が空のこともあるので status も見る。
  if (/invalid login credentials|invalid credentials/i.test(raw)) return 'invalid_credentials';
  if (/not confirmed/i.test(raw)) return 'email_not_confirmed';
  if (status === 429 || /rate limit|too many requests|for security purposes/i.test(raw)) return 'rate_limit';
  if (/failed to fetch|load failed|network ?error|network request failed/i.test(raw)) return 'network';
  return AUTH_ERROR_FALLBACK_CODE;
}

/** 表から引く。表に無いコードでも必ず固定文言を返す（undefined を画面へ出さない）。 */
function pick(table, code) {
  const entry = table[code] || table[AUTH_ERROR_FALLBACK_CODE];
  return { code, text: entry.text, hint: entry.hint };
}

/** ログイン失敗 → 画面に出す { code, text, hint } */
export function loginErrorFor(err) {
  return pick(LOGIN_ERROR_TEXT, classifyAuthError(err));
}

/** パスワード再設定メールの失敗 → 画面に出す { code, text, hint } */
export function resetErrorFor(err) {
  // 再設定では「パスワードが違う」等は起こらないので、該当しない分類は server へ寄せる。
  const code = classifyAuthError(err);
  return pick(RESET_ERROR_TEXT, RESET_ERROR_TEXT[code] ? code : AUTH_ERROR_FALLBACK_CODE);
}
