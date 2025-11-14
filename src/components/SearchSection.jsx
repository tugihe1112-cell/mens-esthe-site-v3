// src/components/SearchSection.jsx (新規作成)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchLogic } from '../hooks/useSearchLogic.js'; // ★ ステップ2で作成
import { useAppContext } from '../context/AppContext.tsx';
import toast from 'react-hot-toast';

export default function SearchSection() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAppContext();
  
  // 1. 作成したフックからロジックをすべて取得
  const { values, options, errors, setters } = useSearchLogic();

  // 「このセラピストを見る」ボタンが押された時の処理
  const handleNavigate = () => {
    if (values.shopId && values.threadId) {
      navigate(`/shops/${values.shopId}/threads/${values.threadId}`);
    }
  };

  // 「未掲載申請」が押された時の処理 (仕様書 3.3)
  const handleRequestReview = (defaults) => {
    if (!isLoggedIn) {
      toast.error('この操作にはログインが必要です');
      navigate('/login');
      return;
    }
    // TODO: モーダルを開く (仕様書 4.3)
    // openModal('ReviewRequestModal', defaults);
    toast('（未実装）ここで未掲載申請モーダルを開きます', { icon: '🚧' });
    console.log('申請モーダルに渡す初期値:', defaults);
  };

  return (
    <section className="bg-slate-800 p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold text-pink-400 mb-4">セラピストを検索 (仕様書 3.2)</h2>
      
      {/* 1. 都道府県 */}
      <div className="mb-3">
        <label htmlFor="pref-select" className="block text-sm font-medium text-gray-300 mb-1">
          1. 都道府県
        </label>
        <select
          id="pref-select"
          value={values.pref}
          onChange={(e) => setters.setPref(e.target.value)}
          className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600"
        >
          <option value="">都道府県を選択</option>
          {options.prefectures.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {errors.noCities && (
          <div className="text-yellow-400 text-sm mt-2">
            選択した都道府県に登録地域がありません。
            <button 
              onClick={() => handleRequestReview({ pref: values.pref })}
              className="ml-2 underline hover:text-pink-400">
              未掲載として申請する
            </button>
          </div>
        )}
      </div>

      {/* 2. 地域 (市区町村) */}
      <div className="mb-3">
        <label htmlFor="city-select" className="block text-sm font-medium text-gray-300 mb-1">
          2. 地域（市区町村）
        </label>
        <select
          id="city-select"
          value={values.city}
          onChange={(e) => setters.setCity(e.target.value)}
          disabled={!values.pref || options.cities.length === 0} // 上位が未選択か、候補が0なら無効
          className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 disabled:opacity-50"
        >
          <option value="">地域を選択</option>
          {options.cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.noShops && (
          <div className="text-yellow-400 text-sm mt-2">
            この地域に登録店舗がまだありません。
            <button 
              onClick={() => handleRequestReview({ pref: values.pref, city: values.city })}
              className="ml-2 underline hover:text-pink-400">
              未掲載店舗として申請する
            </button>
          </div>
        )}
      </div>

      {/* 3. 店舗 */}
      <div className="mb-3">
        <label htmlFor="shop-select" className="block text-sm font-medium text-gray-300 mb-1">
          3. 店舗
        </label>
        <select
          id="shop-select"
          value={values.shopId}
          onChange={(e) => setters.setShop(e.target.value)}
          disabled={!values.city || options.shopOptions.length === 0}
          className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 disabled:opacity-50"
        >
          <option value="">店舗を選択</option>
          {options.shopOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {errors.noThreads && (
          <div className="text-yellow-400 text-sm mt-2">
            この店舗に登録されたセラピストはまだいません。
            <button 
              onClick={() => handleRequestReview({ pref: values.pref, city: values.city, shopId: values.shopId })}
              className="ml-2 underline hover:text-pink-400">
              未掲載セラピストとして申請する
            </button>
          </div>
        )}
      </div>

      {/* 4. セラピスト */}
      <div className="mb-4">
        <label htmlFor="thread-select" className="block text-sm font-medium text-gray-300 mb-1">
          4. セラピスト
        </label>
        <select
          id="thread-select"
          value={values.threadId}
          onChange={(e) => setters.setThread(e.target.value)}
          disabled={!values.shopId || options.threadOptions.length === 0}
          className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 disabled:opacity-50"
        >
          <option value="">セラピストを選択</option>
          {options.threadOptions.map(t => <option key={t.id} value={t.id}>{t.therapistName}</option>)}
        </select>
      </div>

      {/* 5. 決定ボタン */}
      <button
        onClick={handleNavigate}
        disabled={!values.threadId}
        className="w-full p-3 rounded-lg text-lg font-bold transition-colors bg-pink-600 text-white hover:bg-pink-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        このセラピストを見る
      </button>
    </section>
  );
}