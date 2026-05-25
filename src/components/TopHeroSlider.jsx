import React, { useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade, A11y, Keyboard } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import LikeButton from './LikeButton.jsx';
import { getDisplayName } from '../utils/shopHelpers';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

// Galaxy だけローカル画像を維持（他は DB の image_url を使用）
const FORCE_IMAGES = {
  "galaxy": "/images/shops/galaxy.jpg",
};

export default function TopHeroSlider() {
  const { shops, loading } = useShopData();
  const [activeProgress, setActiveProgress] = useState(0);

  const heroShops = useMemo(() => {
    if (!shops || shops.length === 0) return [];

    // 1. FORCE_IMAGES のキーに一致する店舗を強制画像付きで追加
    const forcedShops = Object.keys(FORCE_IMAGES).map(key => {
      const found = shops.find(s => String(s.id).includes(key) || (s.name && s.name.toLowerCase().includes(key)));
      if (found) return { ...found, image: FORCE_IMAGES[key] };
      return null;
    }).filter(Boolean);

    // 2. 残りは image_url がある店舗からランダムに補充（5枚になるまで）
    const existingIds = forcedShops.map(s => s.id);
    const candidates = shops
      .filter(s => s.image_url && !existingIds.includes(s.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 5 - forcedShops.length);

    return [...forcedShops, ...candidates];
  }, [shops]);

  if (loading || heroShops.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden bg-slate-950 group/slider">
      {/* 進行バー */}
      <div className="absolute top-0 left-0 w-full h-1 z-[60] bg-white/10">
        <div className="h-full bg-pink-500 shadow-[0_0_15px_#ec4899] transition-all duration-100 linear" style={{ width: `${(1 - activeProgress) * 100}%` }} />
      </div>

      <Swiper 
        modules={[Autoplay, Pagination, Navigation, EffectFade, A11y, Keyboard]} 
        effect="fade" 
        fadeEffect={{ crossFade: true }} 
        speed={1500} 
        loop={true} 
        navigation={true} 
        autoplay={{ delay: 5000, disableOnInteraction: false }} 
        onAutoplayTimeLeft={(s, time, progress) => setActiveProgress(progress)} 
        className="h-[450px] md:h-[650px]"
      >
        {heroShops.map((shop, index) => (
          <SwiperSlide key={shop.id}>
            <div className="relative w-full h-full bg-slate-950">
              {/* 背景画像 (Ken Burns Effect) */}
              <div className="absolute inset-0 animate-ken-burns">
                <img src={shop.image || shop.image_url} alt={shop.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              
              {/* グラデーションオーバーレイ */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

              {/* コンテンツ */}
              <div className="absolute inset-0 p-8 md:p-24 flex flex-col justify-center md:justify-end items-start pl-16 md:pl-24">
                <div className="overflow-hidden mb-2">
                    <h2 className="text-pink-500 font-bold tracking-widest text-sm md:text-base uppercase animate-slide-up flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-pink-500 inline-block shadow-[0_0_10px_#ec4899]"></span>
                        PREMIUM SELECTION {index + 1} / {heroShops.length}
                    </h2>
                </div>
                
                <h3 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight max-w-3xl drop-shadow-2xl animate-fade-in-up">
                    {getDisplayName(shop.name)}
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <span className="bg-white/10 backdrop-blur px-3 py-1 rounded text-xs text-white border border-white/20">📍 {shop.prefecture} {shop.city}</span>
                    {shop.rating > 0 && <span className="bg-pink-600 px-3 py-1 rounded text-xs text-white font-bold shadow-lg shadow-pink-900/50">★ {shop.rating}</span>}
                </div>
                
                <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <Link to={`/search?shop=${encodeURIComponent(shop.name)}`} className="bg-white text-slate-900 font-black px-8 md:px-12 py-4 rounded-xl hover:bg-pink-500 hover:text-white transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 flex items-center gap-2">
                      <span>店舗を見る</span>
                  </Link>
                  <LikeButton id={shop.id} className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl p-3.5 text-white border border-white/20 hover:bg-white/20 transition active:scale-95" />
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <style>{`
        @keyframes ken-burns { from { transform: scale(1); } to { transform: scale(1.15); } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-ken-burns { animation: ken-burns 20s ease-out infinite alternate; }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .swiper-button-next, .swiper-button-prev { color: white !important; background: rgba(0,0,0,0.3); width: 50px !important; height: 50px !important; border-radius: 50%; }
        .swiper-button-next:hover, .swiper-button-prev:hover { background: #ec4899 !important; border-color: #ec4899; }
      `}</style>
    </div>
  );
}
