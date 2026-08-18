import React from 'react';
import { Link } from '../compat/router';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

export default function RecentlyViewed() {
  const { history, clearHistory } = useRecentlyViewed();

  if (history.length === 0) return null;

  return (
    <section className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4 px-2">
          {/* 他セクション（💃注目セラピスト・✨新着店舗）と見出しの作法を揃える */}
          <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <span className="text-2xl">🕒</span> 最近チェックした
          </h3>
          <button
            onClick={clearHistory}
            className="text-xs font-bold text-slate-500 hover:text-pink-400 transition py-3 -my-3 pl-3"
          >
            履歴を消す
          </button>
        </div>

        {/* 横スクロールエリア */}
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
          {history.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="flex-shrink-0 w-32 snap-start group"
            >
              {/* 🐛 判定と描画がズレていた（2026-08-17 修正）:
                  条件は item.image を見ているのに src は item.image_url を優先していたため、
                  image_url しか持たない履歴は「写真があるのに絵文字プレースホルダ」になっていた。
                  実機スクショで3件とも 💆‍♀️ になっていた原因がこれ。判定側を src と揃える。 */}
              <div className="aspect-[3/4] w-32 rounded-xl overflow-hidden border border-white/10 relative mb-2 bg-slate-800">
                {(item.image_url || item.image) ? (
                  <img
                    src={item.image_url || item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-500"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  /* 写真が無い場合は絵文字でなく頭文字。絵文字は「壊れている」印象を与える */
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <span className="text-2xl font-black text-slate-600">{(item.name || '?').slice(0, 1)}</span>
                  </div>
                )}
                {/* 下端グラデーション＋名前をカード内に置く（注目セラピストと同じ作法に統一） */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-white font-black text-[11px] leading-tight truncate [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">{item.name}</p>
                  {item.subText && <p className="text-pink-300 text-[10px] truncate mt-0.5">{item.subText}</p>}
                </div>
                <div className={`absolute top-1.5 left-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full backdrop-blur-sm ${item.type === 'shop' ? 'bg-blue-600/90 text-white' : 'bg-pink-600/90 text-white'}`}>
                  {item.type === 'shop' ? '店舗' : 'セラピスト'}
                </div>
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
