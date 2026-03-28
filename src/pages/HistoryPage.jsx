import React from 'react';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { Link, useNavigate } from 'react-router-dom';
import LazyImage from '../components/LazyImage.jsx';
import Header from '../components/Header.jsx';

export default function HistoryPage() {
  const { history, clearHistory } = useRecentlyViewed();
  const navigate = useNavigate();

  // 履歴データを整形
  const formattedHistory = history.map(item => ({
    ...item,
    link: item.link || `/shops/${item.shopId}/threads/${item.therapistId || item.id}`
  }));

  return (
    <div className="min-h-screen bg-slate-950 pb-32 font-sans text-slate-200">
      <Header />
      
      <div className="pt-24 px-4 max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-24 z-30 bg-slate-950/90 backdrop-blur py-4 -mx-4 px-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
              <span className="text-3xl">🕒</span> HISTORY
            </h1>
            <p className="text-slate-400 text-xs font-bold mt-1 ml-1">最近チェックしたキャスト</p>
          </div>
          
          {history.length > 0 && (
            <button 
              onClick={() => { if(window.confirm('履歴を全て削除しますか？')) clearHistory(); }} 
              className="text-xs font-bold text-red-400 border border-red-500/30 px-4 py-2 rounded-full hover:bg-red-500/10 transition"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Content */}
        {formattedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
             <div className="text-6xl mb-6 opacity-50 grayscale">🕰️</div>
             <h3 className="text-xl font-bold text-white mb-2">閲覧履歴はありません</h3>
             <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
               最近見たキャストや店舗がここに表示されます。
               <br/>気になるキャストを探しに行きましょう！
             </p>
             <Link 
               to="/search" 
               className="px-8 py-3 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-500 shadow-lg shadow-pink-900/30 transition transform hover:-translate-y-1"
             >
               キャストを探す
             </Link>
          </div>
        ) : (
          <div className="relative space-y-8 pl-6 border-l-2 border-slate-800 ml-4 pb-20">
            {formattedHistory.map((item, i) => (
              <div key={i} className="relative group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                
                {/* Timeline Dot */}
                <div className="absolute top-8 -left-[31px] w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-pink-500 group-hover:bg-pink-500 transition-colors z-10 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                
                <Link 
                  to={item.link} 
                  className="block"
                >
                  <div className="flex items-start gap-5 bg-slate-900/50 p-4 rounded-2xl border border-white/5 hover:bg-slate-900 hover:border-pink-500/30 transition-all duration-300 shadow-lg group-hover:shadow-pink-900/10 group-hover:-translate-y-1">
                    <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative bg-slate-800">
                      <LazyImage src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                    </div>
                    
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-black text-white mb-1 group-hover:text-pink-400 transition">{item.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] font-bold bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5 group-hover:border-pink-500/20 group-hover:text-pink-300 transition">
                               {item.shopName || 'Unknown Shop'}
                             </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-pink-500 font-bold bg-pink-500/10 px-2 py-1 rounded-full">
                          {i === 0 ? 'LATEST' : 'VIEWED'}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed mt-1">
                         詳細プロフィールをチェックしました
                      </p>
                    </div>

                    <div className="self-center text-slate-700 group-hover:text-pink-500 transition transform group-hover:translate-x-1 text-xl">
                      →
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
