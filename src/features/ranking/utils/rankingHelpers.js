import { buildTherapistReviewIndex, reviewTherapistId } from '../../../utils/reviewIdentity.js';
import { shopAreaList } from '../../../utils/shopFields.js';

export const MIN_REVIEWS_FOR_RANKING = 3;

export const RANKING_CATEGORIES = [
  { id: 'total', label: '総合' },
  { id: 'looks', label: 'ルックス' },
  { id: 'style', label: 'スタイル' },
  { id: 'service', label: '接客' },
  { id: 'massage', label: '技術' },
  { id: 'intimacy', label: '密着度' },
];

export function isWithinPeriod(dateString, days, now = Date.now()) {
  const date = new Date(dateString).getTime();
  return Number.isFinite(date) && date <= now && date >= now - days * 86400000;
}

function validRating(value) {
  if (value === null || value === undefined || value === '') return null;
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

function matchesArea(shop, area) {
  if (!area || area === '全国') return true;
  const location = [...shopAreaList(shop), shop.city || '', shop.prefecture || ''].join(' ').toLowerCase();
  return location.includes(area.toLowerCase());
}

/** Public metadata only; identity follows the same ID contract as review pages. */
export function aggregateRankingData(reviews = [], shops = [], therapists = [], options = {}) {
  const { period = 'all', category = 'total', area = '全国', now = Date.now(), minReviews = MIN_REVIEWS_FOR_RANKING } = options;
  const shopById = new Map(shops.map(shop => [String(shop.id), shop]));
  const seen = new Set();
  const scopedReviews = reviews.filter(review => {
    if (review.is_public !== true || !review.id || seen.has(review.id)) return false;
    seen.add(review.id);
    const shop = shopById.get(String(review.shop_id));
    if (!shop || !matchesArea(shop, area)) return false;
    if (period === 'monthly' && !isWithinPeriod(review.created_at, 30, now)) return false;
    if (period === 'weekly' && !isWithinPeriod(review.created_at, 7, now)) return false;
    return true;
  });

  const roster = [...therapists];
  const therapistById = new Map(roster.map(therapist => [String(therapist.id), therapist]));
  // A retired profile can still have public reviews. Keep its exact ID, never a name substitute.
  for (const review of scopedReviews) {
    const id = reviewTherapistId(review);
    if (!id || id.startsWith('manual_') || therapistById.has(id)) continue;
    if (!review.therapist_name) continue;
    const archived = { id, shop_id: review.shop_id, name: review.therapist_name };
    roster.push(archived);
    therapistById.set(id, archived);
  }
  const index = buildTherapistReviewIndex(scopedReviews, roster);
  const candidates = [];
  let targetReviewCount = period === 'newcomer' ? 0 : scopedReviews.length;
  for (const [therapistId, rows] of index.byTherapistId) {
    const therapist = therapistById.get(therapistId);
    if (!therapist || therapistId.startsWith('manual_')) continue;
    const raw = therapist.raw_data || {};
    const tags = Array.isArray(therapist.tags) ? therapist.tags : (Array.isArray(raw.tags) ? raw.tags : []);
    const isNewcomer = tags.some(tag => ['新人', 'New', 'デビュー'].includes(tag));
    if (period === 'newcomer' && !isNewcomer) continue;
    if (period === 'newcomer') targetReviewCount += rows.length;
    const scores = rows.map(review => validRating(category === 'total'
      ? review.rating
      : review.detailed_ratings?.[category])).filter(score => score !== null);
    if (!scores.length) continue;
    const shop = shopById.get(String(rows[0].shop_id));
    candidates.push({
      key: therapistId,
      id: therapistId,
      therapistId,
      name: therapist.name || rows[0].therapist_name,
      shopId: shop.id,
      shopName: shop.name,
      prefecture: shop.prefecture || '',
      image: therapist.image_url || raw.image || null,
      age: therapist.age || raw.age || null,
      isNewcomer,
      count: scores.length,
      reviewCount: rows.length,
      averageRating: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    });
  }
  const ranking = candidates.filter(item => item.count >= minReviews)
    .sort((a, b) => b.averageRating - a.averageRating || b.count - a.count || a.key.localeCompare(b.key));
  return { ranking, targetReviewCount, candidateCount: candidates.length };
}
