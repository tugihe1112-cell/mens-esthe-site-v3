import React from 'react';
import { Link } from 'react-router-dom';
import LazyImage from '../components/LazyImage.jsx';
import SeoHead from '../components/SeoHead.jsx';

// エリア定義データ (VIP Night City Guide)
const AREAS = [
  {
    id: 'shinjuku',
    name: '新宿',
    en: 'SHINJUKU',
    desc: '眠らない街、最大の激戦区',
    tags: ['#No1激戦区', '#高級店多数'],
    color: 'from-purple-600 to-indigo-900',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1994&auto=format&fit=crop',
    size: 'col-span-2 row-span-2' // 大きく表示
  },
  {
    id: 'shibuya',
    name: '渋谷',
    en: 'SHIBUYA',
    desc: 'トレンドと熱気が交差する',
    tags: ['#美女多数', '#アクセス抜群'],
    color: 'from-pink-600 to-rose-900',
    image: 'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?q=80&w=2006&auto=format&fit=crop',
    size: 'col-span-1 row-span-1'
  },
  {
    id: 'ikebukuro',
    name: '池袋',
    en: 'IKEBUKURO',
    desc: 'ディープな魅力とコスパ',
    tags: ['#コスパ最強', '#隠れ家'],
    color: 'from-blue-600 to-cyan-900',
    image: 'https://images.unsplash.com/photo-1626507306233-14e9f7831ca6?q=80&w=2070&auto=format&fit=crop',
    size: 'col-span-1 row-span-1'
  },
  {
    id: 'gotanda',
    name: '五反田',
    en: 'GOTANDA',
    desc: '大人のための遊戯場',
    tags: ['#玄人好み', '#実力派'],
    color: 'from-emerald-600 to-teal-900',
    image: 'https://images.unsplash.com/photo-1554797589-7241bb691973?q=80&w=1936&auto=format&fit=crop',
    size: 'col-span-1 row-span-2' // 縦長
  },
  {
    id: 'yoshiwara',
    name: '吉原',
    en: 'YOSHIWARA',
    desc: '伝統と格式の遊郭跡',
    tags: ['#ソープ街', '#老舗'],
    color: 'from-red-600 to-orange-900',
    image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=2036&auto=format&fit=crop',
    size: 'col-span-1 row-span-1'
  },
  {
    id: 'yokohama',
    name: '横浜',
    en: 'YOKOHAMA',
    desc: '港町のロマンチックな夜',
    tags: ['#洗練', '#デートスポット'],
    color: 'from-sky-600 to-blue-900',
    image: 'https://images.unsplash.com/photo-1505337298642-f8c7b8f95c47?q=80&w=2070&auto=format&fit=crop',
    size: 'col-span-1 row-span-1'
  },
  {
    id: 'kawasaki',
    name: '川崎',
    en: 'KAWASAKI',
    desc: '日本屈指の風俗街',
    tags: ['#濃厚', '#サービス重視'],
    color: 'from-amber-600 to-yellow-900',
    image: 'https://images.unsplash.com/photo-1601056556108-7275338600d2?q=80&w=2070&auto=format&fit=crop',
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
      {/* Header */}
      <div className="pt-24 px-4 pb-8 max-w-7xl mx-auto">
        <div className="text-center mb-10 animate-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">
            NIGHT <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">CITY</span> GUIDE
          </h1>
          <p className="text-slate-400 font-bold tracking-[0.3em] text-xs md:text-sm uppercase">
            Select Your Destination
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
              {/* Background Image */}
              <div className="absolute inset-0 w-full h-full">
                <LazyImage src={area.image_url || area.image} alt={area.name} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" />
              </div>
              
              {/* Overlay Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${area.color} mix-blend-multiply opacity-60 group-hover:opacity-40 transition duration-500`}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>

              {/* Content */}
              <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                  <div className="flex flex-wrap gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {area.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold bg-white/20 backdrop-blur px-2 py-0.5 rounded text-white border border-white/10">
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
