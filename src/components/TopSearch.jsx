import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from '../compat/router';
import { useAppContext } from "../context/AppContext.tsx";

// === エリアグループ定義 (一覧ページと同じもの) ===
const TOKYO_GROUPS = [
  { title: "🟣 新宿・中野・杉並・吉祥寺方面", color: "text-purple-400 border-purple-400/30", cities: ["新宿区", "中野区", "杉並区", "武蔵野市", "三鷹市"] },
  { title: "🔵 池袋・練馬・赤羽方面", color: "text-blue-400 border-blue-400/30", cities: ["豊島区", "板橋区", "練馬区", "北区", "荒川区"] },
  { title: "🔴 渋谷・六本木・世田谷・品川方面", color: "text-red-400 border-red-400/30", cities: ["港区", "渋谷区", "品川区", "目黒区", "世田谷区", "大田区"] },
  { title: "🟢 秋葉原・錦糸町・銀座・東京東部", color: "text-green-400 border-green-400/30", cities: ["台東区", "中央区", "千代田区", "墨田区", "江東区", "江戸川区", "葛飾区", "足立区"] },
  { title: "⛰️ その他 市部 (多摩エリア)", color: "text-gray-400 border-gray-600/30", cities: ["八王子市", "立川市", "町田市", "府中市", "調布市", "西東京市", "小平市", "三鷹市", "日野市", "多摩市", "国分寺市", "小金井市", "東村山市", "昭島市"] }
];

const POPULAR_DEFINITIONS = [
  { label: "新宿", value: "新宿区", icon: "🔥", pref: "東京都" },
  { label: "池袋", value: "豊島区", icon: "💎", pref: "東京都" },
  { label: "渋谷", value: "渋谷区", icon: "✨", pref: "東京都" },
  { label: "五反田", value: "品川区", icon: "👠", pref: "東京都" },
  { label: "錦糸町", value: "墨田区", icon: "🌃", pref: "東京都" },
  { label: "六本木", value: "港区", icon: "🥂", pref: "東京都" },
  { label: "銀座", value: "中央区", icon: "👜", pref: "東京都" },
  { label: "横浜", value: "横浜市", icon: "🎡", pref: "神奈川県" },
  { label: "川崎", value: "川崎市", icon: "🐬", pref: "神奈川県" },
  { label: "大宮", value: "さいたま市", icon: "🚄", pref: "埼玉県" },
  { label: "梅田", value: "北区", icon: "🏢", pref: "大阪府" },
  { label: "名古屋", value: "名古屋市", icon: "🍤", pref: "愛知県" },
  { label: "博多", value: "博多", icon: "🍜", pref: "福岡県" },
];

export default function TopSearch() {
  const navigate = useNavigate();
  const { shops } = useAppContext();
  
  // 検索状態
  const [keyword, setKeyword] = useState("");
  const [selectedPref, setSelectedPref] = useState("all");
  const [selectedWard, setSelectedWard] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all"); // 詳細エリア (area)
  const [isModalOpen, setIsModalOpen] = useState(false);

  // データから都道府県構造を生成
  const locationGroups = useMemo(() => {
    const groups = {};
    shops.forEach(s => {
      const pref = s.prefecture || "その他";
      if (s.city) {
        if (!groups[pref]) groups[pref] = new Set();
        groups[pref].add(s.city);
      }
    });
    return Object.entries(groups).map(([pref, citySet]) => ({
      prefecture: pref,
      cities: Array.from(citySet).sort()
    }));
  }, [shops]);

  // 詳細エリア (Area) のリスト生成
  const availableAreas = useMemo(() => {
    if (selectedWard === "all") return [];
    const targetShops = shops.filter(s => s.city === selectedWard);
    const areas = new Set();
    targetShops.forEach(s => {
      if (Array.isArray(s.area)) s.area.forEach(a => areas.add(a));
      else if (s.area) areas.add(s.area);
    });
    return Array.from(areas).filter(a => a !== selectedWard).sort();
  }, [shops, selectedWard]);

  const handleAreaSelect = (pref, ward) => {
    setSelectedPref(pref);
    setSelectedWard(ward);
    setSelectedCity("all");
    setIsModalOpen(false);
  };

  const executeSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("search", keyword);
    if (selectedPref !== "all") params.set("pref", selectedPref);
    if (selectedWard !== "all") params.set("ward", selectedWard);
    if (selectedCity !== "all") params.set("area", selectedCity);
    
    navigate(`/shops?${params.toString()}`);
  };

  return (
    <div className="bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-700 shadow-xl mb-8">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        🔍 店舗・セラピストを探す
      </h2>

      <div className="space-y-4">
        {/* キーワード検索 */}
        <div className="relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="店舗名・エリアで検索..."
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-pink-500 outline-none pl-10"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {/* エリア選択ボタン */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-left hover:border-pink-500 transition flex justify-between items-center group"
        >
          <span className={selectedPref !== "all" ? "text-white font-bold" : "text-gray-400"}>
            📍 {selectedPref === "all" ? "エリアを選択してください" : `${selectedPref} ${selectedWard !== "all" ? "> " + selectedWard : ""}`}
          </span>
          <span className="bg-slate-800 text-gray-300 px-2 py-1 rounded text-xs group-hover:bg-pink-600 group-hover:text-white transition">変更</span>
        </button>

        {/* 詳細エリア絞り込み (Wardが選ばれている時) */}
        {availableAreas.length > 0 && (
          <div className="animate-fade-in">
            <p className="text-xs text-gray-400 mb-2 font-bold">詳細エリアを絞り込む:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCity("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border transition ${selectedCity === "all" ? "bg-pink-600 border-pink-500 text-white" : "bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600"}`}
              >
                すべて
              </button>
              {availableAreas.map(area => (
                <button
                  key={area}
                  onClick={() => setSelectedCity(area)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${selectedCity === area ? "bg-pink-600 border-pink-500 text-white font-bold" : "bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600"}`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 検索ボタン */}
        <button
          onClick={executeSearch}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition shadow-lg text-lg"
        >
          この条件で検索する
        </button>
      </div>

      {/* エリア選択モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">エリアを選択</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            
            <div className="p-4 space-y-8">
              {/* 人気エリア */}
              <div>
                <h4 className="text-pink-400 font-bold mb-3">🔥 人気・主要エリア</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {POPULAR_DEFINITIONS.map(def => (
                    <button key={def.label} onClick={() => handleAreaSelect(def.pref || "東京都", def.value)} className="bg-slate-800 p-2 rounded border border-slate-700 hover:border-pink-500 text-center transition hover:bg-slate-700">
                      <div className="text-2xl mb-1">{def.icon}</div>
                      <div className="text-sm font-bold text-gray-200">{def.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 東京都詳細 */}
              <div className="space-y-4">
                <h4 className="text-blue-400 font-bold border-l-4 border-blue-500 pl-3">東京都</h4>
                {TOKYO_GROUPS.map(g => (
                  <div key={g.title} className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                    <div className="text-sm font-bold text-gray-300 mb-2">{g.title}</div>
                    <div className="flex flex-wrap gap-2">
                      {g.cities.map(c => (
                        <button key={c} onClick={() => handleAreaSelect("東京都", c)} className="px-3 py-1.5 rounded bg-slate-900 border border-slate-600 hover:bg-pink-600 hover:text-white text-gray-300 text-sm transition">
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* その他全域 */}
              <div className="space-y-4">
                <h4 className="text-green-400 font-bold border-l-4 border-green-500 pl-3">その他のエリア</h4>
                {locationGroups.filter(g => g.prefecture !== "東京都").map(group => (
                  <div key={group.prefecture} className="bg-slate-800/50 p-3 rounded">
                    <h5 className="font-bold text-white mb-2">{group.prefecture}</h5>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleAreaSelect(group.prefecture, "all")} className="px-3 py-1.5 rounded bg-blue-900/30 border border-blue-500/50 text-blue-300 text-sm font-bold hover:bg-blue-800 transition">全域</button>
                      {group.cities.map(c => (
                        <button key={c} onClick={() => handleAreaSelect(group.prefecture, c)} className="px-3 py-1.5 rounded bg-slate-900 border border-slate-600 hover:bg-pink-600 hover:text-white text-gray-300 text-sm transition">
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
