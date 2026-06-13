import React from "react";
import { Link } from '../compat/router';

export default function ThreadCard({ shopId, thread }) {
  return (
    <Link
      to={`/shops/${shopId}/threads/${thread.id}`}
      className="block bg-slate-800 rounded-lg p-4 border border-slate-700 hover:scale-[1.02] transition-transform"
    >
      <div className="flex gap-4">

        {/* ▼ セラピスト画像 */}
        <img
          src={thread.image_url || thread.image}
          className="w-24 h-24 rounded-lg object-cover"
          alt={thread.name}
        />

        {/* ▼ 情報 */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{thread.name}</h3>

          <p className="text-gray-300 text-sm mt-1">
            平均評価：
            <span className="text-yellow-400 font-bold">
              {thread.averageRating.toFixed(1)}
            </span>
          </p>

          <p className="text-gray-400 text-sm">
            口コミ数：{thread.postCount}
          </p>

          {/* タグ */}
          <div className="flex flex-wrap gap-1 mt-2">
            {thread.tags.slice(0, 6).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-slate-700 rounded-full border border-slate-600"
              >
                {tag}
              </span>
            ))}

            {thread.tags.length > 6 && (
              <span className="text-xs text-gray-400">
                +{thread.tags.length - 6} もっと見る
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
