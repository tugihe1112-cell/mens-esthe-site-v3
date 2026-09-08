import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectCoverflow, A11y, Keyboard } from 'swiper/modules';
import { Link } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import LikeButton from './LikeButton.jsx';
import { getDisplayName } from '../utils/shopHelpers';
import LocationLabel from './LocationLabel.jsx';
import { HERO_SHOP_IDS, toHeroItem } from '../data/heroShops';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

// 本番スライドと同じ高さ。CLS防止のプレースホルダと共有する。
// データ取得待ちの間に出す、本番と同じ縦寸法の骨組み。
// 以前は loading 中に return null していたため、データ到着時にヒーローが
// ゼロ高さ→フル高さで出現し下のコンテンツを押し下げていた（CLS 0.572の主因）。
// 高さを先に確保することでレイアウトシフトを消す。
function HeroPlaceholder() {
  return (
    <div style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <div
        className="mx-auto w-[88%] sm:w-[62%] lg:w-[45%] h-[clamp(190px,32vh,270px)] sm:h-[clamp(200px,38vh,440px)] rounded-2xl bg-slate-800/60 animate-pulse"
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

  // 現在のスライド（loop対応の realIndex）。
  // ⚠️ ドットの active はこれだけで決める。autoplay の残り時間（activeProgress）は
  //    進行バーの表示にだけ使う。混ぜると F06-A の不具合（送っていないのに
  //    ドットが動く）に戻る。
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const swiperRef = useRef(null);

  const goToSlide = useCallback((i) => {
    const s = swiperRef.current;
    if (!s) return;
    if (typeof s.slideToLoop === 'function') s.slideToLoop(i);
    else if (typeof s.slideTo === 'function') s.slideTo(i);
  }, []);

  const toggleAutoplay = useCallback(() => {
    const s = swiperRef.current;
    if (!s || !s.autoplay) return;
    if (isPlaying) { s.autoplay.stop(); setIsPlaying(false); }
    else { s.autoplay.start(); setIsPlaying(true); }
  }, [isPlaying]);

  // prefers-reduced-motion は自動送りを初期停止する（W3C 2.2.2）。
  // Swiper の init は子の effect で先に走るので、ここでは ref が埋まっている。
  useEffect(() => {
    if (!items.length) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (swiperRef.current && swiperRef.current.autoplay) swiperRef.current.autoplay.stop();
    setIsPlaying(false);
  }, [items.length]);

  // focus 中は自動送りを止める。スライダー内を移動しただけでは再開しない。
  const handleFocusCapture = useCallback(() => {
    if (swiperRef.current && swiperRef.current.autoplay) swiperRef.current.autoplay.stop();
  }, []);
  const handleBlurCapture = useCallback((e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (isPlaying && swiperRef.current && swiperRef.current.autoplay) swiperRef.current.autoplay.start();
  }, [isPlaying]);

  return (
    <div
      className="relative w-full bg-slate-950 pt-16 md:pt-10 pb-2 md:pb-10"
      style={{ overflow: 'hidden', isolation: 'isolate' }}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      {/* 背景グロー */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(236,72,153,0.07) 0%, transparent 70%)' }} />

      {/* 進行バー */}
      {isPlaying && (
      <div className="absolute bottom-0 left-0 w-full h-0.5 z-[60] bg-white/10">
        <div className="h-full bg-pink-500 shadow-[0_0_12px_#ec4899] transition-all duration-100 linear" style={{ width: `${(1 - activeProgress) * 100}%` }} />
      </div>
      )}

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
        onSwiper={(s) => { swiperRef.current = s; }}
        onSlideChange={(s) => setActiveIndex(typeof s.realIndex === 'number' ? s.realIndex : (s.activeIndex || 0))}
        className="w-full hero-coverflow"
        style={{ paddingTop: '20px', paddingBottom: '20px' }}
      >
        {items.map((shop, index) => (
          <SwiperSlide key={shop.id} className="!h-[clamp(190px,32vh,270px)] sm:!h-[clamp(200px,38vh,440px)]">
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
                  <div className="absolute inset-0 p-4 md:p-10 flex flex-col justify-end items-start">
                    <p className="text-pink-400 font-bold tracking-widest text-xs mb-2 flex items-center gap-2">
                      <span className="w-5 h-[2px] bg-pink-400 inline-block" />
                      掲載店舗ピックアップ
                    </p>
                    <h3 className="text-xl md:text-4xl font-black text-white mb-2 md:mb-3 leading-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">
                      {getDisplayName(shop.name)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-3 md:mb-5">
                      <LocationLabel className="bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-white border border-white/20" parts={[shop.prefecture, shop.city]} />
                      {/* ⚠️ 以前は収集元サイトの評価（raw_data.rating）を出していた。
                          ★>0 の39店は当サイトの口コミが全て0件で、実質「根拠のない★」だった。
                          星は口コミページ側で実データから出すので、ここでは出さない。 */}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to={`/shops/${shop.id}`} className="bg-white text-slate-900 font-black px-6 py-2.5 rounded-xl hover:bg-pink-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 text-sm">
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

      {/* ドットインジケーター＋自動送りの停止・再生
          ⚠️ 2026-09-08（FIXES.md F06-A）: 以前は active 判定に autoplay の残り時間
             （activeProgress）を使っており、スライドを送らなくても時間だけでドットが
             動いていた。時間の progress と slide index は別物なので混ぜない。
             現在地は onSlideChange の realIndex（loop対応）だけから決める。 */}
      <div className="flex justify-center items-center gap-1 mt-1">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToSlide(i)}
            aria-label={`${i + 1}枚目の店舗を表示`}
            aria-current={i === activeIndex ? 'true' : undefined}
            className="h-11 w-11 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          >
            <span className={`block h-1.5 rounded-full transition-all duration-500 ${
              i === activeIndex ? 'w-6 bg-pink-500' : 'w-1.5 bg-white/20'
            }`} />
          </button>
        ))}
        {/* 動きを止められるようにする（W3C 2.2.2 Pause, Stop, Hide）。
            prefers-reduced-motion では初期停止、focus 中は一時停止する。 */}
        <button
          type="button"
          onClick={toggleAutoplay}
          aria-label={isPlaying ? '店舗スライドの自動送りを一時停止' : '店舗スライドの自動送りを再生'}
          className="h-11 w-11 flex items-center justify-center rounded-full text-white/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
              <rect x="0" y="0" width="4" height="14" rx="1" />
              <rect x="8" y="0" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
              <path d="M0 0l12 7-12 7z" />
            </svg>
          )}
        </button>
      </div>
      </>
      )}

    </div>
  );
}
