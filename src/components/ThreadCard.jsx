// src/components/ThreadCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from './ui/StarRating';

export default function ThreadCard({ shop, thread }) {
  const {
    id,
    therapistName,
    postCount,
    averageRating,
    averageDetailedRatings,
    tags = [],     // ← ★ allTags を完全削除して tags を使用
  } = thread;

  return (
    <Link
      to={`/shops/${shop.id}/threads/${id}`}
      className="bg-slate-800 p-5 rounded-lg shadow-lg transition-all hover:shadow-pink-500/20 hover:ring-2 hover:ring-pink-600"
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-pink-400 truncate">{therapistName}</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl font-bold text-yellow-400">
            {averageRating.toFixed(1)}
          </span>
          <StarRating rating={averageRating} interactive={false} />
        </div>
      </div>

      <div className="flex justify-between text-sm text-gray-400 mb-3 border-b border-slate-700 pb-3">
        <span>口コミ {postCount}件</span>
        <div className="flex gap-3">
          <span>容姿: <span className="text-white font-medium">{averageDetailedRatings.appearance.toFixed(1)}</span></span>
          <span>スタイル: <span className="text-white font-medium">{averageDetailedRatings.style.toFixed(1)}</span></span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 h-12 overflow-hidden">
        {tags.length > 0 ? (
          tags.slice(0, 5).map(tag => (
            <span
              key={tag}
              className="bg-purple-700/60 px-2 py-0.5 text-xs rounded-full text-purple-200"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">タグはまだありません</span>
        )}
      </div>
    </Link>
  );
}
