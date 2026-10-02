import { useState, useEffect, useCallback, useRef } from 'react';
import { readStoredJson, writeStoredJson, removeStoredValue } from '../utils/localStorage.js';

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
  const current = useRef([]);
  const storageReady = useRef(false);
  const [storageError, setStorageError] = useState(false);

  // 初期読み込み
  useEffect(() => {
    const saved = readStoredJson(STORAGE_KEY, []);
    if (!saved.ok || !Array.isArray(saved.value)) { setStorageError(true); return; }
    storageReady.current = true;
    const normalized = saved.value.filter(item => item?.id).map(normalizeHistoryItem).slice(0, MAX_HISTORY);
    current.current = normalized;
    setHistory(normalized);
    if (saved.found) setStorageError(!writeStoredJson(STORAGE_KEY, normalized).ok);
  }, []);

  // 🔄 useCallbackで関数を固定し、無限ループを防止
  const addToHistory = useCallback((item) => {
    if (!item || !item.id) return;

    const filtered = current.current.filter(i => i.id !== item.id);
    const next = [{ ...normalizeHistoryItem(item), viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_HISTORY);
    current.current = next;
    setHistory(next);
    const result = storageReady.current ? writeStoredJson(STORAGE_KEY, next) : { ok: false };
    setStorageError(!result.ok);
    return result;
  }, []); // 空の配列で固定

  const clearHistory = useCallback(() => {
    const result = removeStoredValue(STORAGE_KEY);
    setStorageError(!result.ok);
    if (result.ok) { current.current = []; setHistory([]); }
    return result;
  }, []);

  return { history, addToHistory, clearHistory, storageError };
}
