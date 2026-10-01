import React, { useState } from 'react';
import { Link } from '../compat/router';
import { usePublicRankingData } from '../features/ranking/hooks/usePublicRankingData.js';
import { useRankingData } from '../features/ranking/hooks/useRankingData.js';
import { RANKING_CATEGORIES, MIN_REVIEWS_FOR_RANKING } from '../features/ranking/utils/rankingHelpers.js';
import { RankingEmptyState } from '../features/ranking/components/RankingEmptyState.jsx';
import LazyImage from './LazyImage.jsx';

export default function RankingSection() {
  const { data, loading, error, retry } = usePublicRankingData();
  const [rankingTab, setRankingTab] = useState('total');
  const { ranking, targetReviewCount } = useRankingData(data, 'all', rankingTab);
  const topTherapists = ranking.slice(0, 5);

  return (
    <section className="relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-slate-700 pb-3">
        <div>
          <h2 className="font-mincho text-[26px] md:text-[32px] font-bold leading-[1.3] text-slate-50">部門別ランキング</h2>
          <p className="text-slate-400 text-sm mt-1">
            公開口コミの評価を集計。部門ごとに{MIN_REVIEWS_FOR_RANKING}件以上の評価で掲載
          </p>
        </div>

        {/* タブメニュー */}
        <div role="group" aria-label="ランキングの部門" className="flex divide-x divide-slate-700 rounded-sm border border-slate-700 overflow-x-auto no-scrollbar max-w-full">
          {RANKING_CATEGORIES.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setRankingTab(cat.id)}
               aria-pressed={rankingTab === cat.id}
               className={`min-h-11 whitespace-nowrap px-4 text-sm transition-colors ${
                 rankingTab === cat.id
                 ? 'bg-slate-800 font-bold text-slate-50'
                 : 'text-slate-400 hover:text-white'
               }`}
             >
               {cat.label}
             </button>
          ))}
        </div>
      </div>

      {/* ランキングリスト表示 */}
      <div className="grid">
         {!loading && !error && topTherapists.map((item, index) => (
            <Link 
              key={item.key} 
              to={`/shops/${encodeURIComponent(item.shopId)}/threads/${encodeURIComponent(item.therapistId)}`}
              className="group flex items-center gap-4 border-b border-slate-800 py-4 transition-colors"
            >
               {/* 順位（金・銀・銅の色はやめ、数字の書体で。上位3つだけ朱） */}
               <div className={`w-10 flex-shrink-0 text-center font-numeral text-[32px] font-semibold leading-none ${index < 3 ? 'text-pink-400' : 'text-slate-500'}`}>
                 {String(index + 1).padStart(2, '0')}
               </div>

               {/* 画像 */}
               <div className="w-16 h-16 overflow-hidden border border-slate-700 flex-shrink-0 relative">
                 <LazyImage src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover" />
               </div>

               {/* 情報 */}
               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2">
                    <h3 className="font-mincho text-slate-50 font-bold text-lg truncate group-hover:text-pink-300 transition">
                      {item.name}
                    </h3>
                    {item.age && <span className="shrink-0 text-xs text-slate-400">{item.age}歳</span>}
                 </div>
                 <p className="text-xs text-slate-400 truncate mt-1">{item.shopName}</p>
               </div>

               {/* スコア（口コミ件数を必ず併記＝母数を隠さない） */}
               <div className="text-right hidden sm:block">
                 <div className="font-numeral text-3xl font-semibold text-slate-50 leading-none">
                   {item.averageRating.toFixed(1)}
                 </div>
                 <div className="text-xs text-slate-400 mt-1">評価{item.count}件</div>
               </div>
               {/* モバイルは省スペースで1行に */}
               <div className="text-right sm:hidden">
                 <div className="font-numeral text-2xl font-semibold text-slate-50 leading-none">
                   {item.averageRating.toFixed(1)}
                 </div>
                 <div className="text-xs text-slate-400 mt-0.5">{item.count}件</div>
               </div>
               
               <div aria-hidden="true" className="text-slate-600 group-hover:text-pink-400 transition-colors px-1">→</div>
            </Link>
         ))}
         
         {loading ? (
           <p role="status" className="py-8 text-slate-400">ランキングを読み込んでいます…</p>
         ) : (error || topTherapists.length === 0) && (
           <RankingEmptyState error={error} targetReviewCount={targetReviewCount} onRetry={retry} />
         )}
      </div>
    </section>
  );
}
