/**
 * queryString.js — URLクエリ更新の純粋ロジック
 *
 * ⚠️ router.js から切り出してある。理由は「テストできるようにするため」。
 *    router.js は JSX（NextLink）を含むので Node から直接読めず、
 *    CI（scripts/ci/check_ssr_helpers.mjs）で検証できなかった。
 *
 * 【背景の事故（2026-08-22）】
 * `/search?shopId=...` を開くと画面がチカチカした。原因は useSearchParams の2つのバグ:
 *   ① 毎レンダーで setParams を作り直していた
 *      → 呼び出し側が依存配列に入れているため毎レンダーで effect が発火
 *   ② オブジェクト形式（`setSearchParams({shop:'x'})`）を無視していた
 *      → 中身が変わらないまま **同じURLへ router.replace** を呼び続けた
 * 結果、実測で **3秒間に400回** の history.replaceState。
 */

/**
 * 現在のクエリ文字列と更新指定から「次のクエリ文字列」を作る。
 *
 * @returns {string|null} 変化が無ければ **null**（＝呼び出し側は replace してはいけない）。
 *                        全て消えた場合は空文字を返す（null とは区別する）。
 *
 * ⚠️ 比較は必ず `URLSearchParams` を通した**正規化後の文字列どうし**で行うこと。
 *    生の文字列比較だと、空白が `+` と `%20` のどちらで来るかといった
 *    エンコードの揺れで「毎回違う」と誤判定し、無限ループに逆戻りする。
 */
export function buildNextQueryString(queryString, nextInit) {
  const currentNormalized = new URLSearchParams(queryString || '').toString();
  const next = new URLSearchParams(typeof nextInit === 'function' ? queryString || '' : undefined);

  if (typeof nextInit === 'function') {
    nextInit(next);
  } else if (typeof URLSearchParams !== 'undefined' && nextInit instanceof URLSearchParams) {
    nextInit.forEach((v, k) => next.append(k, v));
  } else if (Array.isArray(nextInit)) {
    nextInit.forEach(([k, v]) => next.append(k, v));
  } else if (nextInit && typeof nextInit === 'object') {
    // オブジェクト形式（react-router v6 の標準的な使い方）。
    // 以前はこの分岐が無く、オブジェクトで呼ぶと**何も反映されなかった**。
    for (const [k, v] of Object.entries(nextInit)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) v.forEach((x) => next.append(k, String(x)));
      else next.append(k, String(v));
    }
  }

  const nextQs = next.toString();
  return nextQs === currentNormalized ? null : nextQs;
}
