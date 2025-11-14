// src/hooks/useSearchLogic.js (新規作成)

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.tsx';

// 配列から重複を除外するヘルパー
const uniq = (arr) => [...new Set(arr)];

export const useSearchLogic = () => {
  const { shops } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. URLクエリから現在の選択状態を取得 (仕様書 20)
  const pref = searchParams.get('pref') || '';
  const city = searchParams.get('city') || '';
  const shopId = searchParams.get('shop') || '';
  const threadId = searchParams.get('thread') || '';

  // 2. 各セレクトボックスの「選択肢」を動的に生成 (仕様書 20)
  const prefectures = useMemo(() => uniq(shops.map(s => s.prefecture)), [shops]);

  const cities = useMemo(() => {
    if (!pref) return [];
    return uniq(shops.filter(s => s.prefecture === pref).map(s => s.city));
  }, [pref, shops]);

  const shopOptions = useMemo(() => {
    if (!pref || !city) return [];
    return shops.filter(s => s.prefecture === pref && s.city === city);
  }, [pref, city, shops]);

  const threadOptions = useMemo(() => {
    if (!shopId) return [];
    const found = shops.find(s => String(s.id) === shopId);
    return found ? found.threads : [];
  }, [shopId, shops]);

  // 3. 選択肢が「0件」だった場合の検出 (仕様書 3.3)
  const noCities = pref && cities.length === 0;
  const noShops = pref && city && shopOptions.length === 0;
  const noThreads = shopId && threadOptions.length === 0;

  // 4. URLを更新する関数 (仕様書 20)
  const setPref = (nextPref) => {
    // 上位が変更されたら下位をリセット
    setSearchParams({ pref: nextPref });
  };

  const setCity = (nextCity) => {
    const p = new URLSearchParams(searchParams);
    p.set('pref', pref);
    p.set('city', nextCity);
    p.delete('shop');
    p.delete('thread');
    setSearchParams(p);
  };

  const setShop = (nextShopId) => {
    const p = new URLSearchParams(searchParams);
    p.set('pref', pref);
    p.set('city', city);
    p.set('shop', nextShopId);
    p.delete('thread');
    setSearchParams(p);
  };

  const setThread = (nextThreadId) => {
    const p = new URLSearchParams(searchParams);
    p.set('pref', pref);
    p.set('city', city);
    p.set('shop', shopId);
    p.set('thread', nextThreadId);
    setSearchParams(p);
  };

  // このフックが提供する値
  return {
    // 現在の選択値
    values: { pref, city, shopId, threadId },
    // 選択肢
    options: { prefectures, cities, shopOptions, threadOptions },
    // 0件フラグ
    errors: { noCities, noShops, noThreads },
    // 更新関数
    setters: { setPref, setCity, setShop, setThread },
  };
};