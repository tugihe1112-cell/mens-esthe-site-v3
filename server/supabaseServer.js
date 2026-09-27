/**
 * supabaseServer.js — ページのSSR（getServerSideProps）が DB を読むときの Supabase クライアント
 *
 * 【なぜ（2026-09-27 に本番が約2時間止まった）】
 * DB が固まって返事をしなくなったとき、本番のトップ・店舗・ブランド・エリアのページが
 * 35秒以上待ち続けた（実測）。各ページには「DBの取得に失敗したら 503（しばらくお待ちください）」の
 * 仕組みがあるのに、**返事が来ない場合は失敗にならない**ので、その仕組みに届かなかった。
 * → DB への問い合わせ1本ごとに時間の上限を付け、上限を超えたら失敗として返す。
 *   失敗は各ページの `if (error) throw error` → catch → 503 の既存の経路にそのまま乗る。
 *
 * 【上限を10秒にした理由】 無料プランの DB は、しばらく使われないと1本に数秒かかる（2026-09-24 実測で最長9.6秒）。
 *  短くしすぎると「遅いが返ってくる」ページまで 503 にしてしまう。
 *
 * ⚠️ 拡張子は .js（.mjs は Vercel の関数から require できず本番が落ちた＝2026-09-08）。
 */
import { createClient } from '@supabase/supabase-js';

export const SSR_DB_TIMEOUT_MS = 10000;

/** fetch に時間の上限を付ける。呼び出し側の signal があればどちらか早い方で止める。 */
export function timedFetch(ms = SSR_DB_TIMEOUT_MS, baseFetch = (...a) => fetch(...a)) {
  return (input, init = {}) => {
    const timeout = AbortSignal.timeout(ms);
    const signal = init.signal && typeof AbortSignal.any === 'function' ? AbortSignal.any([init.signal, timeout]) : timeout;
    return baseFetch(input, { ...init, signal }).catch((e) => {
      // 🚩 時間切れは TimeoutError で届く。postgrest-js（2.103）は AbortError 以外の失敗を「通信の失敗」とみて
      //    1・2・4秒あけて3回やり直すので、10秒の上限が 10×4＋7＝47秒になった（2026-09-27 手元で実測）。
      //    時間切れは「中止」として返し、やり直させない。
      if (timeout.aborted && !init.signal?.aborted) {
        const err = new Error(`DB の返事が ${ms}ms 以内に来ませんでした`);
        err.name = 'AbortError';
        err.cause = e;
        throw err;
      }
      throw e;
    });
  };
}

/** SSR 用のクライアント。key は各ページが今まで渡していたもの（サービスロールか匿名キー）をそのまま渡す。 */
export function createServerSupabase(key, ms = SSR_DB_TIMEOUT_MS) {
  return createClient(process.env.VITE_SUPABASE_URL || '', key || '', { global: { fetch: timedFetch(ms) } });
}
