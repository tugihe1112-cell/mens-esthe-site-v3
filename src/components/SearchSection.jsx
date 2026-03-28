// src/components/SearchSection.jsx
// 2025.12.26 地方・都道府県・エリア順序整理版

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.tsx';
import toast from 'react-hot-toast';
import { LOCATION_DATA, groupedLocations } from '../data/locations';
import { matchesPrefectureAndCity } from '../utils/shopFilters';

export default function SearchSection() {
  const navigate = useNavigate();
  const { isLoggedIn, shops = [] } = useAppContext();

  // 検索用のState管理
  const [pref, setPref] = useState("");
  const [city, setCity] = useState("");
  const [shopId, setShopId] = useState("");
  const [threadId, setThreadId] = useState("");

  // ▼ 1. エリア選択肢
  const cityOptions = useMemo(() => {
    if (!pref) return [];
    return LOCATION_DATA[pref] || [];
  }, [pref]);

  // ▼ 2. 店舗選択肢（配列にも対応）
  const shopOptions = useMemo(() => {
    if (!pref || !city) return [];
    return shops.filter(s => matchesPrefectureAndCity(s, pref, city));
  }, [pref, city, shops]);

  // ▼ 3. セラピスト選択肢
  const threadOptions = useMemo(() => {
    if (!shopId) return [];
    const selectedShop = shops.find(s => s.id === parseInt(shopId));
    return selectedShop ? (selectedShop.threads || []) : [];
  }, [shopId, shops]);

  const handlePrefChange = (e) => {
    setPref(e.target.value);
    setCity("");
    setShopId("");
    setThreadId("");
  };

  const handleCityChange = (e) => {
    setCity(e.target.value);
    setShopId("");
    setThreadId("");
  };

  const handleShopChange = (e) => {
    setShopId(e.target.value);
    setThreadId("");
  };

  const handleNavigate = () => {
    if (shopId && threadId) {
      navigate(`/shops/${shopId}/threads/${threadId}`);
    } else {
      toast.error("店舗とセラピストを選択してください");
    }
  };

  const handleRequestReview = () => {
    if (!isLoggedIn) {
      toast.error('この操作にはログインが必要です');
      navigate('/login');
      return;
    }
    navigate('/request-shop');
  };

  return (
    <section className="bg-slate-800 p-6 rounded-lg shadow-lg mb-6 border border-slate-700">
      <h2 className="text-xl font-bold text-pink-400 mb-4">セラピストを検索</h2>
      
      {/* 1. 都道府県 */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-300 mb-1">1. 都道府県</label>
        <select
          value={pref}
          onChange={handlePrefChange}
          className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-pink-500 outline-none"
        >
          <option value="">都道府県を選択</option>
          
          {/* ▼ 地方ごとにグループ化して表示 */}
          {groupedLocations ? (
            groupedLocations.map((group) => (
              <optgroup key={group.region} label={group.region}>
                {group.prefs.map(p => (
                  // データが存在する都道府県のみ表示
                  LOCATION_DATA[p] && LOCATION_DATA[p].length > 0 && (
                    <option key={p} value={p}>{p}</option>
                  )
                ))}
              </optgroup>
            ))
          ) : (
            Object.keys(LOCATION_DATA).map(p => (
              <option key={p} value={p}>{p}</option>
            ))
          )}

          {/* その他（未分類）エリア */}
          {groupedLocations && (
            <optgroup label="その他">
              {Object.keys(LOCATION_DATA)
                .filter(p => !groupedLocations.flatMap(g => g.prefs).includes(p))
                .map(p => <option key={p} value={p}>{p}</option>)}
            </optgroup>
          )}
        </select>
      </div>

      {/* 2. 地域 */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-300 mb-1">2. 地域（エリア詳細）</label>
        <select
          value={city}
          onChange={handleCityChange}
          disabled={!pref}
          className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 disabled:opacity-50 focus:border-pink-500 outline-none"
        >
          <option value="">{pref ? "エリアを選択" : "都道府県を選択してください"}</option>
          {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        {pref && city && shopOptions.length === 0 && (
          <div className="text-yellow-400 text-sm mt-2 bg-yellow-900/20 p-2 rounded">
            ⚠️ このエリアにはまだ登録店舗がありません。
            <button onClick={handleRequestReview} className="ml-2 underline hover:text-pink-400 font-bold">
              未掲載店舗として申請する
            </button>
          </div>
        )}
      </div>

      {/* 3. 店舗 */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-300 mb-1">3. 店舗</label>
        <select
          value={shopId}
          onChange={handleShopChange}
          disabled={!city || shopOptions.length === 0}
          className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 disabled:opacity-50 focus:border-pink-500 outline-none"
        >
          <option value="">店舗を選択</option>
          {shopOptions.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      </div>

      {/* 4. セラピスト */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">4. セラピスト</label>
        <select
          value={threadId}
          onChange={(e) => setThreadId(e.target.value)}
          disabled={!shopId || threadOptions.length === 0}
          className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 disabled:opacity-50 focus:border-pink-500 outline-none"
        >
          <option value="">セラピストを選択</option>
          {threadOptions.map(t => (
            <option key={t.id} value={t.id}>{t.therapistName || t.title || "名無し"}</option>
          ))}
        </select>
        {shopId && threadOptions.length === 0 && (
          <div className="text-gray-400 text-xs mt-1">※この店舗にはまだセラピストが登録されていません</div>
        )}
      </div>

      <button
        onClick={handleNavigate}
        disabled={!shopId || !threadId}
        className="w-full p-3 rounded-lg text-lg font-bold transition-colors bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed shadow-lg"
      >
        このセラピストを見る
      </button>
    </section>
  );
}
