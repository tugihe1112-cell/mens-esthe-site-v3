/**
 * homeReviews.js — ホーム「最新の実体験口コミ」欄（呼水）の組み立て。
 * SSR（pages/index.jsx）と画面（src/components/HomeReviewsSection.jsx）が**同じ関数を通る**ようにここへ置く。
 *
 * 【欄の形（2026-09-22 作り直し）】
 *   件数バッジ（直近30日） → 地域チップ（すべて／県） → 最新1件（大） → ほかの新着6件 → もっと読む → 中立宣言
 *   チップは欄全体の絞り込み。「すべて」が初期表示で、県を選ぶと最新1件も新着もその県だけになる。
 *
 * 【なぜ作り直したか】
 *   以前は「最新1件＋選んだ県の最大2件」で、画面に出る口コミは最大3件だった（しかも東京は1件に減っていた）。
 *   呼水＝「このサイトでは口コミが投稿され続けている」と一目で分かることが役目なので、件数を見せる。
 *   ただし同じ店の口コミは続けて投稿される（虎ノ門の1店だけで6件が同日）ので、
 *   **1店舗2件まで**にして欄が1店で埋まらないようにする。
 *
 * 🚩 件数は「数えられた数字」だけを出す。取得上限で切れた数字を件数として出さない
 *    （「キャスト 1000件」が実は `.limit(1000)` だった事故と同じ型にしない）。
 * ⚠️ 県を選んで口コミが1件しかないなら1件のまま。他の県の口コミで埋めない（「その地域の口コミ」でなくなる）。
 */

/** 最新1件の下に並べる件数 */
export const FEED_CARDS = 6;
/** 1つの並び（すべて／県ごと）でSSRが渡す件数＝最新1件＋FEED_CARDS */
export const FEED_SENT = FEED_CARDS + 1;
/** 同じ店舗から並べる上限 */
export const PER_SHOP_MAX = 2;
/** 地域チップに出す県の数 */
export const MAX_PREFS = 6;
/** SSRが本文つきで読む新着の件数（県ごとの並びもこの範囲から作る） */
export const FEED_FETCH = 60;
/** 件数を数えるために読む口コミの上限（本文は読まない。PostgRESTの1回の上限） */
export const REVIEW_INDEX_LIMIT = 1000;
/** 「直近30日でN件」を出す最小件数。少ない数字を掲げると過疎の宣伝になる */
export const LIVE_BADGE_MIN = 3;
/** 直近件数の期間（日） */
export const LIVE_WINDOW_DAYS = 30;
/** 好みの県を覚えておくキー（口コミを開いた県を、次回チップの先頭へ） */
export const PREFERRED_PREF_KEY = 'preferredReviewPref';

const timeOf = (rv) => {
  const t = new Date(rv?.createdAt || 0).getTime();
  return Number.isFinite(t) ? t : 0;
};
const byNewest = (a, b) => timeOf(b) - timeOf(a);

/**
 * 新しい順に並べ、同じ店舗は max 件までにして limit 件を返す。
 * 上限で後回しにした口コミは、件数が足りないときだけ使う（口コミの少ない県を削らない）。
 * 店舗が分からない口コミは1件ずつ別の店として扱う。
 */
export function capPerShop(list, { max = PER_SHOP_MAX, limit = FEED_SENT } = {}) {
  const src = (Array.isArray(list) ? list : []).filter(Boolean).slice().sort(byNewest);
  const kept = [];
  const deferred = [];
  const perShop = new Map();
  for (const rv of src) {
    if (kept.length >= limit) break;
    const key = rv.shopId || `__review:${rv.id}`;
    const n = perShop.get(key) || 0;
    if (n < max) {
      kept.push(rv);
      perShop.set(key, n + 1);
    } else {
      deferred.push(rv);
    }
  }
  if (kept.length < limit) kept.push(...deferred.slice(0, limit - kept.length));
  return kept.sort(byNewest);
}

/** 「すべて」の並び（SSR用）。全県の新着から1店舗2件までで FEED_SENT 件。 */
export function buildLatestFeed(mapped) {
  return capPerShop(mapped);
}

/**
 * 新しい順の口コミを県ごとにまとめる（SSR用）。
 * 県は口コミの多い順（同数なら新しい口コミがある県が先）、最大 MAX_PREFS 県。県が分からない口コミは入れない。
 * @param {Array} mapped 新しい順の口コミ（FEED_FETCH 件の範囲）
 * @param {{ slugOf?: (pref: string) => string|null, totals?: Record<string, number>|null }} [opts]
 *   totals … 県ごとの**全件数**。数えられなかったときは null（画面は件数を出さない）
 * @returns {Array<{ pref: string, slug: string|null, total: number|null, reviews: Array }>}
 */
export function groupReviewsByPref(mapped, { slugOf = () => null, totals = null } = {}) {
  const byPref = new Map();
  for (const rv of Array.isArray(mapped) ? mapped : []) {
    if (!rv || !rv.prefecture) continue;
    if (!byPref.has(rv.prefecture)) byPref.set(rv.prefecture, []);
    byPref.get(rv.prefecture).push(rv);
  }
  return [...byPref.entries()]
    .map(([pref, list]) => {
      const total = totals && Number.isInteger(totals[pref]) ? totals[pref] : null;
      return {
        pref,
        slug: slugOf(pref) || null,
        total,
        reviews: capPerShop(list),
        // 並べ替え専用（propsには載せない）
        _rank: total ?? list.length,
        _newest: timeOf(list[0]),
      };
    })
    .sort((a, b) => b._rank - a._rank || b._newest - a._newest)
    .slice(0, MAX_PREFS)
    .map(({ _rank, _newest, ...block }) => block);
}

/**
 * 公開口コミの索引（shop_id, created_at を新しい順に REVIEW_INDEX_LIMIT 件まで）から件数を出す（SSR用）。
 * @param {Array<{shop_id?: string, created_at?: string}>|null} rows
 * @param {{ total?: number|null, prefOf?: (shopId: string) => string|null, now?: number }} [opts]
 *   total … `count: 'exact'` の全件数。取れなかったら null
 * @returns {{ total: number|null, recent: number|null, prefTotals: Record<string, number>|null }}
 *   数えきれなかった数字は null。
 */
export function summarizeReviewIndex(rows, { total = null, prefOf = () => null, now = Date.now() } = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const exactTotal = Number.isInteger(total) ? total : null;
  // 索引を全部読めたか（上限で切れていないか）
  const complete = exactTotal !== null && list.length >= exactTotal;
  const since = now - LIVE_WINDOW_DAYS * 86400000;
  let recent = 0;
  let oldest = Infinity;
  const prefTotals = {};
  for (const row of list) {
    const t = new Date(row?.created_at || 0).getTime();
    if (Number.isFinite(t)) {
      if (t >= since) recent += 1;
      if (t < oldest) oldest = t;
    }
    const pref = row?.shop_id ? prefOf(row.shop_id) : null;
    if (pref) prefTotals[pref] = (prefTotals[pref] || 0) + 1;
  }
  return {
    total: exactTotal,
    // 上限で切れていても、読んだ範囲が期間より前まで届いていれば期間内は数えきれている
    recent: exactTotal !== null && (complete || oldest < since) ? recent : null,
    prefTotals: complete ? prefTotals : null,
  };
}

/** 並びの先頭に出す「最新1件」（画面用） */
export function pickLeadReview(list) {
  return (Array.isArray(list) ? list : []).filter(Boolean).slice().sort(byNewest)[0] || null;
}

/** 最新1件の下に並べる口コミ＝最新1件を除いて最大 FEED_CARDS 件（画面用） */
export function pickFeedReviews(list, leadId) {
  return (Array.isArray(list) ? list : [])
    .filter((rv) => rv && rv.id !== leadId)
    .slice(0, FEED_CARDS);
}

/** 前に口コミを開いた県のチップを「すべて」の次へ移す（画面用・選択はしない） */
export function orderPrefs(blocks, preferred) {
  const arr = Array.isArray(blocks) ? blocks : [];
  const idx = preferred ? arr.findIndex((b) => b?.pref === preferred) : -1;
  return idx > 0 ? [arr[idx], ...arr.filter((_, i) => i !== idx)] : arr;
}
