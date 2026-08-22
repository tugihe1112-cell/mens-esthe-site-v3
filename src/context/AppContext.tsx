import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  // 認証はAuthContext（Supabase）のみで扱う。このContextは端末内のお気に入り専用。
  // 旧デモ認証キーが残っていてもログイン表示へ影響しないよう、移行時に削除する。
  useEffect(() => {
    try {
      localStorage.removeItem('mens_esthe_user');
      localStorage.removeItem('mens_esthe_local_reviews');
    } catch { /* noop */ }
  }, []);

  const [favorites, setFavorites] = useState([]);
  const [favTherapists, setFavTherapists] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      setFavorites([]);
      setFavTherapists([]);
      return;
    }
    const shopKey = `mens_esthe_favorites:${user.id}`;
    const therapistKey = `mens_esthe_fav_therapists:${user.id}`;
    try {
      // 旧版の端末共通データは、最初にログインした本人へ一度だけ移行する。
      const scopedShops = localStorage.getItem(shopKey);
      const scopedTherapists = localStorage.getItem(therapistKey);
      const legacyShops = !scopedShops ? localStorage.getItem('mens_esthe_favorites') : null;
      const legacyTherapists = !scopedTherapists ? localStorage.getItem('mens_esthe_fav_therapists') : null;
      const nextShops = JSON.parse(scopedShops || legacyShops || '[]');
      const nextTherapists = JSON.parse(scopedTherapists || legacyTherapists || '[]');
      setFavorites(Array.isArray(nextShops) ? nextShops.map(String) : []);
      setFavTherapists(Array.isArray(nextTherapists) ? nextTherapists.map(String) : []);
      if (!scopedShops && legacyShops) localStorage.setItem(shopKey, legacyShops);
      if (!scopedTherapists && legacyTherapists) localStorage.setItem(therapistKey, legacyTherapists);
      localStorage.removeItem('mens_esthe_favorites');
      localStorage.removeItem('mens_esthe_fav_therapists');
    } catch {
      setFavorites([]);
      setFavTherapists([]);
    }
  }, [user?.id]);

  const toggleFavorite = (shopId) => {
    if (!user?.id) return;
    setFavorites(prev => {
      const normalized = String(shopId);
      const next = prev.includes(normalized)
        ? prev.filter(id => id !== normalized)
        : [...prev, normalized];
      localStorage.setItem(`mens_esthe_favorites:${user.id}`, JSON.stringify(next));
      return next;
    });
  };

  const toggleFavTherapist = (therapistId) => {
    if (!user?.id) return;
    setFavTherapists(prev => {
      const normalized = String(therapistId);
      const next = prev.includes(normalized)
        ? prev.filter(id => id !== normalized)
        : [...prev, normalized];
      localStorage.setItem(`mens_esthe_fav_therapists:${user.id}`, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AppContext.Provider value={{ 
      favorites, toggleFavorite,
      favTherapists, toggleFavTherapist,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
