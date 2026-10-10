/**
 * 口コミがある人の一覧（全国）を SSR で読む。県ページの「口コミがある人」と
 * 人物ページの「ほかの口コミ」・正規URLの対応表に使う。組み立ては src/utils/reviewedPeople.js。
 *
 * ⚠️ 取得条件はサイトマップ（api/sitemap.xml.js）と同じ: is_public か owner_manual、therapist_id あり。
 *    ここがずれると「サイトマップに出ている人がリンクに出ない／その逆」になる。
 * ⚠️ 取れなかったら前回の値、それも無ければ空の配列。**ページは落とさない**（リンクの枠が出ないだけ）。
 */
import { buildReviewedPeople } from '../src/utils/reviewedPeople.js';

const TTL_MS = 2 * 60 * 1000;
let cache = { at: 0, value: null, pending: null };

async function fetchAll(supabase) {
  const reviews = [];
  for (let from = 0; ; from += 1000) {
    const page = await supabase
      .from('reviews')
      .select('id, shop_id, therapist_id, therapist_name, created_at')
      .or('is_public.eq.true,user_id.eq.owner_manual')
      .not('therapist_id', 'is', null)
      .order('id')
      .range(from, from + 999);
    if (page.error) throw page.error;
    reviews.push(...(page.data || []));
    if (!page.data || page.data.length < 1000) break;
    if (reviews.length >= 100000) break; // 暴走ガード
  }
  const shopIds = [...new Set(reviews.map((r) => r.shop_id).filter(Boolean))];
  const shopsById = {};
  for (let i = 0; i < shopIds.length; i += 150) {
    const { data, error } = await supabase
      .from('shops')
      .select('id, name, group_id, prefecture:raw_data->>prefecture, area:raw_data->area')
      .in('id', shopIds.slice(i, i + 150));
    if (error) throw error;
    for (const s of data || []) shopsById[s.id] = s;
  }
  return buildReviewedPeople(reviews, { shopsById });
}

export async function loadReviewedPeople(supabase, { now = Date.now() } = {}) {
  if (cache.value && now - cache.at < TTL_MS) return cache.value;
  if (!cache.pending) {
    cache.pending = fetchAll(supabase)
      .then((value) => { cache = { at: Date.now(), value, pending: null }; return value; })
      .catch((e) => { cache = { ...cache, pending: null }; throw e; });
  }
  try {
    return await cache.pending;
  } catch (e) {
    console.error('[reviewedPeople]', e?.message || e);
    return cache.value || [];
  }
}

export function resetReviewedPeopleCache() {
  cache = { at: 0, value: null, pending: null };
}
