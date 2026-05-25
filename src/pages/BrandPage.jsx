import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import Header from '../components/Header.jsx';
import LazyImage from '../components/LazyImage.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { getDisplayName } from '../utils/shopHelpers';

export default function BrandPage() {
  const { brandId } = useParams(); // URLパラメータはID (例: g_52b5309f)
  const navigate = useNavigate();
  const { shops, loading } = useShopData();

  // グループIDで店舗をフィルタリング
  const brandShops = useMemo(() => {
    if (!shops) return [];
    return shops.filter(s => s.group_id === brandId);
  }, [shops, brandId]);

  // ローディング中
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  
  // 店舗が見つからない場合
  if (brandShops.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4 font-sans">
        <Header />
        <h1 className="text-2xl font-bold">Brand Not Found</h1>
        <p className="text-slate-400">指定されたグループの店舗が見つかりませんでした。</p>
        <button onClick={() => navigate('/search')} className="text-pink-400 underline">検索に戻る</button>
      </div>
    );
  }

  // --- 表示用データの決定 ---
  // 代表店舗（配列の最初）
  const mainShop = brandShops[0];
  
  // ブランド名（代表店舗の名前から、"渋谷店" などの支店名をなるべく削りたいが、
  // 確実ではないため、一旦「〇〇 Group」のように表示する）
  const displayBrandName = mainShop.brandId || mainShop.name.split(' ')[0] + ' Group'; 
  
  // 代表画像
  const heroImage = mainShop.image;

  const seoDesc = `${displayBrandName}系列の店舗一覧ページです。全${brandShops.length}店舗掲載中。`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
      <SeoHead title={`${displayBrandName}`} description={seoDesc} path={`/brands/${brandId}`} />
      
      {/* Header (Absolute position for hero overlay) */}
      <Header />

      {/* 1. Cinematic Brand Hero */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden group">
        
        {/* Back Button (Mobile safe area) */}
        <button 
           onClick={() => navigate(-1)} 
           className="absolute top-24 left-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition active:scale-95 md:hidden"
         >
           ←
         </button>

        {/* Hero Image Background */}
        <div className="absolute inset-0 z-0">
          <LazyImage src={heroImage} alt={displayBrandName} className="w-full h-full object-cover transition duration-[2s] group-hover:scale-105 filter brightness-[0.4]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-4 text-center pt-10">
          <span className="text-pink-500 font-bold tracking-[0.3em] text-xs md:text-sm mb-4 border border-pink-500/30 px-4 py-1 rounded-full bg-pink-500/10 backdrop-blur uppercase animate-in fade-in slide-in-from-bottom-4 duration-700">
            Official Group
          </span>
          <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter shadow-black drop-shadow-2xl mb-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            {displayBrandName}
          </h1>
          <div className="flex items-center gap-3 text-slate-300 font-bold text-sm md:text-lg animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 bg-black/30 backdrop-blur px-4 py-2 rounded-full border border-white/10">
             <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
             Total {brandShops.length} Shops
          </div>
        </div>
      </div>

      {/* 2. Shops Grid */}
      <main className="max-w-7xl mx-auto px-4 py-12 -mt-10 md:-mt-20 relative z-30">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandShops.map((shop, idx) => (
            <Link
              key={shop.id}
              to={`/search?shop=${encodeURIComponent(shop.name)}`}
              className="group bg-slate-900 rounded-3xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-900/20 hover:-translate-y-2 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="aspect-video relative overflow-hidden">
                <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition"></div>
                
                <div className="absolute top-3 left-3">
                  <span className="bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                    <span>📍</span> {shop.prefecture} {shop.city}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 blur-2xl rounded-full pointer-events-none group-hover:bg-pink-500/20 transition"></div>
                
                <h2 className="text-lg md:text-xl font-black text-white mb-2 group-hover:text-pink-400 transition leading-tight z-10">
                  {getDisplayName(shop.name)}
                </h2>
                <div className="flex items-center gap-3 text-sm text-slate-400 mb-4 z-10">
                  <span className="text-yellow-400 font-bold flex items-center gap-1">★ {shop.rating || 'New'}</span>
                  <span className="opacity-30">|</span>
                  <span className="truncate">{shop.access}</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between z-10">
                  <span className="text-xs font-bold text-slate-500">OPEN: {shop.hours}</span>
                  <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-full group-hover:bg-pink-600 transition shadow-lg">
                    VIEW SHOP
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
