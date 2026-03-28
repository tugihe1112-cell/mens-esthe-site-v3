// ========================================
// LoadingButton.jsx - ローディング機能付きボタン
// ========================================

import React from "react";
import LoadingSpinner from "./LoadingSpinner.jsx";

const LoadingButton = ({
  children,
  onClick,
  loading = false,
  disabled = false,
  type = "button",
  variant = "primary",
  className = "",
}) => {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const isDisabled = loading || disabled;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {loading && <LoadingSpinner size="sm" />}
      {loading ? "処理中..." : children}
    </button>
  );
};

export default LoadingButton;