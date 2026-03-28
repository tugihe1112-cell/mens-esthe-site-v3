import React from 'react';

// 店舗カード用
export function ShopCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden animate-pulse border border-slate-700">
      <div className="bg-slate-700 h-48 w-full"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// 詳細ページ用
export function ShopDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 animate-pulse">
      <div className="h-64 md:h-80 bg-slate-800 w-full"></div>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="h-10 bg-slate-800 rounded w-3/4"></div>
        <div className="flex gap-4">
          <div className="flex-1 h-14 bg-slate-800 rounded-xl"></div>
          <div className="flex-1 h-14 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

// ✅ 追加: マイページ用スケルトン
export function MyPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 animate-pulse">
      <div className="bg-slate-800 h-64 w-full"></div>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="h-8 bg-slate-800 rounded w-48"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 6, type = 'shop' }) {
  const SkeletonComponent = ShopCardSkeleton;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => <SkeletonComponent key={i} />)}
    </div>
  );
}
