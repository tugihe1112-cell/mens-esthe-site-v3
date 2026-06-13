import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ReviewLikeButton({ reviewId, initialLikeCount = 0 }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  // 自分がいいねしているか確認
  useEffect(() => {
    if (!user || !reviewId) return;
    const headers = { apikey: key, Authorization: `Bearer ${user.access_token || key}` };
    fetch(
      `${url}/rest/v1/review_likes?review_id=eq.${reviewId}&user_id=eq.${user.id}&select=id`,
      { headers }
    )
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setLiked(true); })
      .catch(() => {});
  }, [user, reviewId]);

  const toggle = async () => {
    if (!user) {
      alert('いいねするにはログインが必要です');
      return;
    }
    if (isLoading) return;
    setIsLoading(true);

    const headers = {
      apikey: key,
      Authorization: `Bearer ${user.access_token || key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    };

    try {
      if (liked) {
        // いいね解除
        await fetch(
          `${url}/rest/v1/review_likes?review_id=eq.${reviewId}&user_id=eq.${user.id}`,
          { method: 'DELETE', headers }
        );
        setLiked(false);
        setCount(c => Math.max(0, c - 1));
      } else {
        // いいね追加
        await fetch(`${url}/rest/v1/review_likes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ review_id: String(reviewId), user_id: user.id }),
        });
        setLiked(true);
        setCount(c => c + 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
        liked
          ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
          : 'bg-slate-800 border-white/10 text-slate-400 hover:border-pink-500/40 hover:text-pink-300'
      } ${isLoading ? 'opacity-50' : ''}`}
    >
      <span className={liked ? '❤️' : '🤍'} style={{ fontSize: '12px' }} />
      <span>{count > 0 ? count : '参考になった'}</span>
    </button>
  );
}
