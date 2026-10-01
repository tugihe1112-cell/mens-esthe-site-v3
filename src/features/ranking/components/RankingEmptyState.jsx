import React from 'react';
import { Link } from '../../../compat/router';
import { MIN_REVIEWS_FOR_RANKING } from '../utils/rankingHelpers.js';

export function RankingEmptyState({ error, targetReviewCount, onRetry, minReviews = MIN_REVIEWS_FOR_RANKING }) {
  if (error) return (
    <div role="alert" className="border border-slate-700 bg-slate-900 p-6 md:p-8">
      <h3 className="font-mincho text-slate-50 font-bold text-xl mb-2">ランキングを読み込めませんでした</h3>
      <p className="text-slate-400 text-sm mb-4">通信状況を確認して、もう一度お試しください。</p>
      <button type="button" onClick={onRetry} className="ui-btn-primary">再読み込み</button>
    </div>
  );
  return (
    <div role="status" className="border border-slate-700 bg-slate-900 p-6 md:p-8">
      <h3 className="font-mincho text-slate-50 font-bold text-xl mb-2">
        {targetReviewCount > 0 ? '掲載条件を満たす評価がまだありません' : '対象の公開口コミがまだありません'}
      </h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
        {targetReviewCount > 0
          ? `対象の公開口コミは${targetReviewCount}件です。人物ごとに、選択条件に合う有効な評価が${minReviews}件以上集まると掲載します。`
          : `人物ごとに有効な評価が${minReviews}件以上集まると、ランキングに掲載します。`}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link to="/post-review" className="ui-btn-primary">口コミを書く</Link>
        <Link to="/popular-reviews" className="inline-flex min-h-11 items-center justify-center rounded-sm border border-slate-600 px-4 text-sm font-bold text-slate-200 hover:border-slate-400">みんなの口コミを見る</Link>
      </div>
    </div>
  );
}
