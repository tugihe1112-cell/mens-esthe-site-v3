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
 *   5. 系列店をまたぐ同一人物は **名前だけでなく画像URLも一致したとき**に限り束ねる。
 *      → samePersonTherapistIds()。根拠は下の【系列またぎ】。
 *
 * 【系列またぎ（2026-09-13 追加）】
 *   セラピストは系列の複数店に出勤する。行は店ごとに別なので、渋谷店で書かれた口コミが
 *   同じ人の恵比寿店のページに出ない。実測で **5,796人・23,500行**が分断されており、
 *   公開口コミ34件のうち**9件**が既にこれに当たっていた
 *   （ユニゾンスパ相模原の3人・TIGER GATEの6人）。
 *
 *   束ねる鍵は「同じ group_id ＋ 正規化名一致 ＋ 画像URL一致」。
 *   ⚠️ **名前だけで束ねてはいけない。** 同じ店の中に同名のセラピストが複数いる組が
 *      952組あり、うち **352組は画像が違う＝別人の可能性**がある（2026-09-13実測）。
 *      名前だけで束ねると、その別人の口コミが互いのページに出る。
 *      口コミサイトで「他人の評価が自分に付く」のは、取りこぼしより重い事故。
 *   ⚠️ 画像が無い行は束ねない。裏取りができないため。
 *   ✅ 実害の出ていた9件は全員、支店をまたいでも画像が一致していたので、
 *      この慎重な規則でも取りこぼしは無い（実データで確認済み）。
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
  const base = Array.isArray(shopTherapists) ? shopTherapists.filter(Boolean) : [];
  // 🚩 対象人物は**必ず**名簿に入れる。
  //    退店して `therapists` の行が消えていても、その人物IDが入った口コミは本人のもの。
  //    名簿だけを見ると退店者の口コミが全部落ち、退店プロフィールが200を返せなくなる
  //    （2026-09-09、この関数を入れた直後に自分で作りかけた退行）。
  const roster = base.some((t) => String(t?.id) === String(therapist.id)) ? base : [...base, therapist];
  const index = buildTherapistReviewIndex(reviews, roster);
  return reviewsForTherapist(index, therapist.id);
}

/**
 * 同一人物とみなせる人物IDの集合（本人を必ず含む）。
 * @param therapist 対象人物（id・name・image_url）
 * @param candidates 同じ系列に属する人物一覧（id・name・image_url）
 */
export function samePersonTherapistIds(therapist, candidates = []) {
  const self = therapist?.id == null || therapist.id === '' ? '' : String(therapist.id);
  const ids = new Set();
  if (self) ids.add(self);
  const name = normalizeTherapistName(therapist?.name);
  const image = String(therapist?.image_url ?? '').trim();
  // 画像が無い＝裏取りできない。本人だけを返す（名前だけで束ねない）。
  if (!self || !name || !image) return ids;
  for (const c of candidates || []) {
    if (c?.id == null || c.id === '') continue;
    const cid = String(c.id);
    if (cid === self) continue;
    if (normalizeTherapistName(c?.name) !== name) continue;
    if (String(c?.image_url ?? '').trim() !== image) continue;
    ids.add(cid);
  }
  return ids;
}

/**
 * 1人ぶんの口コミを、系列店に散らばった本人の行ぶんまで含めて取り出す。
 * @param therapist 対象人物
 * @param shopTherapists その店舗の人物一覧（旧口コミのfallback判定に使う）
 * @param groupTherapists 同じ系列の人物一覧（同一人物の判定に使う）
 */
export function filterReviewsForPerson(reviews = [], therapist = null, shopTherapists = null, groupTherapists = null) {
  if (!therapist?.id) return [];
  const candidates = Array.isArray(groupTherapists) ? groupTherapists.filter(Boolean) : [];
  const ids = samePersonTherapistIds(therapist, candidates);

  // 索引の名簿には**束ねた本人の行を全部**入れる。
  // 入れ忘れると、その行の口コミが unmatched に落ちて表示されない。
  const base = Array.isArray(shopTherapists) ? shopTherapists.filter(Boolean) : [];
  const roster = [...base];
  const has = (id) => roster.some((t) => String(t?.id) === String(id));
  if (!has(therapist.id)) roster.push(therapist);
  for (const c of candidates) {
    if (c?.id != null && ids.has(String(c.id)) && !has(c.id)) roster.push(c);
  }

  const index = buildTherapistReviewIndex(reviews, roster);
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    for (const r of reviewsForTherapist(index, id)) {
      const key = r?.id ?? `${r?.therapist_id}::${r?.created_at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
  }
  return out.sort((a, b) => String(b?.created_at ?? '').localeCompare(String(a?.created_at ?? '')));
}
