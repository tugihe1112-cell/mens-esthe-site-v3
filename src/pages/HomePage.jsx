import React from 'react';
import SearchBar from '../components/SearchBar.jsx';
import TopHeroSlider from '../components/TopHeroSlider.jsx';
import RankingSection from '../components/RankingSection.jsx';
import RecentlyViewed from '../components/RecentlyViewed.jsx';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <TopHeroSlider />

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-50">
        <div className="bg-slate-900/60 backdrop-blur-2xl p-8 md:p-12 rounded-[3rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-black text-white mb-3">至福のひとときを検索</h2>
            <p className="text-slate-500 text-sm md:text-base font-medium">お気に入りの店舗やセラピストを今すぐ見つけよう</p>
          </div>
          <SearchBar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24 space-y-32">
        <RankingSection />
        <RecentlyViewed />
      </div>
    </div>
  );
}
