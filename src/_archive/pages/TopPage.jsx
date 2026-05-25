import React from 'react';
import { useAppContext } from "../context/AppContext.tsx";
import { Link } from "react-router-dom";
import RecentlyViewed from "../components/RecentlyViewed"; // 追加

export default function TopPage() {
  const { shops } = useAppContext();

  return (
    <div className="bg-slate-900 min-h-screen text-white pb-24">
      {/* ヒーローセクション */}
      <div className="bg-gradient-to-r from-pink-900 to-slate-900 py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">メンズエステ口コミ掲示板</h1>
        <p className="text-gray-300 mb-8">リアルな体験談で、最高の癒やしを見つけよう</p>
        <div className="flex justify-center gap-4">
          <Link to="/search" className="bg-white text-pink-600 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition">
            店舗を探す 🔍
          </Link>
          <Link to="/post-review" className="bg-pink-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-pink-500 transition">
            口コミを書く ✍️
          </Link>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="max-w-6xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6 border-l-4 border-pink-500 pl-3">新着店舗</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.slice(0, 6).map((shop) => (
            <Link key={shop.id} to={`/shops/${shop.id}`} className="bg-slate-800 rounded-xl overflow-hidden hover:translate-y-1 transition shadow-lg block">
              <div className="h-48 relative">
                <img src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 bg-black/60 w-full p-2">
                  <div className="text-white font-bold">{shop.name}</div>
                  <div className="text-xs text-gray-300">{shop.prefecture} {shop.city}</div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>💰 {shop.price}</span>
                  <span>🕐 {shop.hours}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 閲覧履歴 (ここに追加) */}
      <RecentlyViewed />
    </div>
  );
}
