import React from "react";

// ▼ 詳細評価のバーグラフコンポーネント
const RatingBar = ({ label, value }) => {
  if (!value) return null;
  const percentage = Math.min(100, Math.max(0, (value / 5) * 100));
  
  return (
    <div className="space-y-1 mb-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-pink-300 font-bold">{Number(value).toFixed(1)}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ▼ 星表示コンポーネント（小）
const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span 
          key={star} 
          className={`text-lg leading-none ${star <= Math.round(rating) ? "text-yellow-400 drop-shadow-[0_0_2px_rgba(250,204,21,0.5)]" : "text-slate-600"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default function ReviewCard({ review }) {
  // 詳細評価があるかチェック
  const hasDetailedRatings = review.detailedRatings && Object.values(review.detailedRatings).some(v => v > 0);
  
  // 日付フォーマット
  const dateStr = new Date(review.timestamp).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-all duration-300 group">
      
      {/* 1. ヘッダー（全ての情報をここに集約） */}
      <div className="p-5 bg-gradient-to-b from-slate-800 to-slate-800/90">
        <div className="flex items-start justify-between mb-3">
            {/* 左側: ユーザー情報 + コース情報 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xl shadow-inner border border-slate-600 flex-shrink-0">
                👤
              </div>
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-100 text-base leading-tight">
                      {review.userName || '匿名ユーザー'}
                    </span>
                    {/* 🛑 名前も横にコース情報を移動 */}
                    {review.course && (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded font-bold whitespace-nowrap">
                          {review.course}
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium flex flex-wrap items-center gap-2">
                  <span>{dateStr}</span>
                  {review.therapistName && (
                     <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-gray-300 border border-slate-600/50">
                       担当: <span className="text-pink-300">{review.therapistName}</span>
                     </span>
                  )}
                </div>
              </div>
            </div>

            {/* 右側: 星評価 */}
            <div className="flex flex-col items-end flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-400 tracking-tight leading-none">
                  {Number(review.rating).toFixed(1)}
                </span>
                <StarRating rating={review.rating} />
              </div>
            </div>
        </div>

        {/* 🛑 タグもヘッダー内（情報のすぐ下）に移動 */}
        {review.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1 ml-[52px]"> {/* アイコン(40px)+gap(12px)=52px インデント */}
                {review.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded text-[10px] font-bold"
                  >
                    #{tag}
                  </span>
                ))}
            </div>
        )}
      </div>

      {/* 2. 詳細評価（バーグラフ） */}
      {hasDetailedRatings && (
        <div className="px-5 pb-3 pt-0">
          <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/30">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
               <RatingBar label="ルックス" value={review.detailedRatings.looks} />
               <RatingBar label="スタイル" value={review.detailedRatings.style} />
               <RatingBar label="愛嬌・接客" value={review.detailedRatings.service} />
               <RatingBar label="マッサージ" value={review.detailedRatings.massage} />
               <RatingBar label="密着度" value={review.detailedRatings.intimacy} />
            </div>
          </div>
        </div>
      )}

      {/* 3. 本文（理由・体験） */}
      <div className="px-5 pb-5 pt-1">
        <div className="relative bg-slate-900/30 pl-4 py-2 rounded-r-lg border-l-4 border-pink-500">
          <p className="text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {review.content}
          </p>
        </div>
      </div>

    </div>
  );
}
