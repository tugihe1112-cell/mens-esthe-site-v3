import React from 'react';

/* ベースパルスブロック */
const Pulse = ({ className = '' }) => (
  <div className={`bg-slate-800 animate-pulse rounded-xl ${className}`} />
);

/* セラピストカード (3カラムグリッド用) */
export const TherapistCardSkeleton = () => (
  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-2 flex flex-col items-center gap-2">
    <Pulse className="w-16 h-16 rounded-full" />
    <Pulse className="h-2.5 w-14 rounded-full" />
    <Pulse className="h-2 w-10 rounded-full opacity-50" />
  </div>
);

/* 横長店舗カード */
export const ShopCardSkeleton = () => (
  <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
    <Pulse className="aspect-video w-full rounded-none" />
    <div className="p-3 space-y-2">
      <Pulse className="h-3 w-3/4 rounded-full" />
      <Pulse className="h-2 w-1/2 rounded-full opacity-50" />
    </div>
  </div>
);

/* ランキング行 */
export const RankingRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 bg-slate-900/40 rounded-2xl border border-white/5">
    <Pulse className="w-8 h-8 rounded-full shrink-0" />
    <Pulse className="w-12 h-12 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Pulse className="h-3 w-24 rounded-full" />
      <Pulse className="h-2 w-16 rounded-full opacity-50" />
    </div>
    <Pulse className="h-4 w-10 rounded-full" />
  </div>
);

/* 口コミカード */
export const ReviewCardSkeleton = () => (
  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-3">
    <div className="flex items-center gap-3">
      <Pulse className="w-10 h-10 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <Pulse className="h-3 w-24 rounded-full" />
        <Pulse className="h-2 w-16 rounded-full opacity-50" />
      </div>
    </div>
    <Pulse className="h-2 w-full rounded-full" />
    <Pulse className="h-2 w-5/6 rounded-full" />
    <Pulse className="h-2 w-4/6 rounded-full opacity-60" />
  </div>
);

/* ヒーロースライダー */
export const HeroSkeleton = () => (
  <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-slate-900 animate-pulse rounded-3xl" />
);

/* グリッドセット: n個のスケルトンを並べる */
export const TherapistGridSkeleton = ({ count = 9 }) => (
  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <TherapistCardSkeleton key={i} />
    ))}
  </div>
);

export const ShopGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ShopCardSkeleton key={i} />
    ))}
  </div>
);

export const RankingListSkeleton = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <RankingRowSkeleton key={i} />
    ))}
  </div>
);
