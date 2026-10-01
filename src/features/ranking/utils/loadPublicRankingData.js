const PAGE_SIZE = 500;
const ID_BATCH_SIZE = 100;
const REVIEW_FIELDS = 'id,shop_id,therapist_id,therapist_name,rating,detailed_ratings,created_at,is_public';
const THERAPIST_FIELDS = 'id,shop_id,name,image_url,raw_data';
const SHOP_FIELDS = 'id,name,prefecture:raw_data->>prefecture,city:raw_data->>city,area:raw_data->area';

async function readPages(makeQuery) {
  const rows = [];
  for (let from = 0; from < 1000000; from += PAGE_SIZE) {
    const { data, error } = await makeQuery().order('id').range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!Array.isArray(data)) throw new Error('Invalid ranking response');
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
  throw new Error('Ranking data exceeds pagination limit');
}

async function readByIds(client, table, fields, column, ids) {
  const rows = [];
  for (let from = 0; from < ids.length; from += ID_BATCH_SIZE) {
    const batch = ids.slice(from, from + ID_BATCH_SIZE);
    rows.push(...await readPages(() => client.from(table).select(fields).in(column, batch)));
  }
  return rows;
}

/** Fetch every public rating, with only the referenced shop/profile metadata. No review text or user data. */
export async function loadPublicRankingData(client) {
  const reviews = await readPages(() => client.from('reviews').select(REVIEW_FIELDS).eq('is_public', true));
  if (!reviews.length) return { reviews, shops: [], therapists: [] };
  const shopIds = [...new Set(reviews.map(row => row.shop_id).filter(Boolean))];
  const therapistIds = [...new Set(reviews.map(row => row.therapist_id).filter(Boolean))];
  const legacyShopIds = [...new Set(reviews.filter(row => !row.therapist_id).map(row => row.shop_id).filter(Boolean))];
  const [shops, byId, legacyRoster] = await Promise.all([
    readByIds(client, 'shops', SHOP_FIELDS, 'id', shopIds),
    readByIds(client, 'therapists', THERAPIST_FIELDS, 'id', therapistIds),
    // Name fallback requires the complete shop roster, so duplicate names cannot be mistaken for one person.
    readByIds(client, 'therapists', THERAPIST_FIELDS, 'shop_id', legacyShopIds),
  ]);
  const therapists = [...new Map([...byId, ...legacyRoster].map(row => [row.id, row])).values()];
  return { reviews, shops, therapists };
}
