// src/types/index.ts
// 型定義

export interface DetailedRatings {
  cleanliness: number;
  appearance: number;
  style: number;
  service: number;
  skill: number;
  intensity: number;
}

export interface Post {
  id: number | string;
  user: string;
  time: string;
  isPremium: boolean;
  isVerified: boolean;
  likes: number;
  replies: number;
  course?: string;
  hasSecret?: boolean;
  secretContent?: string;
  detailedRatings: DetailedRatings;
  rating: number;
  content: string;
  userTags?: string[];
  
  isPremiumContent?: boolean;
}

export interface Thread {
  id: number;
  therapistName: string;
  postCount: number;
  tags: string[];
  averageRating: number;
  averageDetailedRatings: DetailedRatings;
  posts: Post[];
}

export interface Shop {
  id: number;
  name: string;
  prefecture: string;
  city: string;
  region: string;
  rating: number;
  reviewCount: number;
  image: string;
  price: string;
  hours: string;
  color?: string;
  websiteUrl?: string;
  threads: Thread[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  isPremium: boolean;
  
  memberType?: 'free' | 'contributor' | 'premium';
  canViewReviews?: boolean;
  reviewAccessExpiresAt?: string | null;
  premiumExpiresAt?: string | null;
}

export interface PendingReview {
  id: number | string;
  userId: number;
  userEmail: string;
  isPremium: boolean;
  requestedPrefecture: string;
  requestedCity: string;
  requestedShopName: string;
  requestedTherapistName: string;
  content: string;
  detailedRatings: DetailedRatings;
  rating: number;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  userTags?: string[];
  course?: string;
  
  grantedDays?: number;
}

export interface Notification {
  id: number | string;
  userId: number;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

// ⭐ トースト通知の型定義（新規追加）
export interface Toast {
  id: number | string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}