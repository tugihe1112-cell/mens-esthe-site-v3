import { useMemo } from 'react';
import { aggregateRankingData, MIN_REVIEWS_FOR_RANKING } from '../utils/rankingHelpers.js';

export function useRankingData(data, period = 'all', category = 'total', area = '全国', minReviews = MIN_REVIEWS_FOR_RANKING) {
  return useMemo(() => aggregateRankingData(data.reviews, data.shops, data.therapists, {
    period, category, area, minReviews,
  }), [data, period, category, area, minReviews]);
}
