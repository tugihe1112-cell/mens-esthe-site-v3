import React from "react";

export default function ShopRating({ rating, showDetails = false, className = "" }) {
  if (!rating || !rating.total) {
    return <span className="text-gray-500 text-sm">評価なし</span>;
  }

  const renderStars = (score) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (score >= i) stars.push("★");
      else if (score >= i - 0.5) stars.push("⭐"); 
      else stars.push("☆");
    }
    return stars.join("");
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 text-lg tracking-widest filter drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
          {renderStars(rating.total)}
        </span>
        <span className="text-xl font-bold text-white leading-none">
          {rating.total.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400 mt-1">
          ({rating.reviewCount}件)
        </span>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 bg-slate-800/50 p-3 rounded-lg text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">ルックス</span>
            <span className="text-yellow-200 font-bold">{rating.looks.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">スタイル</span>
            <span className="text-pink-300 font-bold">{rating.style ? rating.style.toFixed(1) : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">密着度</span>
            <span className="text-pink-300 font-bold">{rating.intimacy.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">接客</span>
            <span className="text-yellow-200 font-bold">{rating.service.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">マッサージ</span>
            <span className="text-yellow-200 font-bold">{rating.massage.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
