// ========================================
// Tag.jsx（バリアント追加版）
// ========================================

import React from "react";

const variantStyles = {
  primary: "bg-pink-600/20 text-pink-300 border border-pink-700/50",
  secondary: "bg-purple-600/20 text-purple-300 border border-purple-700/50",
  premium: "bg-yellow-600/20 text-yellow-300 border border-yellow-700/50",
  success: "bg-green-600/20 text-green-300 border border-green-700/50",
  warning: "bg-yellow-600/20 text-yellow-300 border border-yellow-700/50",
  danger: "bg-red-600/20 text-red-300 border border-red-700/50",
};

export default function Tag({ children, variant = "primary" }) {
  const baseStyles = "px-3 py-1 rounded-full text-xs font-bold";
  const styles = variantStyles[variant] || variantStyles.primary;

  return <span className={`${baseStyles} ${styles}`}>{children}</span>;
}