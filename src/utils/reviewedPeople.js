/**
 * 口コミがある人（人物ページ）の一覧と、その人の正規URL・内部リンクの組み立て。
 *
 * 🚩 2026-10-10 に本番を測って分かったこと（記事「Claude Opus 5.5 で SEO」の基準で点検）:
 *   1. **同じ人のページが2つずつあった**。13人・28URL。
 *      2026-09-13 に系列店に散らばった同じ人の口コミを合流させた（samePersonTherapistIds）結果、
 *      口コミが書かれていない別ルームの人物ページにも口コミが出るようになり、noindex が外れた。
 *      例: 上野ゆいさん＝相模原（口コミを書いた店）と調布の両方が、同じ中身・自分を正規URLとして
 *      Googleに載せてよい状態だった。D-015 の「重複0人」はサイトマップの中だけを数えていた。
 *      → 同じ人のページは**1つを正規URLにして、ほかは正規URLを指す印**を付ける（新しいURLは作らない）。
 *   2. **口コミページへの本文からのリンクが少なかった**。74枚すべてが5本未満（平均1.8本）。
 *      トップ・みんなの口コミ・県ページの「新しい順N件」の枠からのリンクは、次の口コミが入ると消える。
 *      → 県ページに「口コミがある人」の全員を、人物ページに「ほかの口コミ」を4人ずつ、消えない形で出す。
 *
 * ⚠️ 正規URLの決め方は **ここ1か所**。サイトマップ（api/sitemap.xml.js）・人物ページの
 *    canonical・県ページ／人物ページのリンクが同じ関数を通る。別々に書くと、
 *    「サイトマップに出したURLが、自分ではない正規URLを名乗る」食い違いが静かに生まれる。
 * ⚠️ 依存は reviewIdentity.js だけ（api/ から import されるので `.js`・副作用なし）。
 */
import { normalizeTherapistName } from './reviewIdentity.js';

/** サイトマップ・リンクに出してはいけないID（テスト/ダミー・手入力の合成ID）。sitemap と同じ規則。 */
export const EXCLUDED_ID_PATTERNS = [/^test_/i, /^demo_/i, /^sample_/i, /_test$/i, /^manual_/i];
export const isExcludedId = (id) => !id || EXCLUDED_ID_PATTERNS.some((re) => re.test(String(id)));

/** 人物ページのパス（エンコードはしない＝呼び出し側の Link / sitemap の encodeURI に任せる）。 */
export const personPagePath = (shopId, therapistId) => `/shops/${shopId}/threads/${therapistId}`;

/** 都道府県の並び（JIS順）。「ほかの口コミ」で近い県の人が隣に並ぶようにするため。 */
export const PREFECTURE_ORDER = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
  '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];
const prefRank = (pref) => {
  const i = PREFECTURE_ORDER.indexOf(String(pref || ''));
  return i < 0 ? PREFECTURE_ORDER.length : i;
};

const timeOf = (v) => String(v || '');

/**
 * 1人ぶんの口コミから、正規URLにするページを選ぶ。
 * 規則: **いちばん古い口コミが書かれたページ**（同時刻なら パスの文字順）。
 *   - 新しい口コミが入っても変わらない（正規URLがころころ変わると Google が混乱する）。
 *   - サイトマップは「口コミが書かれたページ」だけを出すので、必ずその中の1つになる。
 * therapist_id の無い口コミ（指名なし）は選ばない。どれも無ければ null。
 */
export function pickCanonicalPersonPage(reviews = []) {
  let best = null;
  for (const r of Array.isArray(reviews) ? reviews : []) {
    const shopId = r?.shop_id ?? r?.shopId;
    const therapistId = r?.therapist_id ?? r?.therapistId;
    if (!shopId || !therapistId) continue;
    if (isExcludedId(shopId) || isExcludedId(therapistId)) continue;
    const path = personPagePath(shopId, therapistId);
    const at = timeOf(r?.created_at ?? r?.createdAt);
    if (!best || at < best.at || (at === best.at && path < best.path)) {
      best = { shopId: String(shopId), therapistId: String(therapistId), path, at };
    }
  }
  return best ? { shopId: best.shopId, therapistId: best.therapistId, path: best.path } : null;
}

/**
 * 公開口コミから「口コミがある人」の一覧を作る。
 *
 * 同じ人の決め方は人物ページと同じ考え方（reviewIdentity.js の samePersonTherapistIds）:
 *   **同じ系列（group_id、無ければ店舗id）の中で、正規化した名前が同じなら同じ人**。
 *   名前は口コミに書かれた therapist_name（無ければ therapist_id）。
 *
 * @param {Array<{shop_id, therapist_id, therapist_name, created_at}>} reviews 公開口コミ
 * @param {{ shopsById: Record<string, {id, name, group_id, prefecture, area}> }} opts
 * @returns {Array<{ key, name, groupKey, canonicalPath, pages: string[], shopId, shopName,
 *   prefecture, area, reviewCount, firstAt, lastAt }>}
 */
export function buildReviewedPeople(reviews = [], { shopsById = {} } = {}) {
  const byKey = new Map();
  for (const r of Array.isArray(reviews) ? reviews : []) {
    const shopId = r?.shop_id;
    const therapistId = r?.therapist_id;
    if (!shopId || !therapistId) continue;
    if (isExcludedId(shopId) || isExcludedId(therapistId)) continue;
    const shop = shopsById[shopId] || null;
    const groupKey = String(shop?.group_id || shopId);
    const nameKey = normalizeTherapistName(r?.therapist_name || therapistId);
    if (!nameKey) continue;
    const key = `${groupKey}::${nameKey}`;
    if (!byKey.has(key)) byKey.set(key, { key, groupKey, reviews: [] });
    byKey.get(key).reviews.push(r);
  }

  const people = [];
  for (const { key, groupKey, reviews: list } of byKey.values()) {
    const canonical = pickCanonicalPersonPage(list);
    if (!canonical) continue;
    const pages = [...new Set(list.map((r) => personPagePath(r.shop_id, r.therapist_id)))].sort();
    const canonicalReview = list.find((r) => personPagePath(r.shop_id, r.therapist_id) === canonical.path) || list[0];
    const shop = shopsById[canonical.shopId] || null;
    const times = list.map((r) => timeOf(r.created_at)).sort();
    const area = Array.isArray(shop?.area) ? shop.area[0] : shop?.area;
    people.push({
      key,
      groupKey,
      name: String(canonicalReview?.therapist_name || canonical.therapistId),
      canonicalPath: canonical.path,
      pages,
      shopId: canonical.shopId,
      shopName: shop?.name || '',
      prefecture: shop?.prefecture || '',
      area: area || '',
      reviewCount: list.length,
      firstAt: times[0] || '',
      lastAt: times[times.length - 1] || '',
    });
  }
  return people.sort((a, b) => (a.canonicalPath < b.canonicalPath ? -1 : a.canonicalPath > b.canonicalPath ? 1 : 0));
}

/** 人物ページのパス → その人の正規URL。口コミの無い人のページは入らない。 */
export function canonicalPathMap(people = []) {
  const map = new Map();
  for (const p of people) for (const path of p.pages || []) map.set(path, p.canonicalPath);
  return map;
}

/**
 * 「ほかの口コミ」の並び順。県（JIS順）→ 県の中は**系列を交互に**並べる。
 * 交互にするのは、同じ店の人が隣どうしになると「同じ店の他のセラピスト」と同じリンクを
 * 重ねて出すだけになり、別の店のページからのリンクが増えないため。
 */
export function orderPeopleForRing(people = []) {
  const byPref = new Map();
  for (const p of people) {
    const pref = p.prefecture || '';
    if (!byPref.has(pref)) byPref.set(pref, []);
    byPref.get(pref).push(p);
  }
  const prefs = [...byPref.keys()].sort((a, b) => prefRank(a) - prefRank(b) || (a < b ? -1 : a > b ? 1 : 0));
  const out = [];
  for (const pref of prefs) {
    const groups = new Map();
    for (const p of byPref.get(pref)) {
      if (!groups.has(p.groupKey)) groups.set(p.groupKey, []);
      groups.get(p.groupKey).push(p);
    }
    const queues = [...groups.keys()].sort().map((g) => groups.get(g).slice().sort((a, b) =>
      (a.firstAt < b.firstAt ? -1 : a.firstAt > b.firstAt ? 1 : 0)
      || (a.canonicalPath < b.canonicalPath ? -1 : a.canonicalPath > b.canonicalPath ? 1 : 0)));
    for (let round = 0; queues.some((q) => q.length > round); round += 1) {
      for (const q of queues) if (q[round]) out.push(q[round]);
    }
  }
  return out;
}

/**
 * ある人のページに出す「ほかの口コミ」＝並び順で**後ろに続く k 人**（末尾から先頭へ回る）。
 * 性質: 全員が **ちょうど min(k, 人数-1) 本**、ほかの人物ページからこの枠のリンクを受ける。
 *       （各人は「前の k 人」から指される。並び順は日々変わっても本数は変わらない＝消えないリンク）
 * 一覧に居ない人（口コミの無いページ）には何も出さない。
 */
export function ringNeighbors(ordered = [], key, k = 4) {
  const n = ordered.length;
  const idx = ordered.findIndex((p) => p.key === key);
  if (idx < 0 || n < 2) return [];
  const out = [];
  for (let step = 1; step <= Math.min(k, n - 1); step += 1) out.push(ordered[(idx + step) % n]);
  return out;
}

/** 県の「口コミがある人」。新しい口コミが入った人から。 */
export function peopleInPrefecture(people = [], prefName) {
  return people
    .filter((p) => p.prefecture === prefName)
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : a.lastAt > b.lastAt ? -1 : 0)
      || (a.canonicalPath < b.canonicalPath ? -1 : a.canonicalPath > b.canonicalPath ? 1 : 0));
}

/** 画面に渡す最小の形（props は HTML に焼かれるので項目を絞る）。 */
export const personLinkProps = (p) => ({
  path: p.canonicalPath,
  name: p.name,
  shopName: p.shopName,
  prefecture: p.prefecture,
  area: p.area,
});
