/**
 * ホームの口コミカードを「その場で全文を開く」ための本文取得（2026-10-04・okabayashi「同じ画面で読めるようにしたい」）。
 *
 * 2026-10-05: ブラウザから Supabase へ直接取りに行くのをやめ、自分のドメインの /api/shops-lite?view=review
 *   （CDN に置く・server/reviewBody.js）から取る。okabayashi「スマホでうまく行ってない／折りたたみが開いて見れない」＝
 *   DB が冷えていると数秒〜10秒近く待たされ、取得に時間の上限も無かった（返事が無いと骨組みのまま永久に開かない）。
 * ⚠️ 10秒で打ち切って失敗にする（画面は「もう一度読み込む」と人物ページへのリンクを出す）。
 * ⚠️ ホームのSSRには全文を載せない（120字の抜粋だけ・check_home_review_loading）。全文は開くときだけ取る。
 * ⚠️ 押してから待たせないように、カードが見えた時点（最新1件）や指・マウスが触れた時点（新着）で
 *    prefetchReviewBody を呼んで先に取っておく。同じ口コミは1回しか取りに行かない。失敗は覚えておかない。
 */
export const REVIEW_BODY_TIMEOUT_MS = 10000;
const cache = new Map();

async function load(id) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), REVIEW_BODY_TIMEOUT_MS) : null;
  try {
    const res = await fetch(`/api/shops-lite?view=review&id=${encodeURIComponent(id)}`, ctrl ? { signal: ctrl.signal } : undefined);
    if (!res.ok) throw new Error(`review body ${res.status}`);
    const b = await res.json();
    if (!b || b.id !== id) throw new Error('review body mismatch');
    return { storySections: b.storySections || null, content: b.content || '' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** 本文を取る。成功は { storySections, content }、失敗（時間切れを含む）は例外 */
export function fetchReviewBody(id) {
  if (!id) return Promise.reject(new Error('no review id'));
  if (!cache.has(id)) {
    const p = load(id).catch((e) => { cache.delete(id); throw e; });
    cache.set(id, p);
  }
  return cache.get(id);
}

/** 先に取っておく（失敗しても何もしない） */
export function prefetchReviewBody(id) {
  if (!id || typeof window === 'undefined') return;
  fetchReviewBody(id).catch(() => {});
}
