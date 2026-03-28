import React, { useState, useMemo } from 'react';
import { useShopData } from '../contexts/DataContext.jsx';
import { useRankingData } from '../features/ranking/hooks/useRankingData';
import { PodiumCard } from '../features/ranking/components/PodiumCard';
import { RankingListItem } from '../features/ranking/components/RankingListItem';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';

// --- Tab Config ---
const PERIOD_TABS = [
  { id: 'monthly', label: 'MONTHLY', sub: '月間ランキング' },
  { id: 'weekly', label: 'WEEKLY', sub: '週間ランキング' },
  { id: 'newcomer', label: 'NEWCOMER', sub: '新人ランキング' }
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

  const top3 = filteredRankingData.slice(0, 3);
  const others = filteredRankingData.slice(3, 50); // TOP 50まで

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold tracking-widest text-xs animate-pulse">LOADING DATA...</p>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
        <p>データの読み込みに失敗しました。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 overflow-hidden relative font-sans">
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
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 shadow-2xl mb-12">
        <div className="max-w-4xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Period Tabs */}
          <div className="flex w-full md:w-auto overflow-x-auto hide-scrollbar">
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
        
        {filteredRankingData.length > 0 ? (
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
            </div>
          </>
        ) : (
          <div className="text-center py-32 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                <span className="text-4xl opacity-50 grayscale">📉</span>
              </div>
              <p className="text-slate-500 font-bold tracking-widest text-xs uppercase mb-2">No Data Available</p>
              <p className="text-slate-600 text-xs">
                 条件に一致するランキングデータはありません。<br/>
                 別のエリアを選択してみてください。
              </p>
          </div>
        )}

      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
