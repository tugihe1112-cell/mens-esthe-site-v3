import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mens_esthe_history';
const MAX_HISTORY = 10;

export function historyLink(item) {
  if (typeof item?.link === 'string' && item.link.startsWith('/') && item.link !== '/') {
    return item.link;
  }
  if (item?.shopId && item?.therapistId) {
    return `/shops/${item.shopId}/threads/${item.therapistId}`;
  }
  if (item?.shopId) return `/shops/${item.shopId}`;
  return '/search';
}

function normalizeHistoryItem(item) {
  return {
    ...item,
    type: item?.type || (item?.therapistId ? 'therapist' : 'shop'),
    subText: item?.subText || item?.shopName || '',
    image_url: item?.image_url || item?.image || null,
    link: historyLink(item),
  };
}

export function useRecentlyViewed() {
  const [history, setHistory] = useState([]);

  // 初期読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = Array.isArray(parsed)
          ? parsed.filter((item) => item?.id).map(normalizeHistoryItem).slice(0, MAX_HISTORY)
          : [];
        setHistory(normalized);
        // 旧形式（link未保存）も読んだ時点で修復し、次回以降も正しい遷移先を保持する。
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
    } catch (e) {
      console.error("履歴の読み込みに失敗しました", e);
    }
  }, []);

  // 🔄 useCallbackで関数を固定し、無限ループを防止
  const addToHistory = useCallback((item) => {
    if (!item || !item.id) return;

    setHistory((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const newHistory = [
        {
          ...normalizeHistoryItem(item),
          viewedAt: new Date().toISOString(),
        },
        ...filtered
      ].slice(0, MAX_HISTORY);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []); // 空の配列で固定

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addToHistory, clearHistory };
}
