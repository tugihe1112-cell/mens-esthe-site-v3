import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ThanksBadgeButton({ reviewId, toUserId, initialCount = 0 }) {
  const { user } = useAuth();
  const [given, setGiven] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!user || !reviewId) return;
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    fetch(
      `${url}/rest/v1/user_badges?from_user_id=eq.${user.id}&review_id=eq.${reviewId}&select=id`,
      { headers }
    )
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setGiven(true); })
      .catch(() => {});
  }, [user, reviewId]);

  const toggle = async () => {
    if (!user) { alert('感謝バッジを送るにはログインが必要です'); return; }
    if (user.id === toUserId) { alert('自分の口コミには送れません'); return; }
    if (isLoading) return;
    setIsLoading(true);

    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    };

    try {
      if (given) {
        await fetch(
          `${url}/rest/v1/user_badges?from_user_id=eq.${user.id}&review_id=eq.${reviewId}`,
          { method: 'DELETE', headers }
        );
        setGiven(false);
        setCount(c => Math.max(0, c - 1));
      } else {
        await fetch(`${url}/rest/v1/user_badges`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            from_user_id: user.id,
            to_user_id: toUserId || user.id,
            review_id: String(reviewId),
          }),
        });
        setGiven(true);
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
      title="参考になった口コミに感謝バッジを送ると、投稿者が閲覧日数を追加獲得できます"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
        given
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
          : 'bg-slate-800 border-white/10 text-slate-400 hover:border-amber-500/40 hover:text-amber-300'
      } ${isLoading ? 'opacity-50' : ''}`}
    >
      <span style={{ fontSize: '12px' }}>🏅</span>
      <span>{count > 0 ? count : '感謝'}</span>
    </button>
  );
}
