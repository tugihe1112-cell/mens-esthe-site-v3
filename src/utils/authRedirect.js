/**
 * authRedirect.js — 「認証をまたいで元のページへ戻す」ための唯一の定義元
 *
 * 【なぜ必要か（2026-09-07 / FIXES.md F01）】
 * 口コミを読み終えた人が「無料登録」を押すと `/register` へ飛び、登録・メール確認を経て
 * **必ずホームに着地していた**。読んでいた口コミには戻れない。
 * 原因は3箇所が別々に戻り先を捨てていたこと:
 *   1. RegisterPage が redirect を受け取らない
 *   2. ログイン⇄登録のリンクが redirect を引き継がない
 *   3. api/auth/signup.js の generateLink が `redirectTo: SITE_URL + '/'` 固定
 *
 * 【用語を増やさない（FIXES.md F01「パラメータ契約」）】
 *   - 画面のURL（/login・/register）のクエリ名は既存の `redirect` に統一する
 *   - 認証確認URLの内部だけ既存の `next` を使う（Supabaseの確認リンク → /auth/complete）
 *   - JS内の変数名は `returnTo`
 *
 * ⚠️ このファイルは **window にも秘密鍵にも依存しない**。
 *    クライアント（React）とサーバー（api/auth/signup.js）の両方から import して、
 *    「クライアントが申告した戻り先」をサーバー側で再検証できるようにするため。
 */

const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

/**
 * 認証系のページ自身を戻り先にしない（ログイン → ログイン のループ防止）。
 * 前方一致で判定する（/auth/confirm?token=... のようにクエリが付くため）。
 */
const AUTH_PATH_PREFIXES = ['/login', '/register', '/auth/confirm', '/auth/complete', '/reset-password'];

const isAuthPath = (pathname) => AUTH_PATH_PREFIXES.some(
  (p) => pathname === p || pathname.startsWith(`${p}/`),
);

/**
 * 制御文字と空白。
 * ⚠️ 正規表現リテラルに生の制御文字を書かないこと（ファイルがバイナリ扱いになり
 *    grep も差分も読めなくなる）。エスケープを文字列で組み立てる。
 */
const CONTROL_OR_SPACE = new RegExp('[\\u0000-\\u0020\\u007F]');

/** 1段だけデコードしてみる。壊れたエスケープは null（＝この判定は行わない） */
const decodeOnce = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

/**
 * 戻り先として安全な「同一サイト内の相対URL」だけを返す。
 *
 * 拒否するもの:
 *   - 文字列でない / 空
 *   - 制御文字・空白（改行によるヘッダー汚染を含む）
 *   - スキーム付き（`javascript:` `data:` `https:` …）
 *   - `/` 以外で始まる（相対パスでない）
 *   - `//evil.example`（プロトコル相対＝外部へ出る）
 *   - バックスラッシュを含む（ブラウザによっては `/` と同じ扱いになる）
 *   - **1段デコードすると上記になるもの**（二重デコード経路での抜けを塞ぐ）
 *   - 解決後の origin が自サイトでない
 *   - 認証ページ自身（ループ）
 *
 * 保存するもの: 日本語・`_`・クエリ・`#review-xxx` のハッシュ。
 * ⚠️ 検証は URL で行うが、**返すのは入力そのまま**。
 *    `new URL()` の pathname は日本語をパーセントエンコードするため、
 *    戻り先の見た目が変わってしまう（動きはするがログと比較が読めなくなる）。
 */
export function normalizeReturnTo(value, fallback = '/') {
  // ⚠️ 空文字の fallback は「戻り先なし」を意味する（リンクに redirect を付けない）。
  //    ここを '/' に丸めると、ヘッダーのログインが常に `?redirect=/` を持ってしまい、
  //    既定の /mypage ではなくホームへ飛ぶ。空文字は空文字のまま返すこと。
  const safeFallback = fallback === ''
    ? ''
    : (typeof fallback === 'string' && fallback.startsWith('/') && !fallback.startsWith('//')
      ? fallback
      : '/');

  if (typeof value !== 'string') return safeFallback;
  const raw = value.trim();
  if (!raw) return safeFallback;

  // `javascript:` `data:` `https:` などスキーム付きは一切許可しない
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return safeFallback;
  if (!raw.startsWith('/')) return safeFallback;

  // 素の値と、1段デコードした値の両方で外部脱出パターンを拒否する
  for (const candidate of [raw, decodeOnce(raw)]) {
    if (typeof candidate !== 'string') continue;
    if (candidate.startsWith('//')) return safeFallback;
    if (candidate.includes('\\')) return safeFallback;
    if (CONTROL_OR_SPACE.test(candidate)) return safeFallback;
  }

  let parsed;
  let site;
  try {
    parsed = new URL(raw, SITE_URL);
    site = new URL(SITE_URL);
  } catch {
    return safeFallback;
  }
  if (parsed.origin !== site.origin) return safeFallback;
  if (isAuthPath(parsed.pathname)) return safeFallback;

  return raw;
}

/**
 * `/register?redirect=...&source=...` のような認証URLを組み立てる。
 * URLSearchParams が1回だけエンコードするので、呼び出し側で encodeURIComponent しないこと
 * （二重エンコードすると戻り先が `%252F...` になって復帰に失敗する）。
 */
export function withReturnTo(basePath, returnTo, extra = {}) {
  const params = new URLSearchParams();
  const normalized = normalizeReturnTo(returnTo, '');
  if (normalized) params.set('redirect', normalized);
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Supabase の確認リンクが戻ってくる自社ページのURL（絶対URL）。
 * ⚠️ クライアントから任意の絶対URLを redirectTo に渡させないため、
 *    パスは固定し、検証済みの相対URLだけを `next` に載せる。
 *
 * ⚠️ 本番では Supabase の Authentication → URL Configuration → Redirect URLs に
 *    `https://www.mens-esthe-map.jp/auth/complete` を許可する必要がある。
 *    未許可なら Supabase は Site URL（＝ホーム）へ落とすので、
 *    「戻れない」だけで壊れはしない（現状と同じ挙動に劣化する）。
 *    ワイルドカードで全 origin を許可してはいけない。
 */
export const AUTH_COMPLETE_PATH = '/auth/complete';

/** 同一サイト内遷移用（相対パス）。full reload を避けたい画面遷移はこちらを使う */
export function authCompletePath(returnTo, intent = 'signup') {
  const params = new URLSearchParams();
  const normalized = normalizeReturnTo(returnTo, '');
  if (normalized) params.set('next', normalized);
  if (intent) params.set('intent', intent);
  const qs = params.toString();
  return `${AUTH_COMPLETE_PATH}${qs ? `?${qs}` : ''}`;
}

/** Supabase の redirectTo に渡す絶対URL */
export function buildAuthCompleteUrl(returnTo, intent = 'signup') {
  return `${SITE_URL.replace(/\/$/, '')}${authCompletePath(returnTo, intent)}`;
}

/** 戻り先が無いときの既定。用途ごとに違う（FIXES.md F01-3） */
export const AUTH_RETURN_TO_FALLBACKS = {
  signup: '/popular-reviews',
  login: '/mypage',
  recovery: '/reset-password',
};
