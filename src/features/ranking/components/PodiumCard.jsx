import React from 'react';
import { Link } from '../../../compat/router';
import LazyImage from '../../../components/LazyImage';

export const PodiumCard = ({ rank, item }) => {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  // 順位ごとのスタイル定義
  const styles = {
    1: {
      crown: '01',
      border: 'border-pink-500/60',
      shadow: 'shadow-[0_20px_50px_rgba(0,0,0,0.5)]',
      bg: 'bg-gradient-to-b from-pink-900/30 to-slate-900/80',
      text: 'text-pink-300',
      height: 'h-[320px] md:h-[380px]', // 1位は一番高く
      scale: 'scale-110 z-10'
    },
    2: {
      crown: '02',
      border: 'border-slate-500/60',
      shadow: 'shadow-[0_20px_40px_rgba(0,0,0,0.45)]',
      bg: 'bg-gradient-to-b from-slate-800/40 to-slate-900/80',
      text: 'text-slate-300',
      height: 'h-[280px] md:h-[320px]',
      scale: 'scale-100'
    },
    3: {
      crown: '03',
      border: 'border-slate-600/60',
      shadow: 'shadow-[0_20px_40px_rgba(0,0,0,0.45)]',
      bg: 'bg-gradient-to-b from-slate-800/40 to-slate-900/80',
      text: 'text-slate-300',
      height: 'h-[260px] md:h-[300px]',
      scale: 'scale-95'
    }
  }[rank];

  // リンク先の生成 (店舗 or セラピスト)
  const therapistId = item.therapistId || item.id;
  const linkPath = item.type === 'shop' && item.id
    ? `/shops/${item.id}`
    : (item.shopId && therapistId
        ? `/shops/${item.shopId}/threads/${therapistId}`
        : '/popular-reviews');
  const rating = item.averageRating ?? item.rating;
  const reviewCount = item.count ?? item.reviewCount ?? 0;

  return (
    <Link 
      to={linkPath}
      className={`relative flex flex-col items-center justify-end w-full rounded-t-sm border-t border-x ${styles.border} ${styles.bg} ${styles.shadow} ${styles.height} ${styles.scale} transition-all duration-500 hover:-translate-y-2 group overflow-hidden backdrop-blur-md`}
    >
      {/* 光のエフェクト */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
      
      {/* 順位バッジ */}
      {/* 順位は数字の書体で（王冠・メダルの絵文字はやめた・2026-09-30） */}
      <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-950 border border-slate-600 flex items-center justify-center shadow-xl z-20">
         <span className={`font-numeral text-2xl font-semibold ${styles.text}`}>{styles.crown}</span>
      </div>

      {/* 画像 */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-60 group-hover:opacity-80 transition duration-700">
        <LazyImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>

      {/* 情報エリア */}
      <div className="relative z-10 w-full p-4 text-center pb-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
        <div className="mb-1">
          <span className={`text-xs font-black tracking-widest uppercase ${styles.text}`}>
            NO.{rank}
          </span>
        </div>
        
        <h3 className="text-white font-black text-lg md:text-xl leading-tight mb-2 line-clamp-2 drop-shadow-md">
          {item.name}
        </h3>
        
        <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-400">
          <span className="bg-white/10 px-2 py-0.5 rounded border border-white/5 backdrop-blur">
            {Number.isFinite(Number(rating)) ? Number(rating).toFixed(1) : '-'}
          </span>
          <span>
            {reviewCount} reviews
          </span>
        </div>
        
        {item.shopName && (
           <p className="text-[10px] text-slate-500 mt-2 truncate">
             @{item.shopName}
           </p>
        )}
      </div>
    </Link>
  );
};
