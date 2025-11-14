// src/components/ReviewCard.jsx (丸ごと置き換え)

import React from 'react';
import StarRating from './ui/StarRating'; // ★ {} と .tsx を削除
import { useAppContext } from '../context/AppContext.tsx';
import toast from 'react-hot-toast';

const ratingLabels = {
  cleanliness: '清潔さ',
  appearance: '容姿',
  style: 'スタイル',
  service: '接客',
  skill: '技術',
  intensity: '際どさ',
};

const getUserRank = (post) => {
  if (post.isPremium) return { name: 'VIP', color: 'bg-yellow-400' };
  if (post.likes > 20) return { name: '常連', color: 'bg-blue-400' };
  return { name: 'ビギナー', color: 'bg-gray-500' };
};

export default function ReviewCard({ review, isLiked, onLike, onTagClick, onDelete }) {
  const { isLoggedIn, currentUser } = useAppContext();
  const userRank = getUserRank(review);

  const OverallRating = ({ rating }) => (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-yellow-400">
        {rating.toFixed(1)}
      </span>
      <StarRating rating={rating} interactive={false} />
    </div>
  );

  const handleDelete = () => {
    if (!isLoggedIn || currentUser?.name !== review.user) {
      toast.error('自分の投稿のみ削除できます。');
      return;
    }
    onDelete(review.id);
  };
  
  const canDelete = isLoggedIn && currentUser?.name === review.user;

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row">
      
      <div className="w-full md:w-1/4 bg-slate-800 p-4 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-700">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0 mb-2"></div>
        <h4 className="text-lg font-bold text-white text-center">{review.user}</h4>
        
        <div className="flex flex-wrap justify-center gap-1 my-2">
          <span className={`px-2 py-0.5 text-xs font-bold text-black rounded ${userRank.color}`}>
            {userRank.name}
          </span>
          {review.isPremium && (
            <span className="px-2 py-0.5 text-xs font-bold text-yellow-900 bg-yellow-400 rounded">
              PREMIUM
            </span>
          )}
          {review.isVerified && (
            <span className="px-2 py-0.5 text-xs font-bold text-blue-900 bg-blue-400 rounded">
              認証済
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{review.time}</span>
      </div>

      <div className="w-full md:w-3/4 p-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 pb-3 border-b border-slate-700">
          <div>
            <span className="text-sm text-gray-400">総合評価</span>
            <OverallRating rating={review.rating} />
          </div>
          <div className="text-sm text-gray-300 mt-2 sm:mt-0 sm:text-right">
            <div>{review.course}</div>
            <div>㊙︎の有無: <span className="font-medium text-white">{review.hasSecret ? 'あり' : 'なし'}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mb-4">
          {Object.entries(ratingLabels).map(([key, label]) => (
            <div key={key}>
              <span className="text-xs text-gray-400">{label}</span>
              <div className="flex items-center gap-1">
                <StarRating rating={review.detailedRatings[key]} interactive={false} />
                <span className="text-sm font-medium text-white">{review.detailedRatings[key].toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-200 mb-4 leading-relaxed whitespace-pre-wrap">{review.content}</p>

        {review.userTags && review.userTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {review.userTags.map(t => (
              <span
                key={t}
                onClick={() => onTagClick(t)}
                className="bg-pink-700/40 px-2 py-1 text-xs rounded-full text-white/90 hover:bg-pink-600/60 cursor-pointer transition"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={onLike}
            className={`px-3 py-1 rounded transition-colors ${
              isLiked
                ? 'bg-pink-500 text-white font-bold'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ❤️ {review.likes}
          </button>
          <button className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition">
            💬 返信 ({review.replies})
          </button>
          
          {canDelete && (
             <button 
              onClick={handleDelete}
              className="ml-auto text-xs text-gray-500 hover:text-red-400 transition"
            >
              削除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}