/**
 * supabaseRest.js — 手書き REST fetch 用の共通ヘッダー生成
 *
 * 【なぜ必要か（2026-08-12）】
 * ShopDetailPage / ModernReviewCard / AdminPage は Supabase の REST を fetch で直接叩いており、
 * どれも `Authorization: Bearer <anon key>` を**固定で**送っていた。
 * anon キーで送ると PostgREST からは常に `anon` ロール扱いになるため、
 * `TO authenticated` のRLSポリシー（本人・credits保有者・VIP・管理者）が**一切発火しない**。
 *
 * この状態で reviews のSELECTを権限別に締めると（12_のマイグレーション）、
 * ログインしていても非公開口コミが返らず、**W2R（書けば読める）が丸ごと機能しなくなる**。
 * user_credits の残高取得も同じ理由で空になる。
 *
 * → ログイン中はセッションの access_token を、未ログイン時は anon キーを送る。
 *   `apikey` ヘッダーは PostgREST のプロジェクト識別に必要なので常に anon キーのまま。
 *
 * 【本来は】手書き fetch をやめて supabase-js クライアントを使えばJWTは自動で付く。
 *   既存コードの書き換え量が大きいため、まずこのヘルパーで揃える。
 */
import { supabase } from '../lib/supabase';

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

/**
 * ログイン中ならユーザーJWT、未ログインなら anon キーを Authorization に載せたヘッダーを返す。
 * @param {object} extra 追加ヘッダー（Content-Type / Prefer など）
 */
// ⚠️ 期限判定は sessionExpiry.js に切り出してある（CIでテストするため）。
//    ここに戻すと supabase クライアントのimportが邪魔でNodeから読めずテストできなくなる。
export { EXPIRY_MARGIN_SEC, isSessionUnusable } from './sessionExpiry';
import { isSessionUnusable } from './sessionExpiry';

/**
 * ログイン中ならユーザーJWT、未ログインなら anon キーを Authorization に載せたヘッダーを返す。
 *
 * 【事故（2026-08-26）】
 * 以前は `getSession()` の access_token を**期限を見ずにそのまま**送っていた。
 * トークンは1時間で切れるため、ログインしたまま時間が経つと
 * PostgREST が全リクエストに `401 PGRST303 JWT expired` を返す。
 * 呼び出し側は `Array.isArray(data)` で受けており、エラーは配列ではないので
 * **空配列と同じ扱い**になり、画面には「在籍セラピスト情報はありません」と表示された。
 * ＝ **ログインしている人だけ、店舗のキャストが全員消えて見える**。
 * 実測: 匿名キーでは47件返るのに、保存済みJWTでは401で0件だった。
 *
 * 【対処2点】
 * ① 期限が切れて（または切れかけて）いたら **refreshSession() で更新**してから使う。
 * ② それでも駄目なら **anonキーにフォールバックする**。
 *    ⚠️ ここが要点。ログインが切れただけで**公開データまで見えなくなるのは最悪**で、
 *    しかもエラーではなく「データが無い」と表示されるので原因に辿り着けない。
 *    公開データは anon でも読めるのだから、必ず読めるほうに倒す。
 */
export async function authHeaders(extra = {}) {
  let token = SUPABASE_ANON_KEY;
  try {
    const { data } = await supabase.auth.getSession();
    let session = data?.session || null;

    if (isSessionUnusable(session)) {
      // 期限切れ（or 直前）なら更新を試みる
      const { data: refreshed } = await supabase.auth.refreshSession();
      session = refreshed?.session || null;
    }

    // 更新に失敗した場合は anon のまま（＝公開データは必ず読める）
    if (!isSessionUnusable(session)) token = session.access_token;
  } catch {
    /* セッション取得に失敗しても anon で続行する（公開データは読める） */
  }
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}
