import React from 'react';
import { Link } from '../compat/router';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent } from '../utils/analytics';
import ModernReviewCard from './ModernReviewCard';

/**
 * セラピストページ（SEO着地の本命）の口コミリスト。
 *
 * ⚠️ 2026-08: プラン基準の「表示件数制限」を撤去した。
 *   旧実装は userPlan だけで件数を出し分けていた（free=20% / premium=70%）。
 *   ・Stripe未実装なので全ユーザーが恒久的に free
 *   ・W2Rで得た閲覧権(credits)がこのゲートを解除しない（ModernReviewCardはcreditsを見るがこちらは見なかった）
 *   ＝700字書いて7日間もらった人でも2件目以降が永久に開かない「誰も通過できない行き止まり」だった。
 *
 * ゲートは **カード単位のW2R1本** に統一する（ModernReviewCard 内の
 * is_public / credits / owner_manual / premium 判定）。
 * 件数の出し分けが要るのは1ページ20件を超えてからで、今は存在しない問題。
 */
export default function ReviewListWithRestriction({ reviews }) {
  const { user } = useAuth();

  const total = reviews.length;
  if (total === 0) return <p className="text-slate-500 font-bold">まだクチコミがありません。</p>;

  return (
    <div className="space-y-4 relative">
      {reviews.map(review => (
        <ModernReviewCard key={review.id} review={review} />
      ))}

      {/* 読み終わり地点のW2R導線（ロックではなく次の行動の提示） */}
      <div className="rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-950/50 to-slate-900/80 p-6 text-center">
        <p className="text-purple-300 font-black text-[11px] tracking-widest mb-2">口コミ募集中</p>
        <h4 className="text-white font-black text-lg mb-2">あなたの体験談も、ここに載ります</h4>
        <p className="text-slate-400 text-xs mb-5 leading-relaxed">
          体験談を1件投稿すると<span className="text-purple-300 font-bold">最大7日間の閲覧権</span>が即時付与され、<br className="hidden sm:block" />
          みんなの口コミが読み放題になります。
        </p>
        <Link
          to="/post-review"
          onClick={() => trackEvent('click_paywall_cta', { target: 'post_review' })}
          className="inline-block px-8 py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-full text-white font-black shadow-xl shadow-pink-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 text-sm"
        >
          口コミを書く →
        </Link>
        {!user && (
          <Link
            to="/register"
            onClick={() => trackEvent('click_paywall_cta', { target: 'register' })}
            className="block mt-3 text-[11px] font-bold text-purple-300 hover:text-purple-200 hover:underline"
          >
            無料登録で3日間読み放題 →
          </Link>
        )}
      </div>
    </div>
  );
}
