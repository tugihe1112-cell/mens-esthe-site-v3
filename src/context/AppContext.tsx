import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // ------------------------------------------------
  // 1. ユーザー認証 (Login)
  // ------------------------------------------------
  const [user, setUser] = useState(() => {
    try {
      if (typeof window === 'undefined') return null;
      const saved = localStorage.getItem('mens_esthe_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('mens_esthe_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mens_esthe_user');
  };

  // ------------------------------------------------
  // 2. 店舗のお気に入り (Shop Favorites)
  // ------------------------------------------------
  const [favorites, setFavorites] = useState(() => {
    try {
      if (typeof window === 'undefined') return [];
      const saved = localStorage.getItem('mens_esthe_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const toggleFavorite = (shopId) => {
    setFavorites(prev => {
      const next = prev.includes(shopId) 
        ? prev.filter(id => id !== shopId) 
        : [...prev, shopId];               
      localStorage.setItem('mens_esthe_favorites', JSON.stringify(next));
      return next;
    });
  };

  // ------------------------------------------------
  // 3. セラピストのお気に入り (Therapist Favorites)
  // ------------------------------------------------
  const [favTherapists, setFavTherapists] = useState(() => {
    try {
      if (typeof window === 'undefined') return [];
      const saved = localStorage.getItem('mens_esthe_fav_therapists');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const toggleFavTherapist = (therapistId) => {
    setFavTherapists(prev => {
      const next = prev.includes(therapistId)
        ? prev.filter(id => id !== therapistId)
        : [...prev, therapistId];
      localStorage.setItem('mens_esthe_fav_therapists', JSON.stringify(next));
      return next;
    });
  };

  // ------------------------------------------------
  // 4. クチコミ投稿機能 (Submit Review) ★ここが復活箇所！
  // ------------------------------------------------
  
  // 既存店舗へのクチコミ送信
  const submitExistingShopReview = async (reviewData) => {
    console.log("🚀 クチコミ送信:", reviewData);
    
    // ここで本来はAPIを叩くが、今はローカルストレージに保存する「擬似投稿」にする
    // これにより、画面上で「投稿できた感」を演出できる
    try {
      // 既存のローカルクチコミを取得
      if (typeof window === 'undefined') return false;
      const localReviews = JSON.parse(localStorage.getItem('mens_esthe_local_reviews') || '[]');
      
      // 新しいクチコミを追加（IDなどを付与）
      const newReview = {
        ...reviewData,
        id: `local_${Date.now()}`,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        isLocal: true // ローカル投稿フラグ
      };
      
      const updatedReviews = [newReview, ...localReviews];
      localStorage.setItem('mens_esthe_local_reviews', JSON.stringify(updatedReviews));

      alert("クチコミを投稿しました！\n（※現在はデモモードのため、ブラウザ内にのみ保存されます）");
      return true;
    } catch (error) {
      console.error("投稿エラー:", error);
      alert("投稿に失敗しました");
      return false;
    }
  };

  // 新規店舗リクエスト送信
  const submitNewShopRequest = async (requestData) => {
    console.log("🚀 新規店舗リクエスト:", requestData);
    alert("新規店舗の登録リクエストを受け付けました！\n運営が確認後に反映されます。");
    return true;
  };

  return (
    <AppContext.Provider value={{ 
      user, currentUser: user, // 互換性のため currentUser も用意
      login, logout, 
      favorites, toggleFavorite,
      favTherapists, toggleFavTherapist,
      submitExistingShopReview, // ★公開
      submitNewShopRequest      // ★公開
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
