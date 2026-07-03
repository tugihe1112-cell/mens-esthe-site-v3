import React, { useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectCoverflow, A11y, Keyboard } from 'swiper/modules';
import { Link } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import LikeButton from './LikeButton.jsx';
import { getDisplayName } from '../utils/shopHelpers';
import { HERO_SHOP_IDS, toHeroItem } from '../data/heroShops';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

// 本番スライドと同じ高さ。CLS防止のプレースホルダと共有する。
const HERO_SLIDE_HEIGHT = 'clamp(200px, 38vh, 440px)';

// データ取得待ちの間に出す、本番と同じ縦寸法の骨組み。
// 以前は loading 中に return null していたため、データ到着時にヒーローが
// ゼロ高さ→フル高さで出現し下のコンテンツを押し下げていた（CLS 0.572の主因）。
// 高さを先に確保することでレイアウトシフトを消す。
function HeroPlaceholder() {
  return (
    <div style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <div
        className="mx-auto w-[88%] sm:w-[62%] lg:w-[45%] rounded-2xl bg-slate-800/60 animate-pulse"
        style={{ height: HERO_SLIDE_HEIGHT }}
      />
      <div className="flex justify-center gap-1.5 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="block h-1.5 w-1.5 rounded-full bg-white/15" />
        ))}
      </div>
    </div>
  );
}

export default function TopHeroSlider({ initialHero = [] }) {
  const { shops } = useShopData();
  const [activeProgress, setActiveProgress] = useState(0);

  // クライアントで全shopが読めたら固定5件（不足分はランダム補完）で組み直す。
  // 読み込み完了までは getStaticProps から渡された initialHero を使い、
  // CSRのデータ取得待ち（LCP/CLSの元凶）を排除する。
  const heroItems = useMemo(() => {
    if (!shops || shops.length === 0) return initialHero || [];
    const shopMap = Object.fromEntries(shops.map(s => [s.id, s]));
    const fixed = HERO_SHOP_IDS.map(id => toHeroItem(shopMap[id])).filter(Boolean);
    if (fixed.length >= 5) return fixed.slice(0, 5);
    // 不足分をランダムで補完
    const usedIds = new Set(fixed.map(s => s.id));
    const fallback = [...shops]
      .filter(s => s.image_url && !usedIds.has(s.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 5 - fixed.length)
      .map(s => ({ ...s, heroImage: s.image_url, heroImageType: 'cover' }));
    return [...fixed, ...fallback];
  }, [shops, initialHero]);

  // shops未ロード時は initialHero（SSR埋め込み）を使う。
  // → サーバー描画とhydration初回が一致し、ヒーロー画像が初期HTMLに乗る。
  const items = heroItems.length ? heroItems : (initialHero || []);

  return (
    <div className="relative w-full bg-slate-950 pt-20 md:pt-10 pb-4 md:pb-10" style={{ overflow: 'hidden', isolation: 'isolate' }}>
      {/* 背景グロー */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(236,72,153,0.07) 0%, transparent 70%)' }} />

      {/* 進行バー */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 z-[60] bg-white/10">
        <div className="h-full bg-pink-500 shadow-[0_0_12px_#ec4899] transition-all duration-100 linear" style={{ width: `${(1 - activeProgress) * 100}%` }} />
      </div>

      {items.length === 0 ? (
        <HeroPlaceholder />
      ) : (
      <>
      <Swiper
        modules={[Autoplay, Navigation, EffectCoverflow, A11y, Keyboard]}
        effect="coverflow"
        coverflowEffect={{
          rotate: 10,
          stretch: -30,
          depth: 260,
          modifier: 1.2,
          slideShadows: false,
        }}
        centeredSlides={true}
        slidesPerView={1.3}
        breakpoints={{
          640:  { slidesPerView: 1.6 },
          1024: { slidesPerView: 2.2 },
        }}
        speed={650}
        loop={true}
        navigation={true}
        autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        onAutoplayTimeLeft={(s, time, progress) => setActiveProgress(progress)}
        className="w-full hero-coverflow"
        style={{ paddingTop: '20px', paddingBottom: '20px' }}
      >
        {items.map((shop, index) => (
          <SwiperSlide key={shop.id} style={{ height: 'clamp(200px, 38vh, 440px)' }}>
            {({ isActive }) => (
              <div
                className="w-full h-full rounded-2xl p-[2px]"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                  boxShadow: isActive
                    ? '0 0 30px rgba(255,255,255,0.15), 0 20px 60px rgba(0,0,0,0.6)'
                    : '0 8px 32px rgba(0,0,0,0.4)',
                  transition: 'background 0.6s ease, box-shadow 0.6s ease',
                }}
              >
              <div
                className="relative w-full h-full rounded-[14px] overflow-hidden"
              >
                {/* 店舗画像（先頭スライドは preload 済み・lazy にしない） */}
                {shop.heroImageType === 'logo' ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <img
                      src={shop.heroImage}
                      alt={shop.name}
                      className="w-3/4 max-h-1/2 object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <img
                    src={shop.heroImage}
                    alt={shop.name}
                    fetchPriority={index === 0 ? 'high' : undefined}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}

                {/* 非アクティブは暗く＋ぼかし */}
                <div
                  className="absolute inset-0 bg-slate-950 transition-opacity duration-500"
                  style={{ opacity: isActive ? 0 : 0.55 }}
                />

                {/* 下グラデ（アクティブ時だけ強く） */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                {/* アクティブ時コンテンツ */}
                {isActive && (
                  <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end items-start">
                    <p className="text-pink-400 font-bold tracking-widest text-xs mb-2 flex items-center gap-2">
                      <span className="w-5 h-[2px] bg-pink-400 inline-block" />
                      口コミ人気 No.{index + 1}
                    </p>
                    <h3 className="text-2xl md:text-4xl font-black text-white mb-3 leading-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">
                      {getDisplayName(shop.name)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <span className="bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-white border border-white/20">📍 {shop.prefecture} {shop.city}</span>
                      {shop.rating > 0 && <span className="bg-pink-600/90 px-3 py-1 rounded-full text-xs text-white font-bold">★ {shop.rating}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to={`/search?shop=${encodeURIComponent(shop.name)}`} className="bg-white text-slate-900 font-black px-6 py-2.5 rounded-xl hover:bg-pink-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 text-sm">
                        店舗を見る
                      </Link>
                      <LikeButton id={shop.id} className="w-11 h-11 bg-black/40 backdrop-blur-md rounded-xl p-2.5 text-white border border-white/20 hover:bg-white/20 transition active:scale-95" />
                    </div>
                  </div>
                )}

                {/* 非アクティブ時：店舗名だけ薄く */}
                {!isActive && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white/50 text-sm font-bold truncate">{getDisplayName(shop.name)}</p>
                  </div>
                )}
              </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ドットインジケーター */}
      <div className="flex justify-center gap-1.5 mt-4">
        {items.map((_, i) => (
          <span key={i} className={`block h-1.5 rounded-full transition-all duration-500 ${
            i === Math.round((1 - activeProgress) * (items.length - 1)) ? 'w-6 bg-pink-500' : 'w-1.5 bg-white/20'
          }`} />
        ))}
      </div>
      </>
      )}

      <style>{`
        /* ↓ ヒーローのCLS対策(visibility:hidden until init)は src/index.css に移設済み。
           インライン<style>はReact19がSSR HTMLに出力せず初回ペイントに効かないため。 */
        .hero-coverflow .swiper-slide {
          transition: transform 0.65s ease, filter 0.65s ease, opacity 0.65s ease;
          filter: blur(1.5px) brightness(0.75);
          opacity: 0.7;
          /* 両隣スライドが中央の「店舗を見る」ボタンに被さってクリックを横取りする問題の対策。
             非アクティブはクリックを透過させ、中央スライドのボタンだけが押せるようにする。 */
          pointer-events: none;
        }
        .hero-coverflow .swiper-slide-active {
          filter: blur(0px) brightness(1);
          opacity: 1;
          pointer-events: auto;
        }
        .swiper-button-next, .swiper-button-prev { color: white !important; background: rgba(15,23,42,0.7) !important; backdrop-filter: blur(10px); width: 40px !important; height: 40px !important; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); top: 46% !important; }
        .swiper-button-next:hover, .swiper-button-prev:hover { background: #ec4899 !important; border-color: #ec4899; }
        .swiper-button-next::after, .swiper-button-prev::after { font-size: 13px !important; font-weight: 900; }
      `}</style>
    </div>
  );
}
