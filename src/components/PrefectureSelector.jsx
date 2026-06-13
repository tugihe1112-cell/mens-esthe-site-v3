import React, { useState, useMemo } from 'react';
import { Link } from '../compat/router';
import { REGIONS, PREF_CITY_MAP, WARDS } from '../data/locations.js';



const POPULAR_WARDS = [
  { name: "新宿区", count: 42, icon: "🏙️" },
  { name: "渋谷区", count: 38, icon: "✨" },
  { name: "港区", count: 35, icon: "🍸" },
  { name: "豊島区", count: 24, icon: "🦉" },
  { name: "千代田区", count: 18, icon: "🏢" },
  { name: "中央区", count: 15, icon: "🍣" }
];
const TOKYO_GROUPS = [
  { label: "城東", items: ["墨田区", "江東区", "足立区", "荒川区", "台東区"], colorClass: "border-blue-500 text-blue-400" },
  { label: "城南", items: ["世田谷区", "品川区", "大田区", "目黒区"], colorClass: "border-emerald-500 text-emerald-400" },
  { label: "城西", items: ["中野区", "新宿区", "杉並区", "渋谷区"], colorClass: "border-purple-500 text-purple-400" },
  { label: "城北", items: ["北区", "練馬区", "豊島区"], colorClass: "border-yellow-500 text-yellow-400" },
  { label: "都心", items: ["中央区", "千代田区", "港区"], colorClass: "border-pink-500 text-pink-400" },
  { label: "市部", items: ["三鷹市", "八王子市", "調布市", "立川市", "国分寺市", "小金井市", "府中市", "武蔵野市", "多摩市", "23区出張"], colorClass: "border-slate-500 text-slate-400" }
];

  const AreaPanel = ({ city, pref, areas, activePlaces }) => {
    const filteredAreas = activePlaces && activePlaces.size > 0
      ? areas.filter(area => activePlaces.has(area))
      : areas;
    return (
      <div className="mt-4 w-full bg-gradient-to-r from-pink-950/60 to-purple-950/60 rounded-xl border-t-2 border-pink-500 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4">
        <div className="p-4">
          <div className="text-pink-400 text-sm font-bold mb-4 flex items-center gap-2">
            <span className="animate-pulse">📍</span> {city}のエリア
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/shops?q=${pref} ${city}`}
              className="bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold px-4 py-2 rounded-lg shadow-lg transition-all active:scale-95"
            >
              ✨ {city}すべて
            </Link>
            {filteredAreas.map((area) => (
              <Link
                key={area}
                to={`/shops?q=${pref} ${area}`}
                className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-pink-500 text-slate-300 hover:text-white text-[11px] px-3 py-2 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(236,72,153,0.4)]"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
export default function PrefectureSelector({ shops = [] }) {
  const [activeRegion, setActiveRegion] = useState('kanto'); // デフォルト: 関東
  const [activePref, setActivePref] = useState(null);
  const [activeCity, setActiveCity] = useState(null);

  // 実際に店舗が存在する場所のセット（city・area 両方を収録）
  // PREF_CITY_MAP の値はエリア名（例: "川越"）で、
  // shop.city は行政名（例: "川越市"）の場合があるため area も含める
  const activePlaces = useMemo(() => {
    const set = new Set();
    for (const shop of shops) {
      if (shop.city) set.add(shop.city);
      if (shop.area) set.add(shop.area);
    }
    return set;
  }, [shops]);

  const toggleRegion = (id) => setActiveRegion(activeRegion === id ? null : id);
  const togglePref = (pref) => {
    setActivePref(activePref === pref ? null : pref);
    setActiveCity(null);
  };
  const toggleCity = (city) => setActiveCity(activeCity === city ? null : city);

  return (
    <div className="w-full space-y-3">
      {REGIONS.map((region) => {
        const isOpen = activeRegion === region.id;
        
        return (
          <div key={region.id} className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
            {/* 1階層目: 地方 (関東) */}
            <button
              onClick={() => toggleRegion(region.id)}
              className={`w-full flex items-center justify-between p-4 ${isOpen ? 'bg-white/5' : 'hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-1.5 h-6 rounded-full ${region.color}`}></span>
                <span className="text-base font-bold text-white tracking-widest">{region.name}</span>
              </div>
              <span className="text-slate-500">▼</span>
            </button>

            {/* 2階層目: 都道府県 (東京都) */}
            {isOpen && (
              <div className="bg-black/20 p-2 grid grid-cols-1 gap-1">
                {region.prefs.map((pref) => {
                  const isPrefOpen = activePref === pref;
                  // その県に紐づく市区町村があるかチェック
                  // locations.js の全 city リストから実際に店舗が存在するものだけ絞り込む
                  // 都道府県名と同名のエントリー（例: 埼玉県の中の"埼玉県"）は除外する
                  const cities = (PREF_CITY_MAP[pref] || []).filter(city =>
                    city !== pref &&
                    (shops.length === 0 || activePlaces.has(city))
                  );

                  if (cities.length === 0) return null; // データがない県は出さない

                  return (
                    <div key={pref} className={`rounded-xl border transition-all ${isPrefOpen ? 'bg-slate-800 border-pink-500/50' : 'border-white/5'}`}>
                      <button
                        onClick={() => togglePref(pref)}
                        className="w-full flex items-center justify-between p-3"
                      >
                        <span className="text-sm font-bold text-slate-200">{pref}</span>
                        <span className={`text-xs text-slate-500 ${isPrefOpen ? 'rotate-180 text-pink-400' : ''}`}>▼</span>
                      </button>

                      {/* 3階層目: 市区町村 */}
                      {isPrefOpen && pref === "東京都" ? (
                        <div className="p-4 bg-slate-900 rounded-b-xl border-t border-slate-700">
                          
                          {/* ① よく検索されるエリア */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-slate-300 text-xs font-bold tracking-widest">よく検索されるエリア</span>
                              <div className="h-[1px] flex-grow bg-gradient-to-r from-pink-500/50 to-transparent"></div>
                            </div>
                            <div className="flex overflow-x-auto pb-3 gap-3 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                              <style>{`.snap-x::-webkit-scrollbar { display: none; }`}</style>
                              {POPULAR_WARDS.map(ward => (
                                <button
                                  key={`popular-${ward.name}`}
                                  onClick={() => toggleCity(ward.name)}
                                  className={`flex-shrink-0 snap-start flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border ${
                                    activeCity === ward.name 
                                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.8)] scale-105 border-pink-300' 
                                      : 'bg-gradient-to-r from-slate-800 to-slate-800 border-slate-700 text-slate-200'
                                  }`}
                                >
                                  <span className="text-sm">{ward.icon}</span>
                                  <span className="font-bold text-sm tracking-wider">{ward.name}</span>
                                  <span className="bg-black/50 text-[10px] px-2 py-0.5 rounded-full text-slate-300 border border-white/10">{ward.count}件</span>
                                </button>
                              ))}
                            </div>
                            {/* 【新規】よく検索されるエリアが選択された場合のインライン展開 */}
                            {activeCity && POPULAR_WARDS.some(w => w.name === activeCity) && (
                              <AreaPanel city={activeCity} pref={pref} areas={WARDS[activeCity] || []} activePlaces={activePlaces} />
                            )}
                          </div>

                          {/* ② エリアから探す */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-slate-300 text-xs font-bold tracking-widest">エリアから探す</span>
                              <div className="h-[1px] flex-grow bg-gradient-to-r from-pink-500/50 to-transparent"></div>
                            </div>
                            <div className="space-y-4">
                              {TOKYO_GROUPS.map(group => (
                                <div key={group.label}>
                                  <div className="flex flex-col lg:flex-row lg:items-start gap-2 lg:gap-4">
                                    <div className={`flex items-center gap-2 min-w-[50px] pt-1.5 border-l-4 pl-2 ${group.colorClass}`}>
                                      <span className="text-xs font-bold tracking-widest">{group.label}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 flex-grow">
                                      {group.items.map(city => (
                                        <button
                                          key={`group-${group.label}-${city}`}
                                          onClick={() => toggleCity(city)}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border ${
                                            activeCity === city 
                                              ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_12px_rgba(236,72,153,0.8)]' 
                                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-pink-500'
                                          }`}
                                        >
                                          {city}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  {/* 【新規】このグループ内のエリアが選択された場合のインライン展開 */}
                                  {activeCity && group.items.includes(activeCity) && (
                                    <AreaPanel city={activeCity} pref={pref} areas={WARDS[activeCity] || []} activePlaces={activePlaces} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : isPrefOpen && (
                        <div className="p-3 pt-0">
                          {/* 都道府県すべて表示ボタン */}
                          <Link
                            to={`/shops?q=${pref}`}
                            className="flex items-center justify-center gap-2 w-full mb-3 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
                          >
                            ✨ {pref}の店舗をすべて見る
                          </Link>
                          {/* エリア別ボタン */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {cities.map((city) => {
                            const isCityOpen = activeCity === city;
                            const areas = WARDS[city] || [];
                            
                            return (
                              <div key={city} className="col-span-1">
                                <button
                                  onClick={() => toggleCity(city)}
                                  className={`w-full text-left p-2 rounded-lg border text-xs font-bold flex justify-between items-center ${
                                    isCityOpen ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-700 border-white/5 text-slate-300'
                                  }`}
                                >
                                  {city}
                                  {areas.length > 0 && <span className="text-[9px] opacity-70">▼</span>}
                                </button>

                                {/* 4階層目 (詳細エリア): 歌舞伎町、新宿三丁目... */}
                                {isCityOpen && (
                                    <div className="col-span-full mt-2">
                                      <AreaPanel city={city} pref={pref} areas={areas} activePlaces={activePlaces} />
                                    </div>
                                  )}
                              </div>
                            );
                          })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
