// ========================================
// LoadingSpinner.jsx - ローディングスピナー
// ========================================

import React from "react";

const LoadingSpinner = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <div
      className={`${sizeClasses[size]} border-white border-t-transparent rounded-full animate-spin`}
    />
  );
};

export default LoadingSpinner;