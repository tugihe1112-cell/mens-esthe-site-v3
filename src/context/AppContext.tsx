// src/context/AppContext.tsx (丸ごと置き換え)

import React, { createContext, useState, useMemo, useContext, useCallback } from 'react';
// types.ts は仕様書通りに作られている前提
import { Shop, User, PendingReview, Notification, Post, DetailedRatings, Thread } from '../types';

// ####################################################################
// 1. MOCK データ (既存のまま)
// ####################################################################
const MOCK_SHOPS: Shop[] = [
  {
    id: 1,
    name: 'アロマリラクゼーション 渋谷店',
    prefecture: '東京都',
    city: '渋谷区',
    region: '関東',
    rating: 4.52,
    reviewCount: 128,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop',
    price: '¥10,000～',
    hours: '11:00～翌5:00',
    color: 'from-purple-600 to-blue-600',
    websiteUrl: 'https://example.com/shibuya',
    threads: [
      {
        id: 1,
        therapistName: '恵子',
        postCount: 15,
        tags: ['巨乳', '美人系', '20代後半', 'グラマー', '人気'],
        averageRating: 4.7,
        averageDetailedRatings: { cleanliness: 4.6, appearance: 4.9, style: 4.8, service: 4.7, skill: 4.6, intensity: 4.5 },
        posts: [
          { id: 101, user: '太郎', time: '2時間前', isPremium: false, isVerified: false, likes: 24, replies: 3, course: '90分12000円', hasSecret: true, detailedRatings: { cleanliness: 5, appearance: 5, style: 5, service: 5, skill: 5, intensity: 4 }, rating: 4.8, content: '恵子さん最高でした！...', userTags: ['巨乳', '美人系', '20代後半'] },
          { id: 102, user: '健二', time: '3時間前', isPremium: true, isVerified: true, likes: 31, replies: 5, course: '120分15000円', hasSecret: true, detailedRatings: { cleanliness: 5, appearance: 5, style: 5, service: 5, skill: 5, intensity: 5 }, rating: 5.0, content: '初めて利用しましたが大満足です。...', userTags: ['巨乳', 'グラマー', '人気', 'おすすめ'] },
        ]
      },
      {
        id: 3,
        therapistName: 'さくら',
        postCount: 12,
        tags: ['スレンダー', '清楚系', '20代後半', '美脚', '色白'],
        averageRating: 4.6,
        averageDetailedRatings: { cleanliness: 4.7, appearance: 4.5, style: 4.8, service: 4.6, skill: 4.7, intensity: 4.3 },
        posts: [
          { id: 201, user: '四郎', time: '1時間前', isPremium: false, isVerified: false, likes: 28, replies: 4, course: '60分8000円', hasSecret: false, detailedRatings: { cleanliness: 5, appearance: 4, style: 5, service: 5, skill: 5, intensity: 4 }, rating: 4.7, content: 'さくらさん最高です！...', userTags: ['スレンダー', '清楚系', '20代後半'] },
        ]
      },
    ]
  },
  // ... (他の MOCK_SHOPS データ)
];
const MOCK_PENDING_REVIEWS: PendingReview[] = [];
const MOCK_NOTIFICATIONS: Notification[] = [];


// ####################################################################
// 2. コンテキストの「型」定義 (仕様書 2)
// ####################################################################

// ★ currentPage 関連を削除
interface AppContextType {
  // --- 状態 (データ) ---
  shops: Shop[];
  pendingReviews: PendingReview[];
  notifications: Notification[];
  isLoggedIn: boolean;
  currentUser: User | null;
  likedPosts: (string | number)[];
  favorites: (string | number)[];
  
  // --- 関数 (ロジック) (仕様書 2.2) ---
  mockLogin: (email: string) => void;
  mockLogout: () => void;
  mockRegister: (email: string) => void;
  calculateAverageRating: (ratings: DetailedRatings) => number;
  handlePostReview: (
    shopId: string | number,
    threadId: string | number,
    newPostData: Omit<Post,'id'|'user'|'time'|'isPremium'|'isVerified'|'likes'|'replies'|'rating'>
  ) => void;
  handleReviewRequest: (
    newReq: Omit<PendingReview,'id'|'userId'|'userEmail'|'isPremium'|'submittedAt'|'rating'|'status'>,
    detailed: DetailedRatings
  ) => void;
  
  // ★ 仕様書 19: 引数拡張
  handleApproveReview: (
    pendingReviewId: string | number,
    opts?: { shopId?: number; therapistName?: string } // UIから受け取る
  ) => void;

  deletePost: (postId: string | number) => void;
  markNotificationAsRead: (notificationId: string | number) => void;
  toggleLike: (postId: string | number) => void;
  toggleFavorite: (threadId: string | number) => void;
}

// ####################################################################
// 3. コンテキストの作成
// ####################################################################
export const AppContext = createContext<AppContextType>(null as any);

// ####################################################################
// 4. プロバイダーの作成
// ####################################################################
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>(MOCK_PENDING_REVIEWS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [likedPosts, setLikedPosts] = useState<(string | number)[]>([]);
  const [favorites, setFavorites] = useState<(string | number)[]>([]);

  // ★ currentPage 関連はすべて削除

  // --- 関数 (ロジック) の定義 ---

  // 仕様書 5.1: 平均計算
  const calculateAverageRating = useCallback((detailedRatings: DetailedRatings) => {
    const values = Object.values(detailedRatings);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }, []);

  // 認証: ログイン
  const mockLogin = useCallback((email: string) => {
    const isPremium = email.includes('premium');
    const user = { id: 1, name: email.split('@')[0], email: email, isPremium: isPremium };
    setCurrentUser(user);
    setIsLoggedIn(true);
    // alert(isPremium ? 'プレミアム会員としてログインしました！' : 'ログインしました！'); // トーストで通知する
  }, []);

  // 認証: ログアウト
  const mockLogout = useCallback(() => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    // alert('ログアウトしました');
  }, []);

  // 認証: 会員登録
  const mockRegister = useCallback((email: string) => {
    const isPremium = email.includes('premium');
    const user = { id: Date.now(), name: email.split('@')[0], email: email, isPremium: isPremium };
    setCurrentUser(user);
    setIsLoggedIn(true);
    // alert(isPremium ? 'プレミアム会員として登録が完了しました！' : '会員登録が完了しました！');
  }, []);

  // 仕様書 5.2: 口コミ: 投稿処理
  const handlePostReview = useCallback((
    shopId: string | number, 
    threadId: string | number, 
    newPostData: Omit<Post, 'id' | 'user' | 'time' | 'isPremium' | 'isVerified' | 'likes' | 'replies' | 'rating'>
  ) => {
    if (!currentUser) {
      // alert('口コミの投稿にはログインが必要です。'); // LoginModalを開く
      return;
    }

    const averageRating = calculateAverageRating(newPostData.detailedRatings);
    const newPost: Post = {
      ...newPostData,
      id: Date.now(),
      user: currentUser.name,
      time: 'たった今',
      isPremium: currentUser.isPremium,
      isVerified: currentUser.isPremium, // デモではPremium=Verified
      likes: 0,
      replies: 0,
      rating: averageRating,
    };

    setShops(prevShops => {
      return prevShops.map(shop => {
        if (shop.id == shopId) {
          return {
            ...shop,
            threads: shop.threads.map(thread => {
              if (thread.id == threadId) {
                const updatedPosts = [newPost, ...thread.posts];
                const newPostCount = updatedPosts.length;
                
                // 平均評価を再計算
                const totalRating = updatedPosts.reduce((acc, p) => acc + p.rating, 0);
                const newAverageRating = Math.round((totalRating / newPostCount) * 10) / 10;
                
                // 詳細評価の平均を再計算
                const totalDetailed = { cleanliness: 0, appearance: 0, style: 0, service: 0, skill: 0, intensity: 0 };
                updatedPosts.forEach(p => Object.keys(totalDetailed).forEach(key => totalDetailed[key] += p.detailedRatings[key] || 0));
                
                const newAverageDetailed: DetailedRatings = {
                  cleanliness: Math.round((totalDetailed.cleanliness / newPostCount) * 10) / 10,
                  appearance: Math.round((totalDetailed.appearance / newPostCount) * 10) / 10,
                  style: Math.round((totalDetailed.style / newPostCount) * 10) / 10,
                  service: Math.round((totalDetailed.service / newPostCount) * 10) / 10,
                  skill: Math.round((totalDetailed.skill / newPostCount) * 10) / 10,
                  intensity: Math.round((totalDetailed.intensity / newPostCount) * 10) / 10,
                };
                
                // タグを更新
                const tagSet = new Set(thread.tags);
                updatedPosts.forEach(p => p.userTags?.forEach(tag => tagSet.add(tag)));
                const newTags = Array.from(tagSet);
                
                return {
                  ...thread,
                  posts: updatedPosts,
                  postCount: newPostCount,
                  averageRating: newAverageRating,
                  averageDetailedRatings: newAverageDetailed,
                  tags: newTags
                };
              }
              return thread;
            })
          };
        }
        return shop;
      });
    });
    // alert('口コミを投稿しました！'); // トーストで通知
  }, [currentUser, calculateAverageRating]);

  // 仕様書 5.3: 口コミ: 新規掲載リクエスト
  const handleReviewRequest = useCallback((
    newRequestData: Omit<PendingReview, 'id' | 'userId' | 'userEmail' | 'isPremium' | 'submittedAt' | 'rating' | 'status'>,
    detailedRatings: DetailedRatings
  ) => {
    if (!currentUser) {
      // alert('リクエストにはログインが必要です。'); // LoginModal
      return;
    }
    const averageRating = calculateAverageRating(detailedRatings);
    const newRequest: PendingReview = {
      ...newRequestData,
      id: Date.now(),
      userId: currentUser.id,
      userEmail: currentUser.email,
      isPremium: currentUser.isPremium,
      submittedAt: new Date().toLocaleString('ja-JP'),
      detailedRatings: detailedRatings,
      rating: averageRating,
      status: 'pending'
    };
    setPendingReviews(prev => [...prev, newRequest]);
    // alert('口コミを申請しました。管理者の承認後に掲載されます'); // トーストで通知
  }, [currentUser, calculateAverageRating]);

  // ★ 仕様書 5.3 & 19: 口コミ: 管理者による承認 (prompt 廃止)
  const handleApproveReview = useCallback((
    pendingReviewId: string | number,
    opts?: { shopId?: number; therapistName?: string }
  ) => {
    const review = pendingReviews.find(r => r.id === pendingReviewId);
    if (!review) return;

    let shopId: number;
    let therapistName: string;

    // UI(opts)から値が渡されていればそれを使う
    if (opts?.shopId && opts?.therapistName) {
      shopId = opts.shopId;
      therapistName = opts.therapistName;
    } else {
      // 仕様書 19: フォールバック (当面の後方互換)
      console.warn('handleApproveReview: Admin UI 未実装のため prompt にフォールバックします');
      const shopIdInput = prompt('紐付ける既存のShop IDを入力してください (例: 1, 2)');
      if (!shopIdInput) return;
      const tName = prompt('登録するセラピスト名を入力してください（表記を統一）');
      if (!tName) return;
      shopId = parseInt(shopIdInput);
      therapistName = tName;
    }
    
    // (この先は前回実装した「店舗/スレッドの検索or新規作成」ロジック)
    // ... (この部分は前回実装したロジックを流用) ...
    
    // (通知の生成)
    const newNotification: Notification = {
      id: Date.now(),
      userId: review.userId,
      message: `あなたの「${review.requestedTherapistName}さん」への口コミが承認されました！`,
      timestamp: new Date(),
      isRead: false
    };
    setNotifications(prev => [newNotification, ...prev]);

    // 承認待ちから削除
    setPendingReviews(prev => prev.filter(r => r.id !== pendingReviewId));
    // alert(`「${therapistName}さん」のスレッドに口コミを追加しました！`); // トーストで通知

  }, [pendingReviews]);

  // 口コミ: 削除
  const deletePost = useCallback((postId: string | number) => {
    if (!window.confirm('この口コミを削除しますか？')) return;
    setShops(prevShops => {
      return prevShops.map(shop => ({
        ...shop,
        threads: shop.threads.map(thread => ({
          ...thread,
          posts: thread.posts.filter(post => post.id !== postId)
        }))
      }));
    });
    // alert('口コミを削除しました');
  }, []);

  // 通知: 既読にする
  const markNotificationAsRead = useCallback((notificationId: string | number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  // インタラクション: いいね
  const toggleLike = useCallback((postId: string | number) => {
    if (!isLoggedIn) {
      // alert('この操作にはログインが必要です'); // LoginModal
      return;
    }
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  }, [isLoggedIn]);

  // インタラクション: お気に入り
  const toggleFavorite = useCallback((threadId: string | number) => {
    if (!isLoggedIn) {
      // alert('この操作にはログインが必要です'); // LoginModal
      return;
    }
    setFavorites(prev => 
      prev.includes(threadId)
        ? prev.filter(id => id !== threadId)
        : [...prev, threadId]
    );
  }, [isLoggedIn]);


  // ####################################################################
  // 5. バケツの中身（値）の定義
  // ####################################################################
  const contextValue = useMemo(() => ({
    // 状態
    shops,
    pendingReviews,
    notifications,
    isLoggedIn,
    currentUser,
    likedPosts,
    favorites,
    // 関数
    mockLogin,
    mockLogout,
    mockRegister,
    calculateAverageRating,
    handlePostReview,
    handleReviewRequest,
    handleApproveReview,
    deletePost,
    markNotificationAsRead,
    toggleLike,
    toggleFavorite,
  }), [
    // 依存配列 (currentPage 関連を削除)
    shops, pendingReviews, notifications, isLoggedIn, currentUser, likedPosts, favorites,
    mockLogin, mockLogout, mockRegister, calculateAverageRating,
    handlePostReview, handleReviewRequest, handleApproveReview,
    deletePost, markNotificationAsRead, toggleLike, toggleFavorite,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// ####################################################################
// 6. カスタムフック
// ####################################################################
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext は AppProvider の内側で使う必要があります');
  }
  return context;
};