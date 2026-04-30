import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { REGIONS, PREF_CITY_MAP, WARDS } from '../data/locations.js';

export default function PrefectureSelector() {
  const [activeRegion, setActiveRegion] = useState('kanto'); // デフォルト: 関東
  const [activePref, setActivePref] = useState(null);
  const [activeCity, setActiveCity] = useState(null);

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
                  const cities = PREF_CITY_MAP[pref] || [];
                  
                  if (cities.length === 0) return null; // データがない県は出さない（あるいはリンクにする）

                  return (
                    <div key={pref} className={`rounded-xl border transition-all ${isPrefOpen ? 'bg-slate-800 border-pink-500/50' : 'border-white/5'}`}>
                      <button
                        onClick={() => togglePref(pref)}
                        className="w-full flex items-center justify-between p-3"
                      >
                        <span className="text-sm font-bold text-slate-200">{pref}</span>
                        <span className={`text-xs text-slate-500 ${isPrefOpen ? 'rotate-180 text-pink-400' : ''}`}>▼</span>
                      </button>

                      {/* 3階層目: 市区町村 (新宿区) */}
                      {isPrefOpen && (
                        <div className="p-3 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                                {isCityOpen && areas.length > 0 && (
                                  <div className="mt-2 ml-2 pl-2 border-l border-pink-500/30 flex flex-col gap-1">
                                    <Link to={`/shops?q=${pref} ${city}`} className="text-[10px] text-pink-400 py-1">
                                      👉 {city}すべて
                                    </Link>
                                    {areas.map((area) => (
                                      <Link 
                                        key={area} 
                                        to={`/shops?q=${pref} ${area}`} // ★都道府県名を追加して検索
                                        className="text-[10px] text-slate-400 hover:text-white py-0.5"
                                      >
                                        - {area}
                                      </Link>
                                    ))}
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
            )}
          </div>
        );
      })}
    </div>
  );
}
