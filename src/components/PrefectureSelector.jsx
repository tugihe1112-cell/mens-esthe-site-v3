import React, { useState, useMemo } from 'react';
import { Link } from '../compat/router';
import { REGIONS, PREF_CITY_MAP, WARDS } from '../data/locations.js';
import { shopAreaList } from '../utils/shopFields';



// 件数は固定値を持たない。以前は「新宿区 42件」のような手書きの数字が入っており、
// 実数（2026-09-24 時点で新宿区は約70店）と食い違っていた＝根拠のない数字（D-010と同じ考え方）。
// 件数は shops から数え、読み込み前は出さない。
const POPULAR_WARDS = [
  { name: "新宿区" },
  { name: "渋谷区" },
  { name: "港区" },
  { name: "豊島区" },
  { name: "千代田区" },
  { name: "中央区" }
];
const TOKYO_GROUPS = [
  { label: "城東", items: ["墨田区", "江東区", "足立区", "荒川区", "台東区", "葛飾区", "江戸川区"], colorClass: "border-slate-600 text-slate-300" },
  { label: "城南", items: ["世田谷区", "品川区", "大田区", "目黒区"], colorClass: "border-slate-600 text-slate-300" },
  { label: "城西", items: ["中野区", "新宿区", "杉並区", "渋谷区"], colorClass: "border-slate-600 text-slate-300" },
  { label: "城北", items: ["北区", "練馬区", "豊島区"], colorClass: "border-slate-600 text-slate-300" },
  { label: "都心", items: ["中央区", "千代田区", "港区"], colorClass: "border-slate-600 text-slate-300" },
  { label: "市部", items: ["三鷹市", "八王子市", "日野市", "調布市", "立川市", "国分寺市", "小金井市", "府中市", "武蔵野市", "多摩市", "町田市", "23区出張"], colorClass: "border-slate-600 text-slate-300" }
];

  const AreaPanel = ({ city, pref, areas, activePlaces }) => {
    const filteredAreas = activePlaces && activePlaces.size > 0
      ? areas.filter(area => activePlaces.has(area))
      : areas;
    return (
      <div className="mt-4 w-full border border-slate-700 border-t-2 border-t-pink-500 bg-slate-900 overflow-hidden animate-in fade-in slide-in-from-top-4">
        <div className="p-4">
          {/* D-009-ok: ここの city は「市区を選んだとき」にだけ描画される見出しで、
              空になることがない（店舗レコードの欠損しうる住所とは別）。 */}
          <div className="font-mincho text-slate-50 text-base font-bold mb-4">
            {city}のエリア
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/shops?q=${pref} ${city}`}
              className="inline-flex min-h-9 items-center bg-pink-500 hover:bg-pink-400 text-slate-950 text-xs font-bold px-4 rounded-sm transition-colors active:scale-95"
            >
              {city}すべて
            </Link>
            {filteredAreas.map((area) => (
              <Link
                key={area}
                to={`/shops?q=${pref} ${area}`}
                className="inline-flex min-h-9 items-center border border-slate-700 hover:border-pink-500 text-slate-200 hover:text-white text-xs px-3 rounded-sm transition-colors"
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
  const [activeRegion, setActiveRegion] = useState(null); // 全地方を同列表示
  const [activePref, setActivePref] = useState(null);
  const [activeCity, setActiveCity] = useState(null);
  // どこから開いたか（'popular' | 'group'）。渋谷区などは「よく検索されるエリア」と区の一覧の両方にあるので、
  // これを持たないと地名パネルが2か所に同時に開いていた。
  const [activeCitySource, setActiveCitySource] = useState(null);

  // 実際に店舗が存在する場所のセット（city・area 両方を収録）
  // PREF_CITY_MAP の値はエリア名（例: "川越"）で、
  // shop.city は行政名（例: "川越市"）の場合があるため area も含める
  // raw_data.area は複数ルームの店で配列になる（65店・2026-09-24）。shapeShopRow は配列の area を
  // undefined にするため、shop.area だけを見るとこの店たちがエリア選択に一切出なかった。
  const activePlaces = useMemo(() => {
    const set = new Set();
    for (const shop of shops) {
      if (shop.city) set.add(shop.city);
      for (const a of shopAreaList(shop)) set.add(a);
    }
    return set;
  }, [shops]);

  // 「よく検索されるエリア」の件数。区そのもの（city）か、その区のエリア（WARDS）に当たる東京の店を数える。
  const wardCounts = useMemo(() => {
    const counts = {};
    for (const { name } of POPULAR_WARDS) {
      const places = new Set([name, ...(WARDS[name] || [])]);
      counts[name] = shops.filter(shop =>
        shop.prefecture === '東京都' &&
        (places.has(shop.city) || shopAreaList(shop).some(a => places.has(a)))
      ).length;
    }
    return counts;
  }, [shops]);

  const toggleRegion = (id) => setActiveRegion(activeRegion === id ? null : id);
  const togglePref = (pref) => {
    setActivePref(activePref === pref ? null : pref);
    setActiveCity(null);
  };
  const toggleCity = (city, source = null) => {
    const closing = activeCity === city && activeCitySource === source;
    setActiveCity(closing ? null : city);
    setActiveCitySource(closing ? null : source);
  };

  return (
    <div className="w-full space-y-3">
      {REGIONS.map((region) => {
        const isOpen = activeRegion === region.id;
        
        return (
          <div key={region.id} className="border-b border-slate-800 overflow-hidden">
            {/* 1階層目: 地方 (関東) */}
            <button
              onClick={() => toggleRegion(region.id)}
              className={`w-full flex min-h-14 items-center justify-between px-1 py-3 transition-colors ${isOpen ? 'text-pink-300' : 'hover:text-pink-300'}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-px h-5 bg-pink-500"></span>
                <span className="font-mincho text-lg font-bold text-slate-50">{region.name}</span>
              </div>
              <span aria-hidden="true" className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {/* 2階層目: 都道府県 (東京都) */}
            {isOpen && (
              <div className="pb-3 grid grid-cols-1 gap-1">
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
                    <div key={pref} className={`border transition-colors ${isPrefOpen ? 'bg-slate-900 border-pink-500/50' : 'border-slate-800'}`}>
                      <button
                        onClick={() => togglePref(pref)}
                        className="w-full flex items-center justify-between p-3"
                      >
                        <span className="text-sm font-bold text-slate-100">{pref}</span>
                        <span aria-hidden="true" className={`text-xs text-slate-500 transition-transform ${isPrefOpen ? 'rotate-180 text-pink-400' : ''}`}>▾</span>
                      </button>

                      {/* 3階層目: 市区町村 */}
                      {isPrefOpen && pref === "東京都" ? (
                        <div className="p-4 bg-slate-900 border-t border-slate-800">
                          
                          {/* ① よく検索されるエリア */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-slate-300 text-xs font-bold tracking-widest">よく検索されるエリア</span>
                              <div className="h-px flex-grow bg-slate-700"></div>
                            </div>
                            <div className="flex overflow-x-auto pb-3 gap-3 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                              <style>{`.snap-x::-webkit-scrollbar { display: none; }`}</style>
                              {POPULAR_WARDS.map(ward => (
                                <button
                                  key={`popular-${ward.name}`}
                                  onClick={() => toggleCity(ward.name, 'popular')}
                                  className={`flex-shrink-0 snap-start flex min-h-10 items-center gap-2 px-4 rounded-full transition-colors border ${
                                    activeCity === ward.name
                                      ? 'bg-pink-500 border-pink-500 text-slate-950 font-bold'
                                      : 'border-slate-700 text-slate-200 hover:border-pink-500/60'
                                  }`}
                                >
                                  <span className="text-sm">{ward.name}</span>
                                  {wardCounts[ward.name] > 0 && (
                                    <span className={`font-numeral text-base ${activeCity === ward.name ? 'text-slate-900' : 'text-slate-400'}`}>{wardCounts[ward.name]}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                            {/* 【新規】よく検索されるエリアが選択された場合のインライン展開 */}
                            {activeCity && activeCitySource === 'popular' && POPULAR_WARDS.some(w => w.name === activeCity) && (
                              <AreaPanel city={activeCity} pref={pref} areas={WARDS[activeCity] || []} activePlaces={activePlaces} />
                            )}
                          </div>

                          {/* ② エリアから探す */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-slate-300 text-xs font-bold tracking-widest">エリアから探す</span>
                              <div className="h-px flex-grow bg-slate-700"></div>
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
                                          onClick={() => toggleCity(city, 'group')}
                                          className={`inline-flex min-h-9 items-center px-3 rounded-sm text-xs transition-colors border ${
                                            activeCity === city
                                              ? 'bg-pink-500 border-pink-500 text-slate-950 font-bold'
                                              : 'border-slate-700 text-slate-200 hover:border-pink-500'
                                          }`}
                                        >
                                          {city}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  {/* 【新規】このグループ内のエリアが選択された場合のインライン展開 */}
                                  {activeCity && activeCitySource === 'group' && group.items.includes(activeCity) && (
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
                            className="flex min-h-11 items-center justify-center gap-2 w-full mb-3 rounded-sm bg-pink-500 hover:bg-pink-400 text-slate-950 text-sm font-bold transition-colors active:scale-95"
                          >
                            {pref}の店舗をすべて見る <span aria-hidden="true">→</span>
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
                                  className={`w-full min-h-10 text-left px-2.5 rounded-sm border text-xs font-bold flex justify-between items-center transition-colors ${
                                    isCityOpen ? 'bg-pink-500 border-pink-500 text-slate-950' : 'border-slate-700 text-slate-200 hover:border-pink-500/60'
                                  }`}
                                >
                                  {city}
                                  {areas.length > 0 && <span className="text-xs opacity-70">▼</span>}
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
