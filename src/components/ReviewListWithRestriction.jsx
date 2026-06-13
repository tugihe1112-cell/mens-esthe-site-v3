import React from 'react';
import { Link } from '../compat/router';
import { useAuth } from '../contexts/AuthContext';
import ModernReviewCard from './ModernReviewCard';

export default function ReviewListWithRestriction({ reviews }) {
  // 🌟 メアド判定は卒業！データベースから取得した本物の権限を使います
  const { userPlan } = useAuth();

  const total = reviews.length;
  if (total === 0) return <p className="text-slate-500 font-bold">まだクチコミがありません。</p>;

  // 🧮 表示件数の計算 (Free: 20%, Premium: 70%, VIP: 100%)
  let visibleCount = total;
  if (userPlan === 'free') {
    visibleCount = Math.max(1, Math.ceil(total * 0.2));
  } else if (userPlan === 'premium') {
    visibleCount = Math.max(1, Math.ceil(total * 0.7));
  }

  const visibleReviews = reviews.slice(0, visibleCount);
  const hiddenCount = total - visibleCount;

  return (
    <div className="space-y-4 relative">
      {visibleReviews.map(review => (
        <ModernReviewCard key={review.id} review={review} />
      ))}

      {hiddenCount > 0 && (
        <div className="relative mt-4 rounded-3xl overflow-hidden border border-white/5">
           <div className="opacity-20 blur-md pointer-events-none select-none">
             <ModernReviewCard review={reviews[visibleCount]} />
           </div>
           
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/40 p-6">
             <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(236,72,153,0.3)] border border-pink-500/20 mb-4 animate-pulse">
               🔒
             </div>
             <h4 className="text-xl font-black text-white mb-2">
               残り <span className="text-pink-500 text-3xl">{hiddenCount}</span> 件のクチコミは限定公開
             </h4>
             <p className="text-slate-400 text-sm mb-6 text-center max-w-sm font-bold leading-relaxed">
               現在のプラン（{userPlan.toUpperCase()}）ではここまで閲覧できます。<br/>
               すべてのクチコミを閲覧するには上位プランへのアップグレードが必要です。
             </p>
             <Link to="/premium" className="px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-full text-white font-black shadow-xl shadow-pink-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10">
               プランをアップグレード
             </Link>
           </div>
        </div>
      )}
    </div>
  );
}
