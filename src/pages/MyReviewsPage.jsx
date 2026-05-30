import React, { useMemo } from 'react';
import { useShopData } from '../contexts/DataContext.jsx';
import ModernReviewCard from '../components/ModernReviewCard.jsx';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';

export default function MyReviewsPage() {
  const navigate = useNavigate();
  const { reviews } = useShopData();

  // 1. 自分の投稿抽出 & ソート
  const myReviews = useMemo(() => {
    try {
      const localOnly = reviews.filter(r => r.isLocal === true);
      return [...localOnly].sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
    } catch (e) {
      console.error("MyReviews fetch error:", e);
      return [];
    }
  }, [reviews]);

  // 2. スタッツ計算 (インサイト)
  const stats = useMemo(() => {
    const count = myReviews.length;
    if (count === 0) return { avgRating: 0, totalChars: 0, rank: 'BEGINNER' };

    const totalRating = myReviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0);
    const totalChars = myReviews.reduce((acc, r) => acc + (r.content?.length || 0), 0);
    
    // ランク判定ロジック
    let rank = 'ROOKIE';
    if (count >= 3) rank = 'REGULAR';
    if (count >= 10) rank = 'EXPERT';
    if (count >= 30) rank = 'LEGEND';

    return {
      avgRating: (totalRating / count).toFixed(1),
      totalChars,
      rank
    };
  }, [myReviews]);

  return (
    <div className="min-h-screen bg-slate-950 pb-32 font-sans text-slate-200 relative overflow-hidden">
      <SeoHead title="投稿した口コミ" noindex />
      <Header />
      
      {/* 背景装飾 */}
      <div className="absolute top-[-10%] right-[-20%] w-[500px] h-[500px] bg-pink-900/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] left-[-20%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="pt-24 max-w-3xl mx-auto px-4 relative z-10">
        
        {/* Header Area */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <span className="text-4xl">✍️</span> MY REVIEWS
            </h1>
            <div className="flex items-center gap-2 mt-2">
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                 stats.rank === 'LEGEND' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                 stats.rank === 'EXPERT' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                 'bg-slate-800 text-slate-400 border-slate-700'
               }`}>
                 RANK: {stats.rank}
               </span>
               <span className="text-slate-500 text-xs font-bold">Joined 2024</span>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">TOTAL POSTS</div>
            <div className="text-2xl font-black text-white">{myReviews.length}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">AVG SCORE</div>
            <div className="text-2xl font-black text-yellow-400">{stats.avgRating}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">CHARACTERS</div>
            <div className="text-2xl font-black text-blue-400">{stats.totalChars.toLocaleString()}</div>
          </div>
        </div>

        {/* Timeline List */}
        {myReviews.length > 0 ? (
          <div className="relative space-y-8 pl-6 border-l-2 border-slate-800 ml-4 pb-20">
            {myReviews.map((review, idx) => (
              <div key={review.id} className="relative group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                
                {/* Timeline Dot */}
                <div className="absolute top-6 -left-[31px] w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-green-500 group-hover:bg-green-500 transition-colors z-10 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                
                {/* Review Card Wrapper */}
                <div className="transform transition duration-300 group-hover:-translate-y-1">
                  <ModernReviewCard review={review} />
                </div>
                
                {/* Edit/Delete Actions (Placeholder) */}
                <div className="flex justify-end mt-2 gap-3 opacity-0 group-hover:opacity-100 transition pr-2">
                    <button className="text-[10px] text-slate-500 hover:text-white transition font-bold uppercase">Edit</button>
                    <button className="text-[10px] text-red-500/50 hover:text-red-400 transition font-bold uppercase">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
             <div className="text-6xl mb-6 grayscale opacity-50">✍️</div>
             <h3 className="text-xl font-bold text-white mb-2">まだ投稿がありません</h3>
             <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
               あなたの体験が、誰かの役に立ちます。<br/>
               最初の一歩を踏み出してみませんか？
             </p>
             <Link 
               to="/search" 
               className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg shadow-pink-900/30 hover:scale-[1.02] transition"
             >
               投稿するお店を探す
             </Link>
          </div>
        )}

      </div>
    </div>
  );
}
