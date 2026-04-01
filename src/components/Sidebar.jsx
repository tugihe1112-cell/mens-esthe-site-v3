// ========================================
// Sidebar.jsx（サイドバー広告バナー）
// ========================================

import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  // ダミー広告データ
  const ads = [
    {
      id: 1,
      title: "GOLDEN",
      subtitle: "Cuteで巨乳なセラピストが豊富！",
      subtitle2: "中野で外せない名店！！",
      image: "https://placehold.co/400x500/1e293b/94a3b8?text=No+Image",
      link: "/shops/1",
      color: "from-yellow-600 to-yellow-500",
    },
    {
      id: 2,
      title: "Aroma LEDIAN",
      subtitle: "アロマディアン",
      image: "https://placehold.co/400x500/1e293b/94a3b8?text=No+Image",
      link: "/shops/1",
      color: "from-green-600 to-teal-500",
    },
    {
      id: 3,
      title: "CLIMAX",
      subtitle: "横浜回春性感マッサージ",
      image: "https://placehold.co/400x500/1e293b/94a3b8?text=No+Image",
      link: "/shops/1",
      color: "from-red-600 to-pink-500",
    },
    {
      id: 4,
      title: "Amorous Re",
      subtitle: "アマラス・リ",
      image: "https://placehold.co/400x500/1e293b/94a3b8?text=No+Image",
      link: "/shops/1",
      color: "from-pink-600 to-purple-500",
    },
    {
      id: 5,
      title: "Aroma LoLuna",
      subtitle: "アロマ ロルナ",
      image: "https://placehold.co/400x500/1e293b/94a3b8?text=No+Image",
      link: "/shops/1",
      color: "from-purple-600 to-indigo-500",
    },
    {
      id: 6,
      title: "おとな女子",
      subtitle: "渋谷で大人の癒しを",
      image: "https://placehold.co/400x500/1e293b/94a3b8?text=No+Image",
      link: "/shops/1",
      color: "from-blue-600 to-cyan-500",
    },
  ];

  return (
    <aside className="space-y-4">
      {/* 広告バナー */}
      {ads.map((ad) => (
        <Link
          key={ad.id}
          to={ad.link}
          className="block bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-pink-500 transition-all duration-300 group shadow-lg"
        >
          {/* 画像 */}
          <div className="relative h-64 overflow-hidden">
            <img
              src={ad.image_url || ad.image}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* グラデーションオーバーレイ */}
            <div className={`absolute inset-0 bg-gradient-to-t ${ad.color} opacity-70 group-hover:opacity-60 transition-opacity`}></div>
            
            {/* テキスト */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                {ad.title}
              </h3>
              {ad.subtitle && (
                <p className="text-sm text-white drop-shadow-md mb-1">
                  {ad.subtitle}
                </p>
              )}
              {ad.subtitle2 && (
                <p className="text-sm text-white drop-shadow-md font-bold">
                  {ad.subtitle2}
                </p>
              )}
            </div>

            {/* ホバー時の矢印 */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-2xl drop-shadow-lg">→</span>
            </div>
          </div>
        </Link>
      ))}

      {/* 広告募集バナー */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
        <p className="text-sm text-gray-400 mb-3">
          📢 広告掲載募集中
        </p>
        <p className="text-xs text-gray-500 mb-4">
          あなたの店舗をここに掲載しませんか？
        </p>
        <button className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold transition">
          詳細を見る
        </button>
      </div>
    </aside>
  );
}