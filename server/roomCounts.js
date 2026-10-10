/**
 * ルームが2つ以上あるブランド（group_id）のルーム数。SSR がリンク先を決めるのに使う。
 *
 * 🚩 2026-10-10 本番の点検で、**押すと301で別のURLへ転送されるリンク**が21か所・118本あった
 *    （トップ → /shops/aichi_osu_tiger_eye → /brands/g_brand_tiger_eye など）。
 *    原因は1つ: 画面のリンクは `shopHref(shop, roomCounts)` で決めているが、roomCounts は
 *    DataContext がブラウザで全店を読み込んでから数える。**最初のHTML（SSR）の時点では空**なので、
 *    複数ルームのブランドでも店舗URL（＝301する）に倒れていた。Google が読むのはこの最初のHTML。
 *    → SSR でルーム数を取り、props（ssrRoomCounts）→ _app → DataProvider の初期値に渡す。
 *
 * ⚠️ 返すのは**2ルーム以上**のブランドだけ（shopHref が見るのは「2以上か」だけ。1ルームは載せても
 *    結果が同じで、HTMLを膨らませるだけ）。
 * ⚠️ 全店から数えること。県や検索結果で絞った店から数えると、県をまたぐブランドが1ルームに見える
 *    （2026-09-16 に THE HALF で実際に起きた）。
 * ⚠️ 取れなかったら空のオブジェクトを返す＝今までと同じ（店舗URLに倒れる）。ページを落とさない。
 */
import { countRoomsByBrand } from '../src/utils/brandGroups.js';

const TTL_MS = 5 * 60 * 1000;
let cache = { at: 0, value: null, pending: null };

async function fetchAll(supabase) {
  // ⚠️ PostgREST は1回に最大1000行。店舗は1,000件を超えているので必ず繰る。
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const page = await supabase.from('shops').select('id, group_id').not('group_id', 'is', null).order('id').range(from, from + 999);
    if (page.error) throw page.error;
    rows.push(...(page.data || []));
    if (!page.data || page.data.length < 1000) break;
    if (rows.length >= 50000) break; // 暴走ガード
  }
  const out = {};
  for (const [gid, n] of countRoomsByBrand(rows)) if (n > 1) out[gid] = n;
  return out;
}

/** { [group_id]: ルーム数 }（2以上だけ）。取れなければ前回の値、それも無ければ {}。 */
export async function loadMultiRoomCounts(supabase, { now = Date.now() } = {}) {
  if (cache.value && now - cache.at < TTL_MS) return cache.value;
  if (!cache.pending) {
    cache.pending = fetchAll(supabase)
      .then((value) => { cache = { at: Date.now(), value, pending: null }; return value; })
      .catch((e) => { cache = { ...cache, pending: null }; throw e; });
  }
  try {
    return await cache.pending;
  } catch (e) {
    console.error('[roomCounts]', e?.message || e);
    return cache.value || {};
  }
}

/** テスト用: 手元の値を消す。 */
export function resetMultiRoomCountsCache() {
  cache = { at: 0, value: null, pending: null };
}
