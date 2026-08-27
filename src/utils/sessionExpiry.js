/**
 * sessionExpiry.js — ログインセッションの期限判定（純粋関数）
 *
 * ⚠️ supabaseRest.js から切り出してある。理由は「CIでテストできるようにするため」。
 *    supabaseRest.js は supabase クライアントを import しており、
 *    環境変数が無いNodeからは読み込めずCIで検証できなかった。
 *
 * 【背景の事故（2026-08-26）】
 * ログイン中に店舗ページのキャストが「全0人・在籍セラピスト情報はありません」になった。
 * 実測すると、匿名キーでは47件返るのに、保存済みJWTでは
 * **401 PGRST303 JWT expired** で0件だった。
 * `authHeaders()` が**期限を見ずに**保存済みトークンを送っていたため、
 * トークンが切れた瞬間から全RESTが401になり、呼び出し側は
 * `Array.isArray(data)` で受けているので**エラーではなく「データ無し」**として描画されていた。
 * ＝ ログインしている人だけ、店舗のキャストが全員消えて見える。
 */

/** 期限切れ扱いにする余裕（秒）。通信中に切れるのを避けるため少し手前で更新する */
export const EXPIRY_MARGIN_SEC = 60;

/**
 * セッションが「使えない（期限切れ・切れかけ・トークン無し）」かを判定する。
 * @param {{access_token?:string, expires_at?:number}|null|undefined} session
 * @param {number} nowSec 現在時刻（秒）。テスト用に注入できる
 */
export function isSessionUnusable(session, nowSec = Math.floor(Date.now() / 1000)) {
  if (!session || !session.access_token) return true;
  if (typeof session.expires_at !== 'number') return false; // 期限不明なら使ってみる
  return session.expires_at - EXPIRY_MARGIN_SEC <= nowSec;
}
