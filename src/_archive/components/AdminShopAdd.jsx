// src/components/AdminShopAdd.jsx
// 管理画面用：新規店舗＆セラピスト追加フォーム
// 2025.11.22 REGIONS対応・完全版

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
// ▼ REGIONS も読み込んで、地域ブロックごとの表示に対応
import { LOCATION_DATA, REGIONS, WARDS } from '../data/locations';

export default function AdminShopAdd() {
  const { addShop } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: '',
    prefecture: '東京都',
    city: '',
    therapistName: ''
  });

  // 都道府県が変わったら、エリア詳細をリセットする
  useEffect(() => {
    setFormData(prev => ({ ...prev, city: '' }));
  }, [formData.prefecture]);

  // 現在選択されている都道府県に応じた市区町村リストを取得
  const currentCityOptions = LOCATION_DATA[formData.prefecture] || WARDS[formData.prefecture] || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !formData.therapistName) {
      alert('店舗名、エリア、セラピスト名は必須です');
      return;
    }

    // AppContextの関数を呼び出して追加
    addShop(formData.name, formData.prefecture, formData.city, formData.therapistName);

    // フォームをリセット
    setFormData(prev => ({ ...prev, name: '', city: '', therapistName: '' }));
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md mb-8 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🏪</span>
        <div>
          <h2 className="text-xl font-bold text-white">新規店舗とセラピストの追加</h2>
          <p className="text-sm text-gray-400">新しい店舗と、最初のセラピストを同時に登録します</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 店舗情報セクション */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">店舗情報</h3>
          
          {/* 店舗名 */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">店舗名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="例：アロマエクスプレス 渋谷店"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 都道府県選択（地域別グループ表示） */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-1">都道府県 <span className="text-red-500">*</span></label>
              <select
                className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                value={formData.prefecture}
                onChange={(e) => setFormData({...formData, prefecture: e.target.value})}
              >
                <option value="">都道府県を選択</option>
                
                {/* REGIONSを使って「関東エリア」「関西エリア」などでグループ化 */}
                {Object.entries(REGIONS).map(([regionName, prefs]) => (
                  <optgroup key={regionName} label={regionName}>
                    {prefs.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </optgroup>
                ))}

                {/* 東京都の場合は区も追加 */}
                {WARDS["東京都"] && (
                  <optgroup label="東京都 - 区">
                    {WARDS["東京都"].map(ward => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </optgroup>
                )}

                {/* 万が一 REGIONS に漏れた県があれば「その他」に表示する安全策 */}
                <optgroup label="その他エリア">
                  {Object.keys(LOCATION_DATA)
                    .filter(p => !Object.values(REGIONS).flat().includes(p) && p !== 'default')
                    .map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              </select>
            </div>

            {/* 市区町村（動的リスト） */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-1">エリア詳細 <span className="text-red-500">*</span></label>
              <select
                className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                disabled={!formData.prefecture}
              >
                <option value="">
                  {formData.prefecture ? "エリアを選択してください" : "先に都道府県を選んでください"}
                </option>
                
                {/* locations.js の細かいエリアデータを展開 */}
                {currentCityOptions.map((city) => (
                  <option key={city} value={city} disabled={city.startsWith('---')} style={city.startsWith('---') ? { backgroundColor: '#eee', fontWeight: 'bold', color: '#333' } : {}}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* セラピスト情報セクション */}
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider">初期在籍セラピスト</h3>
          
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">セラピスト名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full p-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 outline-none"
              placeholder="例：さくら"
              value={formData.therapistName}
              onChange={(e) => setFormData({...formData, therapistName: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">※店舗作成時に最低1名の登録が必要です。後から追加も可能です。</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-lg shadow-lg transform transition hover:scale-[1.01] active:scale-[0.99]"
        >
          店舗とセラピストを登録する
        </button>
      </form>
    </div>
  );
}