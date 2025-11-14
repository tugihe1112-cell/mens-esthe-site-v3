// src/components/ThreadHeader.jsx (丸ごと置き換え)

import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import StarRating from './ui/StarRating'; // ★ {} と .tsx を削除
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ratingLabels = {
  cleanliness: '清潔さ',
  appearance: '容姿',
  style: 'スタイル',
  service: '接客',
  skill: '技術',
  intensity: '際どさ',
};

export default function ThreadHeader() {
  const { shopId, threadId } = useParams();
  const { shops, favorites, toggleFavorite, isLoggedIn } = useAppContext();

  const threadData = useMemo(() => {
    const shop = shops.find((s) => s.id == shopId);
    if (!shop) return null;
    const thread = shop.threads.find((t) => t.id == threadId);
    if (!thread) return null;
    
    return {
      shopName: shop.name,
      ...thread 
    };
  }, [shops, shopId, threadId]);

  const handleToggleFavorite = () => {
    if (!isLoggedIn) {
      toast.error('お気に入り登録にはログインが必要です');
      return;
    }
    toggleFavorite(threadData.id);
  };

  if (!threadData) {
    return <div className="text-white">スレッドが見つかりません。</div>;
  }
  
  const isFavorited = favorites.includes(threadData.id);

  return (
    <section className="bg-slate-800 p-6 rounded-lg shadow-lg mb-6">
      <h1 className="text-3xl font-bold text-pink-400 mb-2">{threadData.therapistName}</h1>
      <p className="text-gray-400 mb-4">
        <Link to={`/shops/${shopId}`} className="hover:underline">{threadData.shopName}</Link>
        <span className="mx-2">/</span>
        口コミ件数: {threadData.postCount}件
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {threadData.tags.map((tag) => (
          <Link 
            key={tag} 
            to={`/?tag=${tag}`}
            className="bg-purple-700/60 px-3 py-1 text-sm rounded-full text-purple-200 hover:bg-purple-600"
          >
            {tag}
          </Link>
        ))}
      </div>

      <div className="bg-slate-900/50 p-4 rounded-md">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
          <span className="text-lg font-semibold text-gray-300">総合評価</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-yellow-400">
              {threadData.averageRating.toFixed(1)}
            </span>
            <StarRating rating={threadData.averageRating} interactive={false} />
          </div>
        </div>
        
        <hr className="border-slate-700 my-3" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
          {Object.entries(ratingLabels).map(([key, label]) => (
            <div key={key} className="flex flex-col">
              <span className="text-sm text-gray-400 truncate">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-white">
                  {threadData.averageDetailedRatings[key]?.toFixed(1) || '0.0'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={handleToggleFavorite}
        className={`w-full mt-4 p-3 rounded-lg text-lg font-bold transition-colors ${
          isFavorited
            ? 'bg-yellow-400 text-black hover:bg-yellow-500'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
      >
        {isFavorited ? '⭐ お気に入り済み' : '⭐ お気に入り登録'}
      </button>
    </section>
  );
}