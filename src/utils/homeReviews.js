/**
 * homeReviews.js — ホーム「最新の実体験口コミ」欄の組み立て。
 * SSR（pages/index.jsx）と画面（src/pages/Home.jsx）が**同じ関数を通る**ようにここへ置く。
 *
 * 【欄の形（U02・docs/uiux-audit-2026-09-06/DESIGN.md）】
 *   最新1件 → 中立宣言 → 地域別（選んだ地域の最大2件。最新1件と同じ口コミは除く）
 *
 * 🐛【2026-09-22 直した食い違い】
 *   SSRは各県を「最新2件」に切ってから渡し、画面はそこから「最新1件と同じ口コミ」を除いていた。
 *   最新1件はほぼ必ず口コミの多い県（東京）から出るので、**初期表示の地域が 2−1＝1件**になっていた。
 *   東京の公開口コミは21件あり、足りないのではない。2つの判断（07-16の「各県2件」と
 *   09-09の「最新と重複を除く」）はそれぞれ正しく、**組み合わさったところで1件落ちていた**。
 *   ⇒ SSRは「地域の表示件数＋1」件を渡す。除いたあとでも表示件数が残る。
 *   ⚠️ 本当に口コミが1件しかない地域は1件のまま（他の地域で埋めない＝U02の決まり）。
 */

/** 地域別に並べる件数（U02: 最大2件） */
export const REGION_CARDS = 2;
/** SSRが1県あたりに渡す件数＝表示件数＋最新1件と重複したとき除く1件 */
export const REVIEWS_PER_PREF_SENT = REGION_CARDS + 1;
/** 地域の選択肢に出す県の数 */
export const MAX_PREFS = 4;

/**
 * 新しい順に並んだ口コミを県ごとにまとめる（SSR用）。県は口コミ数の多い順、最大 MAX_PREFS 県。
 * 県が分からない口コミは入れない（0件の県は構造的に出ない）。
 * @param {Array<{prefecture?: string}>} mapped 新しい順の口コミ
 * @param {{ slugOf?: (pref: string) => string|null }} [opts]
 */
export function groupReviewsByPref(mapped, { slugOf = () => null } = {}) {
  const byPref = {};
  for (const rv of Array.isArray(mapped) ? mapped : []) {
    if (!rv || !rv.prefecture) continue;
    (byPref[rv.prefecture] = byPref[rv.prefecture] || []).push(rv);
  }
  return Object.entries(byPref)
    .map(([pref, list]) => ({
      pref,
      slug: slugOf(pref) || null,
      count: list.length,
      reviews: list.slice(0, REVIEWS_PER_PREF_SENT),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_PREFS);
}

/** 欄の先頭に出す「最新1件」＝全県の中でいちばん新しい口コミ（画面用） */
export function pickLeadReview(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .flatMap((block) => block?.reviews || [])
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
}

/** 選んだ地域に並べる口コミ＝最新1件と同じものを除いて最大 REGION_CARDS 件（画面用） */
export function pickRegionReviews(block, leadId) {
  return (block?.reviews || [])
    .filter((review) => review.id !== leadId)
    .slice(0, REGION_CARDS);
}
