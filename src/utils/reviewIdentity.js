/**
 * reviewIdentity.js — 「その口コミは、この人物のものか」を決める唯一の場所（FIXES.md F04）
 *
 * 【事故】検索・店舗・人物詳細・人物SSRが、それぞれ**名前だけ**で口コミを人物へ割り当てていた。
 *   同名の別人が同じカードに統合され、写真・件数・評価・タグが混ざる。
 *   検索では同名カードを1枚に潰していたため、別人が「1人」として表示されていた。
 *
 * 【契約】
 *   1. 基本キーは `therapist_id`。別IDを名前だけで統合しない。
 *   2. 口コミにIDがある → **そのIDと完全一致した時だけ**その人物の口コミにする。
 *      名前が同じでも異なるIDなら除外する。
 *   3. 口コミにIDが無い（旧データ）→ 同一 `shop_id` ＋ 正規化名が一致し、
 *      **その店舗にその名前の人物が1人だけ**のときに限り結び付ける。複数なら未結合。
 *   4. 同じ人物IDに対する既存の関連付けは、系列店をまたいでも維持する。
 *      異なるIDを「同一人物」とみなす対応表は作らない（推測で作らない）。
 *
 * ⚠️ 拡張子は `.js`。`.mjs` は Vercel の `api/` から require できず、
 *    2026-09-08 に本番を21時間止めている。共有する純粋関数は `.js` に置く。
 * ⚠️ この関数は scripts/ci/check_ssr_helpers.mjs から実際に呼んで検査している。
 */

/** 表記ゆれを吸収した比較用の名前。空白除去＋NFKC＋小文字。 */
export function normalizeTherapistName(name) {
  return String(name ?? '').normalize('NFKC').replace(/[\s　]/g, '').toLowerCase();
}

/** 「どの店舗の、どの名前か」のキー。名前だけのキーは作らない（別店舗の同名が混ざる）。 */
export function therapistNameKey(shopId, name) {
  return `${String(shopId ?? '')}::${normalizeTherapistName(name)}`;
}

const pickShopId = (row) => row?.shop_id ?? row?.shopId ?? '';
const pickTherapistId = (row) => {
  const v = row?.therapist_id ?? row?.therapistId ?? row?.threadId ?? '';
  return v == null ? '' : String(v);
};
const pickTherapistName = (row) => row?.therapist_name ?? row?.therapistName ?? '';

/** 口コミが名指ししている人物ID（無ければ空文字）。 */
export function reviewTherapistId(review) {
  return pickTherapistId(review);
}

/** 店舗×正規化名ごとの人数。1人のときだけ旧口コミのfallbackを許す。 */
export function countSameNameByShop(therapists = []) {
  const counts = new Map();
  for (const t of therapists || []) {
    const key = therapistNameKey(pickShopId(t), t?.name);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/**
 * 口コミを人物IDごとに束ねる。
 * @returns {{ byTherapistId: Map<string, object[]>, unmatched: object[] }}
 */
export function buildTherapistReviewIndex(reviews = [], therapists = []) {
  const byId = new Set();
  const uniqueByNameKey = new Map();
  for (const t of therapists || []) {
    if (t?.id == null || t.id === '') continue;
    byId.add(String(t.id));
    const key = therapistNameKey(pickShopId(t), t?.name);
    if (!uniqueByNameKey.has(key)) uniqueByNameKey.set(key, String(t.id));
  }
  const sameName = countSameNameByShop(therapists);

  const byTherapistId = new Map();
  const unmatched = [];
  const push = (id, review) => {
    if (!byTherapistId.has(id)) byTherapistId.set(id, []);
    byTherapistId.get(id).push(review);
  };

  for (const r of reviews || []) {
    const rid = pickTherapistId(r);
    if (rid) {
      // 契約2: IDがあるなら完全一致だけ。名前一致で拾い直さない。
      if (byId.has(rid)) push(rid, r);
      else unmatched.push(r);
      continue;
    }
    // 契約3: IDが無い旧口コミだけ、同一店舗に同名が1人のときに限る。
    const name = normalizeTherapistName(pickTherapistName(r));
    if (!name) { unmatched.push(r); continue; }
    const key = therapistNameKey(pickShopId(r), pickTherapistName(r));
    if ((sameName.get(key) || 0) === 1 && uniqueByNameKey.has(key)) push(uniqueByNameKey.get(key), r);
    else unmatched.push(r);
  }
  return { byTherapistId, unmatched };
}

/** 索引から1人ぶんを取り出す（無ければ空配列）。 */
export function reviewsForTherapist(index, therapistId) {
  if (!index?.byTherapistId || therapistId == null) return [];
  return index.byTherapistId.get(String(therapistId)) || [];
}

/**
 * 表示用の集計。
 * ⚠️ 未取得と0件を区別するため、`count` は「この索引で確かに数えた件数」。
 *    取得できていない場合は呼び出し側が null を渡し、0件と混同しないこと。
 * ⚠️ 評価が1件も無ければ `rating` は null。0.0 と表示しない。
 */
export function summarizeReviews(list = []) {
  const reviews = Array.isArray(list) ? list : [];
  const tags = new Set();
  let sum = 0;
  let rated = 0;
  for (const r of reviews) {
    for (const tag of r?.tags || []) tags.add(tag);
    const v = Number(r?.rating);
    if (Number.isFinite(v) && v > 0) { sum += v; rated += 1; }
  }
  return { count: reviews.length, tags, rating: rated > 0 ? sum / rated : null };
}

/**
 * 1人ぶんの口コミを直接絞り込む（SSR・単一人物ページ向け）。
 * @param therapist 対象人物（id・shop_id・name）
 * @param shopTherapists その店舗の人物一覧（同名判定に使う。未提供なら対象1人として扱う）
 */
export function filterReviewsForTherapist(reviews = [], therapist = null, shopTherapists = null) {
  if (!therapist?.id) return [];
  const roster = Array.isArray(shopTherapists) && shopTherapists.length ? shopTherapists : [therapist];
  const index = buildTherapistReviewIndex(reviews, roster);
  return reviewsForTherapist(index, therapist.id);
}
