import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast, { Toaster } from 'react-hot-toast';
import { loadFavoriteIds, toggleStoredId, removeStoredValue } from '../utils/localStorage.js';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  // 認証はAuthContext（Supabase）のみで扱う。このContextは端末内のお気に入り専用。
  // 旧デモ認証キーが残っていてもログイン表示へ影響しないよう、移行時に削除する。
  useEffect(() => {
    removeStoredValue('mens_esthe_user');
    removeStoredValue('mens_esthe_local_reviews');
  }, []);

  const userId = user?.id || '';
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState(null);
  const current = useRef(null);
  const retryFavorites = useCallback(() => setAttempt(n => n + 1), []);

  useEffect(() => {
    if (!userId) { current.current = null; setSaved(null); return; }
    const shops = loadFavoriteIds(`mens_esthe_favorites:${userId}`, 'mens_esthe_favorites', userId);
    const people = loadFavoriteIds(`mens_esthe_fav_therapists:${userId}`, 'mens_esthe_fav_therapists', userId);
    const previous = current.current?.userId === userId ? current.current : null;
    const next = {
      userId, attempt,
      favorites: shops.ok ? shops.value : previous?.favorites || [],
      favTherapists: people.ok ? people.value : previous?.favTherapists || [],
      shopsOk: shops.ok, peopleOk: people.ok,
      shopCountKnown: shops.ok || Boolean(previous?.shopCountKnown),
      peopleCountKnown: people.ok || Boolean(previous?.peopleCountKnown),
    };
    current.current = next;
    setSaved(next);
  }, [userId, attempt]);

  const toggle = (kind, id) => {
    const previous = current.current;
    const ready = previous?.userId === userId && previous?.attempt === attempt;
    if (!userId) return { ok: false };
    if (!ready || !(kind === 'favorites' ? previous.shopsOk : previous.peopleOk)) {
      toast.error('お気に入りを読み込めません。再試行してから保存してください。', { toasterId: 'favorites' });
      return { ok: false };
    }
    const prefix = kind === 'favorites' ? 'mens_esthe_favorites' : 'mens_esthe_fav_therapists';
    const result = toggleStoredId(`${prefix}:${userId}`, previous[kind], id);
    if (!result.ok) {
      toast.error('お気に入りを保存できませんでした。端末の保存容量や設定をご確認ください。', { toasterId: 'favorites' });
      return result;
    }
    const next = { ...previous, [kind]: result.value };
    current.current = next;
    setSaved(next);
    return result;
  };
  const visible = saved?.userId === userId ? saved : null;
  const favorites = visible?.favorites || [];
  const favTherapists = visible?.favTherapists || [];
  const favoritesLoading = Boolean(userId && (!visible || visible.attempt !== attempt));
  const favoritesError = Boolean(visible && (!visible.shopsOk || !visible.peopleOk));
  const toggleFavorite = id => toggle('favorites', id);
  const toggleFavTherapist = id => toggle('favTherapists', id);

  return (
    <AppContext.Provider value={{ 
      favorites, toggleFavorite,
      favTherapists, toggleFavTherapist,
      favoritesLoading, favoritesError, retryFavorites,
      favoriteShopCountKnown: Boolean(visible?.shopCountKnown),
      favoriteTherapistCountKnown: Boolean(visible?.peopleCountKnown),
    }}>
      <Toaster toasterId="favorites" position="top-center" />
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
