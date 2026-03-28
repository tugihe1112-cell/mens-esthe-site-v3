import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';

export default function BrandResultCard({ summary, shops }) {
  const [isOpen, setIsOpen] = useState(false);

  // 代表画像がない場合のフォールバック
  const heroImage = summary.representativeImage || shops[0]?.image;

  return (
    <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-pink-500/30 shadow-2xl shadow-pink-900/20 mb-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative h-48 md:h-64">
        {/* 背景画像 */}
        <LazyImage 
          src={heroImage} 
          alt={summary.brandName} 
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
        
        {/* ブランド情報 */}
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-pink-600 text-white text-[10px] font-bold rounded-full mb-2 shadow-lg shadow-pink-600/40">
                BRAND GROUP
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight shadow-black drop-shadow-md">
                {summary.brandName}
              </h2>
              <p className="text-slate-300 text-sm mt-1 font-medium">
                <span className="text-pink-400 font-bold">{summary.shopCount}店舗</span> 展開中
                <span className="mx-2 opacity-50">|</span>
                総勢 <span className="text-pink-400 font-bold">{summary.therapistCount}名</span> のセラピスト
              </p>
            </div>
            
            {/* 展開ボタン (PC用) */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-bold transition backdrop-blur-md"
            >
              {isOpen ? '店舗リストを閉じる' : '店舗一覧を表示'}
              <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* スマホ用展開ボタン */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-full py-4 text-center text-sm font-bold text-slate-300 border-t border-white/5 bg-white/5 active:bg-white/10 transition"
      >
        {isOpen ? 'CLOSE LIST ▲' : 'VIEW ALL SHOPS ▼'}
      </button>

      {/* 展開される店舗リスト */}
      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 p-6' : 'grid-rows-[0fr] opacity-0 p-0'}`}>
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shops.map((shop) => (
              <Link 
                key={shop.id} 
                to={`/shops/${shop.id}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-pink-500/50 hover:bg-slate-800 transition group"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm truncate group-hover:text-pink-400 transition">{shop.name}</h3>
                  <p className="text-slate-500 text-xs truncate">📍 {shop.prefecture} {shop.city}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
