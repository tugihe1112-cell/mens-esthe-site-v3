// src/components/RankingSection.jsx

import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import ThreadCard from './ThreadCard.jsx';

// 全店舗の全スレッドをフラットにまとめる
const getAllThreads = (shops) => {
  const allThreads = [];
  for (const shop of shops) {
    for (const thread of shop.threads) {
      allThreads.push({
        ...thread,
        shop: {
          id: shop.id,
          name: shop.name,
          city: shop.city,
        }
      });
    }
  }
  return allThreads;
};

// ランキングのソート
const getRanking = (threads, filterTags) => {
  let candidates = threads;

  if (filterTags && filterTags.length > 0) {
    candidates = candidates.filter(t =>
      t.tags && filterTags.some(tag => t.tags.includes(tag))
    );
  }

  candidates.sort((a, b) => b.averageRating - a.averageRating);

  return candidates.slice(0, 3);
};

export default function RankingSection() {
  const { shops } = useAppContext();

  const allThreads = useMemo(() => getAllThreads(shops), [shops]);

  const topRated = useMemo(() => getRanking(allThreads), [allThreads]);

  const styleFocusTags = ['巨乳', 'スレンダー', 'グラマー'];
  const styleFocus = useMemo(() => getRanking(allThreads, styleFocusTags), [allThreads]);

  const cuteFocusTags = ['可愛い系', '美人系', '清楚系'];
  const cuteFocus = useMemo(() => getRanking(allThreads, cuteFocusTags), [allThreads]);

  return (
    <section className="my-6">
      <h2 className="text-2xl font-bold text-white mb-4">👑 動的ランキング</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Top Rated */}
        <div>
          <h3 className="text-lg font-semibold text-pink-400 mb-3">Top Rated</h3>
          <div className="space-y-3">
            {topRated.length > 0
              ? topRated.map(t => <ThreadCard key={t.id} shop={t.shop} thread={t} />)
              : <p className="text-gray-500">ランキング対象がありません</p>}
          </div>
        </div>

        {/* Style Focus */}
        <div>
          <h3 className="text-lg font-semibold text-pink-400 mb-3">Style Focus</h3>
          <div className="space-y-3">
            {styleFocus.length > 0
              ? styleFocus.map(t => <ThreadCard key={t.id} shop={t.shop} thread={t} />)
              : <p className="text-gray-500">ランキング対象がありません</p>}
          </div>
        </div>

        {/* Cute Focus */}
        <div>
          <h3 className="text-lg font-semibold text-pink-400 mb-3">Cute Focus</h3>
          <div className="space-y-3">
            {cuteFocus.length > 0
              ? cuteFocus.map(t => <ThreadCard key={t.id} shop={t.shop} thread={t} />)
              : <p className="text-gray-500">ランキング対象がありません</p>}
          </div>
        </div>

      </div>
    </section>
  );
}
