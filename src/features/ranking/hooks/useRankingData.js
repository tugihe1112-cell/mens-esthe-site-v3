import { useMemo } from 'react';
import { reviewSchema, getTherapistData, isWithinPeriod } from '../utils/rankingHelpers';

export const useRankingData = (reviews, shops, activeTab) => {
  return useMemo(() => {
    if (!reviews || reviews.length === 0) return [];

    // 1. 集計用マップ
    const therapistStats = {};

    reviews.forEach(review => {
      // バリデーションチェック (失敗したらスキップ)
      const parseResult = reviewSchema.safeParse(review);
      if (!parseResult.success) return;

      // 期間フィルタリング
      if (activeTab === 'monthly' && !isWithinPeriod(review.createdAt, 30)) return;
      if (activeTab === 'weekly' && !isWithinPeriod(review.createdAt, 7)) return;
      // 'newcomer'タブの場合は全期間集計し、あとでセラピスト属性でフィルタする

      const key = `${review.shop_id}_${review.therapistName}`;

      if (!therapistStats[key]) {
        therapistStats[key] = {
          key,
          therapistId: review.threadId || review.therapist_id,
          name: review.therapistName,
          shopId: review.shop_id,
          totalRating: 0,
          count: 0,
        };
      }
      therapistStats[key].totalRating += Number(review.rating);
      therapistStats[key].count += 1;
    });

    // 2. 配列変換 & データ補完
    let rankingList = Object.values(therapistStats).map(stat => {
      const { shopName, image, tags, isNewcomer } = getTherapistData(
        shops, 
        stat.shopId, 
        stat.name, 
        stat.therapistId
      );

      return {
        ...stat,
        shopName,
        image,
        tags,
        isNewcomer,
        averageRating: stat.totalRating / stat.count,
      };
    });

    // 3. 'newcomer' タブ用のフィルタリング
    if (activeTab === 'newcomer') {
      rankingList = rankingList.filter(item => item.isNewcomer);
    }

    // 4. ソート (平均点 > レビュー数)
    return rankingList.sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      return b.count - a.count;
    });

  }, [reviews, shops, activeTab]);
};
