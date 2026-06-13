// ========================================
// TherapistCard.jsx（セラピストカード統一コンポーネント）
// ========================================

import React from "react";
import { Link } from '../../compat/router';
import RatingDisplay from "./RatingDisplay";
import Tag from "./Tag";

export default function TherapistCard({ shopId, thread }) {
  return (
    <Link
      to={`/shops/${shopId}/threads/${thread.id}`}
      className="bg-slate-800 rounded-lg border border-slate-700 p-5 hover:border-pink-500 transition-all duration-300 group"
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-2xl font-bold mb-2 group-hover:text-pink-400 transition">
            {thread.therapistName}
          </h3>
          <RatingDisplay 
            rating={thread.averageRating}
            reviewCount={thread.postCount}
            size="small"
          />
        </div>
        <span className="text-xs text-pink-400 font-bold group-hover:translate-x-1 transition-transform">
          詳細 →
        </span>
      </div>

      {/* 詳細評価 */}
      {thread.averageDetailedRatings && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs bg-slate-900/50 p-3 rounded">
          <div className="flex justify-between">
            <span className="text-gray-400">清潔感:</span>
            <span className="font-bold text-white">{thread.averageDetailedRatings.cleanliness.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ルックス:</span>
            <span className="font-bold text-white">{thread.averageDetailedRatings.appearance.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">スタイル:</span>
            <span className="font-bold text-white">{thread.averageDetailedRatings.style.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">接客:</span>
            <span className="font-bold text-white">{thread.averageDetailedRatings.service.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">技術:</span>
            <span className="font-bold text-white">{thread.averageDetailedRatings.skill.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">密着度:</span>
            <span className="font-bold text-white">{thread.averageDetailedRatings.intensity.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* タグ */}
      {thread.tags && thread.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {thread.tags.slice(0, 6).map((tag, idx) => (
            <Tag key={idx} variant="primary">
              {tag}
            </Tag>
          ))}
          {thread.tags.length > 6 && (
            <span className="text-xs text-gray-400 self-center">
              +{thread.tags.length - 6}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}