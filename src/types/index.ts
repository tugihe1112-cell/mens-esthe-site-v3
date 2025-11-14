// src/types/index.ts

/**
 * 詳細評価（5段階評価）
 */
export interface DetailedRatings {
  cleanliness: number; // 清潔さ
  appearance: number; // 容姿
  style: number;       // スタイル
  service: number;     // 接客
  skill: number;       // マッサージのうまさ
  intensity: number;   // マッサージの際どさ
}

/**
 * 口コミ（投稿）データ
 */
export interface Post {
  id: number | string;
  user: string;
  time: string;
  isPremium: boolean;
  isVerified: boolean;
  likes: number;
  replies: number;
  course: string;
  hasSecret: boolean;
  detailedRatings: DetailedRatings;
  rating: number; // 総合評価 (自動計算)
  content: string;
  userTags: string[]; // ユーザーが投稿時に選択したタグ
}

/**
 * セラピスト（スレッド）データ
 */
export interface Thread {
  id: number | string;
  therapistName: string;
  postCount: number;
  tags: string[]; // セラピストの特徴タグ (口コミのuserTagsから集計)
  averageRating: number;
  averageDetailedRatings: DetailedRatings;
  posts: Post[]; // このセラピストに紐づく口コミ一覧
}

/**
 * 店舗データ
 */
export interface Shop {
  id: number | string;
  name: string;
  prefecture: string;
  city: string;
  region: string;
  rating: number;
  reviewCount: number;
  image: string;
  price: string;
  hours: string;
  color: string; // UI表示用のテーマカラー
  websiteUrl: string;
  threads: Thread[]; // この店舗に紐づくセラピスト一覧
}

/**
 * ユーザーデータ
 */
export interface User {
  id: number | string;
  name: string;
  email: string;
  isPremium: boolean;
}

/**
 * 口コミの掲載申請（承認待ち）データ
 */
export interface PendingReview {
  id: number | string;
  userId: number | string;
  userEmail: string;
  user: string; // ★★★ これが修正点です ★★★
  isPremium: boolean;
  submittedAt: string;
  requestedShopName: string;
  requestedTherapistName: string;
  requestedAddress: string;
  course: string;
  hasSecret: boolean;
  detailedRatings: DetailedRatings;
  rating: number;
  postContent: string;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * 通知データ
 */
export interface Notification {
  id: number | string;
  userId: number | string; // この通知の宛先ユーザーID
  message: string;
  timestamp: Date;
  isRead: boolean;
}