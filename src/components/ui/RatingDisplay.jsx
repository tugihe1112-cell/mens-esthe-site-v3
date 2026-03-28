// ========================================
// RatingDisplay.jsx（評価表示統一コンポーネント）
// ========================================

import React from "react";

export default function RatingDisplay({ 
  rating = 0, 
  reviewCount = 0, 
  size = "medium",
  showStars = true,
  className = "" 
}) {
  // 安全な数値変換
  const safeRating = Number(rating) || 0;
  const safeReviewCount = Number(reviewCount) || 0;

  // 星を表示する関数
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {"★".repeat(fullStars)}
        {hasHalfStar && "☆"}
        {"☆".repeat(emptyStars)}
      </>
    );
  };

  const sizes = {
    small: {
      numberClass: "text-lg",
      starsClass: "text-sm",
      reviewClass: "text-xs",
    },
    medium: {
      numberClass: "text-2xl",
      starsClass: "text-base",
      reviewClass: "text-sm",
    },
    large: {
      numberClass: "text-3xl",
      starsClass: "text-xl",
      reviewClass: "text-base",
    },
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${currentSize.numberClass} text-yellow-400 font-bold`}>
        {safeRating.toFixed(1)}
      </span>
      {showStars && (
        <span className={`${currentSize.starsClass} text-yellow-400`}>
          {renderStars(safeRating)}
        </span>
      )}
      {safeReviewCount > 0 && (
        <span className={`${currentSize.reviewClass} text-gray-400`}>
          ({safeReviewCount}件)
        </span>
      )}
    </div>
  );
}