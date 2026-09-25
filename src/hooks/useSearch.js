import { useState, useMemo, useEffect, useCallback } from 'react';
import { performSearch } from '../utils/searchLogic';

export const useSearch = (shops, initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);

  // デバウンス処理 (入力停止後 300ms で検索実行)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // 検索実行
  const searchResult = useMemo(() => {
    // クエリが空なら即座に全件
    if (!debouncedQuery) {
       return { type: 'all', data: shops, summary: null };
    }

    setIsSearching(true);
    // ロジック呼び出し
    const result = performSearch(shops, debouncedQuery);
    setIsSearching(false);
    return result;
  }, [shops, debouncedQuery]);

  // 入力ではなく URL から検索語を入れるとき用。デバウンスを待たずに結果まで切り替える
  // （待つと「全件→絞り込み」が一瞬見える）。
  const setQueryNow = useCallback((q) => {
    setQuery(q);
    setDebouncedQuery(q);
  }, []);

  return {
    query,
    setQuery,
    setQueryNow,
    result: searchResult.data,    // 店舗リスト
    mode: searchResult.type,      // 'brand' | 'shop' | 'all' | 'empty'
    summary: searchResult.summary,// ブランド情報 (brandモード時のみ)
    isSearching
  };
};
