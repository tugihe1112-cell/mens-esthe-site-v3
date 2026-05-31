import React, { useState, useMemo } from 'react';
import { useShopData } from '../contexts/DataContext.jsx';
import { useRankingData } from '../features/ranking/hooks/useRankingData';
import { PodiumCard } from '../features/ranking/components/PodiumCard';
import { RankingListItem } from '../features/ranking/components/RankingListItem';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { RankingListSkeleton } from '../components/ui/Skeleton.jsx';

// --- Tab Config ---
const PERIOD_TABS = [
  { id: 'monthly', label: '月間', sub: 'MONTHLY' },
  { id: 'weekly', label: '週間', sub: 'WEEKLY' },
  { id: 'newcomer', label: '新人', sub: 'NEWCOMER' }
];

const AREA_OPTIONS = [
  "全国", "歌舞伎町", "池袋", "吉原", "五反田", "上野", "錦糸町", "恵比寿", "六本木", "渋谷", 
  "横浜", "川崎", "大宮", "西川口", "船橋", "梅田", "日本橋", "難波", "名古屋"
];

export default function RankingPage() {
  const { shops, reviews, loading, error } = useShopData();
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedArea, setSelectedArea] = useState('全国');
  
  // Custom Hook for Logic (Basic Ranking)
  // まずは全データを取得
  const allRankingData = useRankingData(reviews, shops, activeTab);

  // エリアフィルタリング
  const filteredRankingData = useMemo(() => {
    if (selectedArea === '全国') return allRankingData;

    return allRankingData.filter(item => {
      // item.shopName から shop オブジェクトを探す、または item に shopId があるはず
      // useRankingData の戻り値には shopId が含まれている前提
      const shop = shops.find(s => s.id === item.shopId);
      if (!shop) return false;
      
      const area = (shop.area || '').toLowerCase();
      const city = (shop.city || '').toLowerCase();
      const pref = (shop.prefecture || '').toLowerCase();
      const target = selectedArea.toLowerCase();

      return area.includes(target) || city.includes(target) || pref.includes(target);
    });
  }, [allRankingData, selectedArea, shops]);

  const [showAll, setShowAll] = useState(false);
  const top3 = filteredRankingData.slice(0, 3);
  const others = filteredRankingData.slice(3, showAll ? undefined : 50);

  return (
    <div className="min-h-screen bg-slate-950 pb-28 md:pb-16 text-slate-200 overflow-hidden relative font-sans">
      <SeoHead title={`${selectedArea}のエステランキング`} description={`メンズエステの人気ランキング。${selectedArea}エリアのセラピスト・店舗の評判をチェック。`} />
      <Header />

      {/* 1. Cinematic Hero Header */}
      <div className="relative h-[40vh] w-full overflow-hidden flex items-center justify-center mb-0">
        {/* 背景エフェクト */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-sm"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950"></div>
        
        <div className="relative z-10 text-center px-4 pt-10">
           <span className="inline-block px-4 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-xs font-bold tracking-[0.3em] mb-4 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
             OFFICIAL RANKING
           </span>
           <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl mb-2 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
             HALL OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">FAME</span>
           </h1>
           <p className="text-slate-400 text-sm font-bold tracking-widest uppercase animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
             Top Rated Therapists & Shops
           </p>
        </div>
      </div>

      {/* 2. Control Bar (Area & Period) */}
      <div className="sticky top-20 z-40 bg-slate-950 border-b border-white/5 shadow-2xl mb-12">
        <div className="max-w-4xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Period Tabs（右端フェードでスワイプ感を示唆） */}
          <div className="relative w-full md:w-auto">
            <div className="flex overflow-x-auto hide-scrollbar">

             {PERIOD_TABS.map((tab) => {
               const isActive = activeTab === tab.id;
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex-1 md:flex-none px-6 py-3 text-xs md:text-sm font-black tracking-widest transition-all relative group whitespace-nowrap ${
                     isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                   }`}
                 >
                   <div className="flex flex-col items-center">
                     <span>{tab.label}</span>
                     <span className={`text-[9px] font-normal mt-0.5 transition ${isActive ? 'opacity-70' : 'opacity-0 group-hover:opacity-50'}`}>
                       {tab.sub}
                     </span>
                   </div>
                   {isActive && (
                     <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_-2px_10px_rgba(236,72,153,0.5)]"></span>
                   )}
                 </button>
               );
             })}
            </div>
            {/* 右端フェード（スワイプ感示唆、md以上では非表示） */}
            <div className="md:hidden absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-slate-950/90 to-transparent pointer-events-none" />
          </div>

          {/* Area Selector */}
          <div className="relative w-full md:w-48">
             <select 
               value={selectedArea} 
               onChange={(e) => setSelectedArea(e.target.value)}
               className="w-full bg-slate-900 border border-white/10 rounded-full px-4 py-2 text-sm font-bold text-white appearance-none focus:border-pink-500 focus:outline-none cursor-pointer hover:bg-slate-800 transition shadow-inner"
             >
               {AREA_OPTIONS.map(area => <option key={area} value={area}>{area}</option>)}
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>

        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        
        {loading ? (
          /* スケルトン: 表彰台3枠 + リスト5行 */
          <>
            <div className="grid grid-cols-3 gap-2 md:gap-6 items-end mb-16 px-1 min-h-[320px]">
              <div className="order-1 h-52 bg-slate-800 animate-pulse rounded-3xl" />
              <div className="order-2 h-72 bg-slate-800 animate-pulse rounded-3xl pb-8" />
              <div className="order-3 h-44 bg-slate-800 animate-pulse rounded-3xl" />
            </div>
            <RankingListSkeleton count={5} />
          </>
        ) : filteredRankingData.length > 0 ? (
          <>
            {/* 👑 TOP 3 Podium */}
            <div className="grid grid-cols-3 gap-2 md:gap-6 items-end mb-16 px-1 relative min-h-[320px]">
              {/* 2nd Place */}
              <div className="order-1 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 w-full">
                {top3[1] && <PodiumCard rank={2} item={top3[1]} />}
              </div>
              
              {/* 1st Place */}
              <div className="order-2 w-full animate-in fade-in slide-in-from-bottom-12 duration-700 pb-8 relative z-20">
                {top3[0] && <PodiumCard rank={1} item={top3[0]} />}
              </div>
              
              {/* 3rd Place */}
              <div className="order-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 w-full">
                {top3[2] && <PodiumCard rank={3} item={top3[2]} />}
              </div>
            </div>

            {/* 4th ~ List */}
            <div className="space-y-4 max-w-3xl mx-auto pb-10">
              {others.map((item, index) => (
                <RankingListItem
                  key={item.key || item.id}
                  item={item}
                  rank={index + 4}
                  delay={(index * 50) + 300}
                />
              ))}
              {!showAll && filteredRankingData.length > 53 && (
                <div className="pt-6 text-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="px-8 py-3 rounded-full bg-slate-800 border border-white/10 text-sm font-bold text-white hover:bg-slate-700 transition active:scale-95 shadow-lg"
                  >
                    もっと見る（残り{filteredRankingData.length - 53}件）
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-950/40 to-purple-950/40 p-12 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 pointer-events-none" />
            <p className="text-pink-400 font-black tracking-widest text-xs uppercase mb-4">口コミ募集中</p>
            <h2 className="text-white font-black text-2xl md:text-3xl mb-3">
              {selectedArea === '全国' ? 'ランキングを一緒に作ろう' : `${selectedArea}のランキングを作ろう`}
            </h2>
            <p className="text-slate-400 text-sm md:text-base mb-8 leading-relaxed max-w-md mx-auto">
              体験談を投稿すると<span className="text-pink-400 font-bold">口コミ閲覧権が得られます</span>。<br/>
              あなたの投稿がこのランキングを動かします。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/post-review"
                className="inline-block bg-pink-600 hover:bg-pink-500 text-white font-black px-10 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-900/40"
              >
                口コミを書く
              </Link>
              <Link
                to="/popular-reviews"
                className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold px-10 py-4 rounded-xl transition-all border border-white/10"
              >
                みんなの口コミを見る
              </Link>
            </div>
          </div>
        )}

      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
