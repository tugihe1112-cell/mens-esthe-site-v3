import React from 'react';
import { Link } from '../../../compat/router';
import LazyImage from '../../../components/LazyImage';

export const RankingListItem = ({ item, rank, delay }) => {
  const linkPath = item.type === 'shop'
    ? `/search?shop=${encodeURIComponent(item.name)}`
    : `/shops/${item.shopId}/threads/${item.id}`;

  return (
    <Link 
      to={linkPath}
      className="group relative flex items-center gap-4 bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-pink-500/30 rounded-2xl p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Rank Number */}
      <div className="w-10 flex-shrink-0 text-center">
        <span className="text-xl font-black text-slate-600 italic group-hover:text-pink-500 transition">
          #{rank}
        </span>
      </div>

      {/* Image */}
      <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-xl overflow-hidden relative border border-white/5">
        <LazyImage src={item.image} alt={item.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
           {item.shopName && (
             <span className="text-[10px] font-bold text-slate-500 truncate">
               {item.shopName}
             </span>
           )}
           {item.prefecture && (
             <span className="text-[10px] font-bold text-slate-600 border border-slate-700 px-1.5 rounded bg-slate-800">
               {item.prefecture}
             </span>
           )}
        </div>
        
        <h3 className="text-sm md:text-base font-bold text-white truncate group-hover:text-pink-400 transition mb-1">
          {item.name}
        </h3>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="font-bold text-slate-200">{item.rating || '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💬</span>
            <span>{item.reviewCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Arrow (PC) */}
      <div className="hidden md:flex pr-4 text-slate-700 group-hover:text-pink-500 transition">
        →
      </div>
    </Link>
  );
};
