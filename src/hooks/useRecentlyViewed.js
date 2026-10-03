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
  const unsaved = useRef([]);
  const storageReady = useRef(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [readError, setReadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // 読取に失敗したデータは上書きせず、再読込時にも現在のカードを保持する。
  const retryHistory = useCallback(() => {
    setHistoryLoading(true);
    const saved = readStoredJson(STORAGE_KEY, []);
    if (!saved.ok || !Array.isArray(saved.value)) {
      storageReady.current = false;
      setReadError(true);
      setHistoryLoading(false);
      return { ok: false };
    }
    storageReady.current = true;
    setReadError(false);
    // 削除の読み戻しだけ拒否された場合も、キーが無いと確認できれば完了にできる。
    if (!saved.found && unsaved.current.length === 0) setDeleteError(false);
    const seen = new Set();
    const normalized = [...unsaved.current, ...saved.value].filter(item => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).map(normalizeHistoryItem).slice(0, MAX_HISTORY);
    current.current = normalized;
    setHistory(normalized);
    const result = saved.found || unsaved.current.length ? writeStoredJson(STORAGE_KEY, normalized) : { ok: true };
    setSaveError(!result.ok);
    if (result.ok) unsaved.current = [];
    setHistoryLoading(false);
    return result;
  }, []);

  useEffect(() => { retryHistory(); }, [retryHistory]);

  // 🔄 useCallbackで関数を固定し、無限ループを防止
  const addToHistory = useCallback((item) => {
    if (!item || !item.id) return;

    const filtered = current.current.filter(i => i.id !== item.id);
    const next = [{ ...normalizeHistoryItem(item), viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_HISTORY);
    current.current = next;
    setHistory(next);
    const result = storageReady.current ? writeStoredJson(STORAGE_KEY, next) : { ok: false };
    unsaved.current = result.ok ? [] : next;
    setSaveError(!result.ok);
    return result;
  }, []); // 空の配列で固定

  const clearHistory = useCallback(() => {
    const result = removeStoredValue(STORAGE_KEY);
    setDeleteError(!result.ok);
    if (result.ok) {
      storageReady.current = true;
      current.current = [];
      unsaved.current = [];
      setHistory([]);
      setReadError(false);
      setSaveError(false);
    }
    return result;
  }, []);

  return { history, addToHistory, clearHistory, retryHistory, historyLoading, readError, saveError, deleteError, storageError: readError || saveError || deleteError };
}
