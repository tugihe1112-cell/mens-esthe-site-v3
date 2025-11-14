// src/components/ReviewForm.jsx (丸ごと置き換え)

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.tsx';
import StarRating from './ui/StarRating'; // ★ {} と .tsx を削除
import TagSelector from './TagSelector.jsx';
import toast from 'react-hot-toast';

const ratingLabels = {
  cleanliness: '部屋の清潔さ',
  appearance: 'セラピストの容姿',
  style: 'セラピストのスタイル',
  service: '接客・接遇',
  skill: 'マッサージのうまさ',
  intensity: 'マッサージの際どさ',
};

export default function ReviewForm() {
  const { shopId, threadId } = useParams(); 
  const { handlePostReview, isLoggedIn } = useAppContext();

  const [course, setCourse] = useState('');
  const [hasSecret, setHasSecret] = useState(false);
  const [userTags, setUserTags] = useState([]);
  const [content, setContent] = useState('');
  const [detailedRatings, setDetailedRatings] = useState({
    cleanliness: 0,
    appearance: 0,
    style: 0,
    service: 0,
    skill: 0,
    intensity: 0,
  });

  const isValidContent = content.length >= 300;
  const hasZeroRating = Object.values(detailedRatings).some(r => r === 0);
  const canSubmit = isValidContent && !hasZeroRating && course.trim() !== '';

  const handleRatingChange = (key, value) => {
    setDetailedRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('この操作にはログインが必要です'); 
      return;
    }
    
    if (!canSubmit) {
      if (!isValidContent) {
        toast.error('口コミ本文は300文字以上で入力してください。');
      } else if (hasZeroRating) {
        toast.error('すべての詳細評価を星1つ以上で評価してください。');
      } else {
         toast.error('コース/料金を入力してください。');
      }
      return;
    }

    handlePostReview(shopId, threadId, {
      course,
      hasSecret,
      content,
      userTags,
      detailedRatings,
    });

    toast.success('口コミを投稿しました！'); 

    setCourse('');
    setHasSecret(false);
    setUserTags([]);
    setContent('');
    setDetailedRatings({
      cleanliness: 0, appearance: 0, style: 0, 
      service: 0, skill: 0, intensity: 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg space-y-4">
      <h2 className="text-xl font-bold text-pink-400 mb-4">このセラピストに口コミを投稿する</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">コース/料金</label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="例: 90分12000円"
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">㊙︎の有無</label>
          <select
            value={String(hasSecret)}
            onChange={(e) => setHasSecret(e.target.value === 'true')}
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600"
          >
            <option value="false">なし</option>
            <option value="true">あり</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">セラピストの特徴タグ（複数選択可）</label>
        <TagSelector selectedTags={userTags} setSelectedTags={setUserTags} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">詳細評価（星1〜5）</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 bg-slate-900/50 rounded-md">
          {Object.entries(ratingLabels).map(([key, label]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm text-gray-300">{label}</span>
              <StarRating
                rating={detailedRatings[key]}
                onChange={(value) => handleRatingChange(key, value)}
                interactive={true} 
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">口コミ本文</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="具体的なエピソードを300文字以上で入力してください..."
          className="w-full p-3 rounded bg-slate-700 text-white border border-slate-600 min-h-36"
          required
        />
        <p className={`text-sm mt-1 text-right ${isValidContent ? 'text-green-400' : 'text-yellow-400'}`}>
          {content.length} / 300 文字
        </p>
      </div>
      
      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full p-3 rounded-lg text-lg font-bold transition-colors ${
          canSubmit
            ? 'bg-pink-600 text-white hover:bg-pink-700'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        投稿する
      </button>
    </form>
  );
}