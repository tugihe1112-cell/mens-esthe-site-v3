import React from 'react';
import { Link } from 'react-router-dom';
import LazyImage from '../../../components/LazyImage';

export const PodiumCard = ({ rank, item }) => {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  // 順位ごとのスタイル定義
  const styles = {
    1: {
      crown: '👑',
      border: 'border-yellow-500/50',
      shadow: 'shadow-[0_0_30px_rgba(234,179,8,0.3)]',
      bg: 'bg-gradient-to-b from-yellow-900/40 to-slate-900/80',
      text: 'text-yellow-400',
      height: 'h-[320px] md:h-[380px]', // 1位は一番高く
      scale: 'scale-110 z-10'
    },
    2: {
      crown: '🥈',
      border: 'border-slate-400/50',
      shadow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]',
      bg: 'bg-gradient-to-b from-slate-800/40 to-slate-900/80',
      text: 'text-slate-300',
      height: 'h-[280px] md:h-[320px]',
      scale: 'scale-100'
    },
    3: {
      crown: '🥉',
      border: 'border-orange-700/50',
      shadow: 'shadow-[0_0_20px_rgba(194,65,12,0.2)]',
      bg: 'bg-gradient-to-b from-orange-900/40 to-slate-900/80',
      text: 'text-orange-400',
      height: 'h-[260px] md:h-[300px]',
      scale: 'scale-95'
    }
  }[rank];

  // リンク先の生成 (店舗 or セラピスト)
  const linkPath = item.type === 'shop'
    ? `/search?shop=${encodeURIComponent(item.name)}`
    : `/shops/${item.shopId}/threads/${item.id}`;

  return (
    <Link 
      to={linkPath}
      className={`relative flex flex-col items-center justify-end w-full rounded-t-3xl border-t border-x ${styles.border} ${styles.bg} ${styles.shadow} ${styles.height} ${styles.scale} transition-all duration-500 hover:-translate-y-2 group overflow-hidden backdrop-blur-md`}
    >
      {/* 光のエフェクト */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
      
      {/* 順位バッジ */}
      <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-16 h-16 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center shadow-xl z-20">
         <span className="text-3xl filter drop-shadow-lg">{styles.crown}</span>
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
            ★ {item.rating || '-'}
          </span>
          <span>
            {item.reviewCount || 0} reviews
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
