import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseRest.js';

/**
 * ホームの口コミカードを「その場で全文を開く」ための本文取得（2026-10-04・okabayashi「同じ画面で読めるようにしたい」）。
 *
 * ⚠️ ホームのSSRには全文を載せない（120字の抜粋だけ・check_home_review_loading）。
 *    人物ページとの重複と、トップの重さを避けるため。全文は開いたときにだけ取りに行く。
 * ⚠️ 押してから待たせないように、カードが見えた時点（最新1件）や指・マウスが触れた時点（新着）で
 *    prefetchReviewBody を呼んで先に取っておく。同じ口コミは1回しか取りに行かない。
 * ⚠️ 公開口コミだけ（is_public=true）。ホームに出る口コミはすべて公開分なので、匿名キーで読める。
 * ⚠️ 失敗は「本文なし」と区別して返す（{ error }）。失敗したら覚えておかず、次に押したときに取り直す。
 */
const cache = new Map();

async function load(id) {
  const url = `${SUPABASE_URL}/rest/v1/reviews?id=eq.${encodeURIComponent(id)}&is_public=eq.true&select=id,story_sections,content&limit=1`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
  if (!res.ok) throw new Error(`review body ${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows[0]) throw new Error('review body not found');
  return { storySections: rows[0].story_sections || null, content: rows[0].content || '' };
}

/** 本文を取る。成功は { storySections, content }、失敗は例外 */
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
