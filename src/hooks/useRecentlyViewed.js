import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mens_esthe_history';
const MAX_HISTORY = 10;

export function useRecentlyViewed() {
  const [history, setHistory] = useState([]);

  // 初期読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
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
          ...item,
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
