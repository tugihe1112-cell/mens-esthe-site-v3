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
export async function authHeaders(extra = {}) {
  let token = SUPABASE_ANON_KEY;
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) token = data.session.access_token;
  } catch {
    /* セッション取得に失敗しても anon で続行する（公開データは読める） */
  }
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}
