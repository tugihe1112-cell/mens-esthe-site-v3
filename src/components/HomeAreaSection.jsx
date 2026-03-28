import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext.tsx";

// エリアグループ定義
const REGION_GROUPS = {
  "関東エリア": ["東京都", "神奈川県", "埼玉県", "千葉県"],
  "関西エリア": ["大阪府", "兵庫県", "京都府", "滋賀県"],
  "東海・北陸": ["愛知県", "静岡県", "福井県"],
  "北海道・東北": ["北海道", "宮城県"],
  "九州・その他": ["福岡県"]
};

export default function HomeAreaSection() {
  const { shops } = useAppContext();

  // 都道府県ごとの店舗数集計
  const prefectureCounts = useMemo(() => {
    const counts = {};
    shops?.forEach((shop) => {
      counts[shop.prefecture] = (counts[shop.prefecture] || 0) + 1;
    });
    return counts;
  }, [shops]);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black border-l-4 border-emerald-500 pl-4 flex items-center gap-2 text-white">
          <span>📍</span> エリアから探す
        </h2>
        <Link to="/area-search" className="text-emerald-400 font-bold hover:text-emerald-300 transition text-sm">
          詳細エリア選択へ →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(REGION_GROUPS).map(([regionName, prefs]) => {
          // その地域に店舗が1つでもあるかチェック
          const totalShopsInRegion = prefs.reduce((sum, pref) => sum + (prefectureCounts[pref] || 0), 0);
          if (totalShopsInRegion === 0) return null;

          return (
            <div key={regionName} className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/30 transition shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {regionName}
                </h3>
                <span className="text-xs text-slate-500 font-bold bg-slate-800 px-2 py-1 rounded">
                  {totalShopsInRegion}店舗
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {prefs.map((prefecture) => {
                  const count = prefectureCounts[prefecture] || 0;
                  if (count === 0) return null;

                  return (
                    <Link
                      key={prefecture}
                      // 🚀 ここを修正：/shops ではなく /area-search に飛ばす
                      to={`/area-search?prefecture=${prefecture}`}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition text-sm font-medium border border-slate-700 group"
                    >
                      {prefecture}
                      <span className="bg-black/30 group-hover:bg-white/20 text-xs px-1.5 py-0.5 rounded text-emerald-400 group-hover:text-white transition font-bold">
                        {count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
