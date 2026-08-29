import React from 'react';
import { Link } from '../compat/router';
import SeoHead from '../components/SeoHead.jsx';
import Header from '../components/Header.jsx';

// エリア定義データ (VIP Night City Guide)
const AREAS = [
  {
    id: 'shinjuku',
    name: '新宿',
    en: 'SHINJUKU',
    desc: '眠らない街、最大の激戦区',
    tags: ['#No1激戦区', '#高級店多数'],
    color: 'from-purple-600 to-indigo-900',
    size: 'col-span-2 row-span-2' // 大きく表示
  },
  {
    id: 'shibuya',
    name: '渋谷',
    en: 'SHIBUYA',
    desc: 'トレンドと熱気が交差する',
    tags: ['#美女多数', '#アクセス抜群'],
    color: 'from-pink-600 to-rose-900',
    size: 'col-span-1 row-span-1'
  },
  {
    id: 'ikebukuro',
    name: '池袋',
    en: 'IKEBUKURO',
    desc: 'ディープな魅力とコスパ',
    tags: ['#コスパ最強', '#隠れ家'],
    color: 'from-blue-600 to-cyan-900',
    size: 'col-span-1 row-span-1'
  },
  {
    id: 'gotanda',
    name: '五反田',
    en: 'GOTANDA',
    desc: '大人のための遊戯場',
    tags: ['#玄人好み', '#実力派'],
    color: 'from-emerald-600 to-teal-900',
    size: 'col-span-1 row-span-2' // 縦長
  },
  {
    id: 'yoshiwara',
    name: '吉原',
    en: 'YOSHIWARA',
    desc: '伝統と格式の遊郭跡',
    tags: ['#ソープ街', '#老舗'],
    color: 'from-red-600 to-orange-900',
    size: 'col-span-1 row-span-1'
  },
  {
    id: 'yokohama',
    name: '横浜',
    en: 'YOKOHAMA',
    desc: '港町のロマンチックな夜',
    tags: ['#洗練', '#デートスポット'],
    color: 'from-sky-600 to-blue-900',
    size: 'col-span-1 row-span-1'
  },
  {
    id: 'kawasaki',
    name: '川崎',
    en: 'KAWASAKI',
    desc: '日本屈指の風俗街',
    tags: ['#濃厚', '#サービス重視'],
    color: 'from-amber-600 to-yellow-900',
    size: 'col-span-2 row-span-1' // 横長
  },
];

export default function AreaSearchPage() {
  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200">
      <SeoHead
        title="エリアから探す"
        description="東京・大阪・愛知など全国各エリアのメンズエステ店舗を検索。エリア別に厳選店舗とセラピスト情報を掲載。"
        path="/area-search"
      />
      <Header />
      <div className="pt-24 px-4 pb-8 max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
            エリアから<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">探す</span>
          </h1>
          <p className="text-slate-400 font-bold text-xs md:text-sm">
            都道府県・エリアを選んでください
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[240px]">
          {AREAS.map((area, idx) => (
            <Link 
              key={area.id}
              to={`/search?q=${area.name}`}
              className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:z-10 hover:scale-[1.02] ${area.size}`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* 外部写真に依存しない軽量背景。配信元の削除でカードが壊れる事故を防ぐ。 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${area.color}`}>
                <div
                  className="absolute inset-0 opacity-25 group-hover:opacity-40 transition duration-500"
                  style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.45) 0 1px, transparent 2px)', backgroundSize: '18px 18px' }}
                />
                <span aria-hidden="true" className="absolute -right-3 -top-8 text-[110px] md:text-[150px] font-black text-white/10 leading-none select-none group-hover:scale-105 transition duration-700">
                  {area.name.slice(0, 1)}
                </span>
              </div>
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-white/5"></div>

              {/* Content */}
              <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                  <div className="flex flex-wrap gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {area.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold bg-white/20 backdrop-blur px-2 py-0.5 rounded text-white border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-none tracking-tight mb-1">
                    {area.en}
                  </h2>
                  <p className="text-xs md:text-sm font-bold text-slate-300 group-hover:text-white transition">
                    {area.name} <span className="mx-1 opacity-50">|</span> <span className="opacity-70 font-normal">{area.desc}</span>
                  </p>
                </div>
                
                {/* Decoration Arrow */}
                <div className="absolute top-4 right-4 text-white/50 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition duration-300 text-xl">
                  ↗
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* All Areas Link */}
        <div className="mt-16 text-center">
           <Link to="/search" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-slate-900 border border-white/10 hover:bg-slate-800 hover:border-pink-500/50 transition group">
             <span className="text-sm font-bold text-slate-300 group-hover:text-white">すべてのエリアから探す</span>
             <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs group-hover:bg-pink-600 group-hover:text-white transition">→</span>
           </Link>
        </div>

      </div>
    </div>
  );
}
