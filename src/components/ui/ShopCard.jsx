// ========================================
// ShopCard.jsx（店舗カード統一コンポーネント）
// ========================================

import React from "react";
import { Link } from "react-router-dom";
import RatingDisplay from "./RatingDisplay";
import { useShopData } from '../contexts/DataContext.jsx';

export default function ShopCard({ shop }) {
  const { getTherapistsByShopId } = useShopData();
  return (
    <Link
      to={`/shops/${shop.id}`}
      className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-pink-500 transition-all duration-300 group"
    >
      {/* 店舗画像 */}
      <div className="relative overflow-hidden">
        <img
          src={shop.image_url || shop.image}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          alt={shop.name}
        />
        {/* 評価バッジ */}
        <div className="absolute top-3 right-3 bg-yellow-400 text-slate-900 px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
          ★ {shop.rating.toFixed(1)}
        </div>
      </div>

      {/* 店舗情報 */}
      <div className="p-4">
        {/* 店舗名 */}
        <h3 className="text-xl font-bold mb-2 group-hover:text-pink-400 transition line-clamp-1">
          {shop.name}
        </h3>

        {/* 場所 */}
        <p className="text-sm text-gray-300 mb-3 flex items-center gap-1">
          <span>📍</span>
          <span>{shop.prefecture} {shop.city}</span>
        </p>

        {/* 評価 */}
        <div className="mb-3">
          <RatingDisplay 
            rating={shop.rating} 
            reviewCount={shop.reviewCount}
            size="small"
          />
        </div>

        {/* 価格・営業時間 */}
        <div className="space-y-1.5 text-sm mb-3 pb-3 border-b border-slate-700">
          <p className="text-pink-400 font-bold flex items-center gap-1">
            <span>💰</span>
            <span>{shop.price}</span>
          </p>
          {shop.hours && (
            <p className="text-gray-400 flex items-center gap-1">
              <span>🕐</span>
              <span>{shop.hours}</span>
            </p>
          )}
        </div>

        {/* セラピスト数 */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            👥 セラピスト {getTherapistsByShopId(shop.id).length || 0}名在籍
          </p>
          <span className="text-xs text-pink-400 font-bold group-hover:translate-x-1 transition-transform">
            詳細を見る →
          </span>
        </div>
      </div>
    </Link>
  );
}