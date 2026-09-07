/**
 * verifyOtpOnce.mjs — 「同じワンタイムトークンを2回検証しない」ための小さな純粋ロジック
 *
 * 【なぜ切り出すか（2026-09-07 / FIXES.md F02）】
 * メール確認ページの不具合は「成功したのに『リンクが無効です』になる」というもので、
 * 原因は effect の再実行によりワンタイムトークンが**2回 verifyOtp される**ことだった。
 * この判定を AuthConfirmPage.jsx（JSX）に埋めるとCIから実行して確かめられない。
 * queryString.js / searchMatch.js / sessionExpiry.js と同じ方針で、
 * **副作用のない部分だけ .mjs に分離して機械で検査する**。
 *
 * 【設計の要点】
 *  - 進行中の Promise 自体を保持して共有する。
 *    「一度呼んだフラグを立てて即 return」では、React 18 StrictMode の
 *    setup → cleanup → setup で **2回目の setup が結果を受け取れず永久に「確認中」** になる。
 *  - reject も必ず結果オブジェクトへ畳む。投げっぱなしにするとスピナーが止まらない。
 */

/**
 * @param {(args: {token_hash: string, type: string}) => Promise<{error?: {message?: string}}>} verify
 *        実際の検証関数（本番では supabase.auth.verifyOtp）
 * @returns {(tokenHash: string, type: string) => Promise<{ok: boolean, message?: string}>}
 */
export function createOtpVerifier(verify) {
  const inflight = new Map();

  return function verifyOnce(tokenHash, type) {
    const key = `${type}|${tokenHash}`;
    if (!inflight.has(key)) {
      inflight.set(
        key,
        Promise.resolve()
          .then(() => verify({ token_hash: tokenHash, type }))
          .then((result) => {
            const error = result?.error;
            return error ? { ok: false, message: error.message || 'verify failed' } : { ok: true };
          })
          .catch((error) => ({ ok: false, message: error?.message || 'unknown' })),
      );
    }
    return inflight.get(key);
  };
}
