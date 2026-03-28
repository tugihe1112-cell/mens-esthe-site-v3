import { z } from 'zod';

// Zodによるデータ検証スキーマ
export const reviewSchema = z.object({
  shop_id: z.string().min(1),
  therapistName: z.string().min(1),
  rating: z.number().min(1).max(5),
  createdAt: z.string().optional(), // 日付がない古いデータへの配慮
});

// セラピスト情報を安全に取得するヘルパー
export const getTherapistData = (shops, shopId, therapistName, therapistId) => {
  const shop = shops.find(s => s.id === shopId || s.group_id === shopId);
  const defaultImage = 'https://via.placeholder.com/300x400?text=No+Image';

  if (!shop || !shop.threads) {
    return { 
      shopName: shop ? shop.name : 'Unknown Shop', 
      image: defaultImage, 
      tags: [],
      isNewcomer: false
    };
  }

  const therapist = shop.threads.find(t => 
    (therapistId && t.id === therapistId) || t.name === therapistName
  );

  // 新人判定: タグに'新人'が含まれる or 年齢が20歳以下(仮) or データ登録日が新しい等
  // ここではタグベースで判定
  const isNewcomer = therapist?.tags?.some(tag => ['新人', 'New', 'デビュー'].includes(tag)) || false;

  return {
    shopName: shop.name,
    image: therapist?.image || defaultImage,
    tags: therapist?.tags || [],
    isNewcomer
  };
};

// 日付フィルタリング
export const isWithinPeriod = (dateString, days) => {
  if (!dateString) return false;
  const targetDate = new Date(dateString);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return targetDate >= cutoffDate;
};
