import React, { useMemo, useState, useEffect } from 'react';
import { Link } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import LikeButton from './LikeButton.jsx';
import { getDisplayName } from '../utils/shopHelpers';
import { HERO_SHOP_IDS, toHeroItem } from '../data/heroShops';

// 本番スライドと同じ高さ。CLS防止のプレースホルダと共有する。
const HERO_SLIDE_HEIGHT = 'clamp(200px, 38vh, 440px)';

// Tier 4-1: 旧coverflow Swiperを撤去し、軽量フェード式ヒーローに刷新。
//  - Swiper依存を排除（バンドル減・初期化待ち無し）＝第1スライドがSSRで即描画→モバイルLCP改善
//  - スライドは絶対配置でopacityフェード（位置が動かない）＝CLSほぼ0
//  - アクティブスライドのみ pointer-events:auto ＝「店舗を見る」ボタンが重なり無しで確実に押せる
//  - 自動送り(4.5s)＋ホバー/フォーカスで一時停止＋ドットで手動切替

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
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // クライアントで全shopが読めたら固定5件（不足分はランダム補完）で組み直す。
  // 読み込み完了までは getServerSideProps から渡された initialHero を使い、CSRのデータ取得待ちを排除する。
  const heroItems = useMemo(() => {
    if (!shops || shops.length === 0) return initialHero || [];
    const shopMap = Object.fromEntries(shops.map((s) => [s.id, s]));
    const fixed = HERO_SHOP_IDS.map((id) => toHeroItem(shopMap[id])).filter(Boolean);
    if (fixed.length >= 5) return fixed.slice(0, 5);
    const usedIds = new Set(fixed.map((s) => s.id));
    const fallback = [...shops]
      .filter((s) => s.image_url && !usedIds.has(s.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 5 - fixed.length)
      .map((s) => ({ ...s, heroImage: s.image_url, heroImageType: 'cover' }));
    return [...fixed, ...fallback];
  }, [shops, initialHero]);

  const items = heroItems.length ? heroItems : (initialHero || []);

  // 自動送り（ホバー中は停止）
  useEffect(() => {
    if (paused || items.length <= 1) return undefined;
    const t = setInterval(() => setActive((a) => (a + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [paused, items.length]);

  // itemsが変わってactiveが範囲外になったら先頭へ
  useEffect(() => {
    if (items.length && active >= items.length) setActive(0);
  }, [items.length, active]);

  return (
    <div className="relative w-full bg-slate-950 pt-20 md:pt-10 pb-4 md:pb-10" style={{ overflow: 'hidden', isolation: 'isolate' }}>
      {/* 背景グロー */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(236,72,153,0.07) 0%, transparent 70%)' }} />

      {items.length === 0 ? (
        <HeroPlaceholder />
      ) : (
        <div className="px-4 md:px-8 pt-4">
          <div
            className="relative mx-auto w-[88%] sm:w-[62%] lg:w-[45%] rounded-2xl overflow-hidden border border-white/10"
            style={{ height: HERO_SLIDE_HEIGHT, boxShadow: '0 0 30px rgba(236,72,153,0.12), 0 20px 60px rgba(0,0,0,0.6)' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {items.map((shop, i) => (
              <div
                key={shop.id}
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? 'auto' : 'none' }}
                aria-hidden={i !== active}
              >
                {/* 店舗画像（第1スライドは preload 済み・eager／LCP要素） */}
                {shop.heroImageType === 'logo' ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <img src={shop.heroImage} alt={shop.name} className="w-3/4 max-h-1/2 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                ) : (
                  <img
                    src={shop.heroImage}
                    alt={shop.name}
                    fetchPriority={i === 0 ? 'high' : undefined}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}

                {/* 下グラデ */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                {/* コンテンツ */}
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end items-start">
                  <p className="text-pink-400 font-bold tracking-widest text-xs mb-2 flex items-center gap-2">
                    <span className="w-5 h-[2px] bg-pink-400 inline-block" />
                    口コミ人気 No.{i + 1}
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
              </div>
            ))}
          </div>

          {/* ドットインジケーター（手動切替） */}
          <div className="flex justify-center gap-1.5 mt-4">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`スライド ${i + 1} を表示`}
                className={`block h-1.5 rounded-full transition-all duration-500 ${i === active ? 'w-6 bg-pink-500' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
