// 名前の表記揺れは取得前にDBで揃える。raw name の prefix/ilike や取得後の
// filter は、空白・カナの違いで取得から漏れた人物を復元できない。
export const THERAPIST_NAME_QUERY_MAX_LENGTH = 256;

export async function fetchTherapistsByName(client, nameQuery, { shopIds = null, limit = 500 } = {}) {
  const query = String(nameQuery ?? '').trim();
  if (query.length > THERAPIST_NAME_QUERY_MAX_LENGTH) throw new RangeError('Name query is too long');
  if (!query || (Array.isArray(shopIds) && shopIds.length === 0)) {
    return { data: [], error: null, capped: false };
  }
  const resultLimit = Math.max(1, Math.min(1000, Math.trunc(Number(limit)) || 500));
  const selectedShopIds = shopIds === null ? null : [...new Set(shopIds)].slice(0, 100);
  const { data, error } = await client.rpc('search_therapists_by_normalized_name', {
    p_name_query: query,
    p_shop_ids: selectedShopIds,
    // もう1件取得し、500件の検索では「ちょうど上限」と「上限超過」を区別する。
    p_limit: resultLimit + 1,
  });
  // エラーはSearchPageの既存の再試行導線へ渡す。空の検索結果には変換しない。
  if (error) return { data: null, error, capped: false };
  if (!Array.isArray(data)) throw new TypeError('Invalid therapist search response');
  // PostgREST自身の返却上限は1000件。1001件目が切られても母数を断定しない。
  const capped = data.length > resultLimit || (resultLimit === 1000 && data.length >= 1000);
  return { data: data.slice(0, resultLimit), error: null, capped };
}
