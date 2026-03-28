import React from 'react';
import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

export default function RecentlyViewed() {
  const { history, clearHistory } = useRecentlyViewed();

  if (history.length === 0) return null;

  return (
    <section className="py-6 border-t border-slate-800 bg-slate-900/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🕒 最近チェックした履歴
          </h2>
          <button 
            onClick={clearHistory}
            className="text-xs text-gray-500 hover:text-pink-400 transition"
          >
            履歴を消す
          </button>
        </div>

        {/* 横スクロールエリア */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {history.map((item) => (
            <Link 
              key={item.id} 
              to={item.link} 
              className="flex-shrink-0 w-32 snap-start group"
            >
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-slate-700 relative mb-2 bg-slate-800">
                {item.image ? (
                  <img 
                    src={item.image_url || item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-800 text-slate-600">
                    {item.type === 'shop' ? '🏢' : '💆‍♀️'}
                  </div>
                )}
                {/* タイプバッジ */}
                <div className={`absolute top-0 left-0 text-[10px] font-bold px-1.5 py-0.5 rounded-br ${item.type === 'shop' ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'}`}>
                  {item.type === 'shop' ? '店舗' : 'セラピスト'}
                </div>
              </div>
              <div className="text-xs font-bold text-gray-200 truncate group-hover:text-pink-400 transition">
                {item.name}
              </div>
              <div className="text-[10px] text-gray-500 truncate">
                {item.subText}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
