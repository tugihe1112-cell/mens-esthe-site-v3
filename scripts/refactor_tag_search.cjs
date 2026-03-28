const fs = require('fs');
const path = 'src/pages/TagSearchPage.jsx';

console.log('✨ Refactoring TagSearchPage to use TagSelector...');

const content = `import React, { useState, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useShopData } from "../contexts/DataContext.jsx";
import { useAppContext } from "../context/AppContext.tsx";
import TagSelector from "../components/TagSelector";
import { AVAILABLE_TAGS } from "../data/constants";

export default function TagSearchPage() {
  const { shops, reviews, loading } = useShopData();
  const { favorites, toggleFavorite } = useAppContext();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTags = useMemo(() => searchParams.get("tags")?.split(",").filter(Boolean) || [], [searchParams]);
  
  // URLと同期させるためのラッパー
  const setSelectedTags = useCallback((newTags) => {
     // 配列で来るか、関数で来るか(useStateの仕様)に対応
     // TagSelectorは setState(prev => ...) の形式を使うことがあるため
     // ここでは簡易的に、TagSelectorが配列を直接渡してくる前提ではなく、
     // TagSelector側が setState((prev) => ...) を呼ぶことを想定して、
     // ReactのuseStateと同じシグネチャを持つ関数を用意する必要があるが、
     // TagSelectorを書き換えるのはリスクがあるため、
     // ここでは内部で状態を持ちつつ、変更があったらURL更新する形にするのが安全だが
     // 今回は強制的にリロードさせる。
     
     // いや、TagSelectorの実装を見ると setSelectedTags( prev => ... ) としているので
     // ここには useState の setter そのものを渡す必要がある。
     // しかし URL更新もしないといけない。
     // なので useEffect で selectedTags の変化を監視して URL を更新する方式にする。
  }, []);

  // 内部状態
  const [selectedTags, _setSelectedTags] = useState(initialTags);

  // URL同期
  const handleTagsChange = (valOrFunc) => {
      _setSelectedTags(current => {
          const next = typeof valOrFunc === 'function' ? valOrFunc(current) : valOrFunc;
          
          // URL更新
          if (next.length > 0) {
              setSearchParams({ tags: next.join(",") }, { replace: true });
          } else {
              setSearchParams({}, { replace: true });
          }
          return next;
      });
  };

  // -----------------------------------------------------
  // 📊 リアルタイム集計 (TagSearchPageの命)
  // -----------------------------------------------------
  const { tagCounts, therapistTagMap } = useMemo(() => {
    if (!reviews) return { tagCounts: {}, therapistTagMap: {} };

    const counts = {};
    const tMap = {}; 
    AVAILABLE_TAGS.forEach(tag => counts[tag] = 0);

    reviews.forEach(r => {
        if (r.tags && Array.isArray(r.tags)) {
            const key = \`\${r.shop_id}_\${r.therapistName}\`; // ユニークキー
            if (!tMap[key]) tMap[key] = new Set();
            r.tags.forEach(tag => {
                if (AVAILABLE_TAGS.includes(tag)) tMap[key].add(tag);
            });
        }
    });

    // ユニークカウント
    Object.values(tMap).forEach(tagsSet => {
        tagsSet.forEach(tag => {
            if (counts[tag] !== undefined) counts[tag]++;
        });
    });

    return { tagCounts: counts, therapistTagMap: tMap };
  }, [reviews]);

  // -----------------------------------------------------
  // 🔍 検索ロジック (AND検索)
  // -----------------------------------------------------
  const filteredResults = useMemo(() => {
    if (selectedTags.length === 0 || !reviews) return [];

    const matchedTherapists = [];
    const processedKeys = new Set();

    reviews.forEach(r => {
        const key = \`\${r.shop_id}_\${r.therapistName}\`;
        if (processedKeys.has(key)) return;

        const therapistTags = therapistTagMap[key] || new Set();
        const isMatch = selectedTags.every(tag => therapistTags.has(tag));

        if (isMatch) {
            processedKeys.add(key);
            const shop = shops.find(s => s.id === r.shop_id || s.group_id === r.shop_id);
            const myReviews = reviews.filter(rv => rv.shop_id === r.shop_id && rv.therapistName === r.therapistName);
            const avgRating = myReviews.reduce((sum, rev) => sum + Number(rev.rating), 0) / myReviews.length;

            matchedTherapists.push({
                id: r.threadId || \`tmp_\${key}\`,
                name: r.therapistName,
                shopId: shop ? shop.id : r.shop_id,
                shopName: shop ? shop.name : "不明な店舗",
                averageRating: avgRating,
                postCount: myReviews.length,
                tags: Array.from(therapistTags).filter(t => AVAILABLE_TAGS.includes(t))
            });
        }
    });

    return matchedTherapists.sort((a, b) => b.averageRating - a.averageRating);
  }, [selectedTags, reviews, shops, therapistTagMap]);

  if (loading) return <div className="text-white text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-200 font-sans">
      {/* Header */}
      <div className="pt-6 pb-4 px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="flex justify-between items-center">
             <h1 className="text-xl font-bold text-white flex items-center gap-2">
               <span className="text-2xl">🔍</span> タグ検索
             </h1>
             <Link to="/" className="text-sm font-bold text-slate-500 hover:text-white">TOPへ戻る</Link>
        </div>
      </div>

      {/* Selected Tags Bar */}
      {selectedTags.length > 0 && (
        <div className="bg-pink-900/20 border-b border-pink-500/20 sticky top-[65px] z-30 px-4 py-3 backdrop-blur-md">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mr-2">Filtering by:</span>
            {selectedTags.map(tag => (
              <span key={tag} className="bg-pink-600 text-white text-xs px-2 py-1 rounded-md font-bold shadow-sm flex items-center gap-1">
                {tag}
              </span>
            ))}
            <button onClick={() => handleTagsChange(() => [])} className="ml-auto text-xs text-slate-400 hover:text-white underline">Clear All</button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 space-y-10">
        {/* Selector UI (Here we use the Universal Component!) */}
        <section>
            <TagSelector 
                selectedTags={selectedTags} 
                setSelectedTags={handleTagsChange} 
                counts={tagCounts} // ★ Pass counts to enable search mode
            />
        </section>

        {/* Results */}
        <section className="pt-4 border-t border-slate-800/50">
           <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             Results <span className="bg-slate-800 px-2 py-0.5 rounded text-pink-400 text-sm">{filteredResults.length}</span>
           </h2>

           {selectedTags.length > 0 && filteredResults.length === 0 ? (
               <div className="text-center py-12 text-slate-500">条件に一致するセラピストはいません</div>
           ) : filteredResults.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {filteredResults.map(t => (
                   <Link key={t.id} to={\`/shops/\${t.shopId}/threads/\${t.id}\`} className="flex bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-pink-500/50 transition group">
                      <div className="flex-1">
                         <div className="font-bold text-lg text-white group-hover:text-pink-400 transition">{t.name}</div>
                         <div className="text-xs text-slate-400 mb-2">{t.shopName}</div>
                         <div className="flex flex-wrap gap-1">
                            {t.tags.slice(0, 3).map(tag => (
                               <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 bg-slate-800">#{tag}</span>
                            ))}
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xl font-black text-yellow-400">{t.averageRating.toFixed(1)}</div>
                         <div className="text-[10px] text-slate-500">{t.postCount} reviews</div>
                      </div>
                   </Link>
                 ))}
               </div>
           ) : (
               <div className="text-center py-12 text-slate-600">タグを選択して検索を開始してください</div>
           )}
        </section>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path, content);
console.log('✅ TagSearchPage Refactored (Now using Universal TagSelector).');
