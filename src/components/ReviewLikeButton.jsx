import React, { useState, useEffect } from 'react';
import { authHeaders } from '../utils/supabaseRest';
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
    // ⚠️ 2026-08-12: user.access_token は **Supabase の user オブジェクトに存在しない**
    //    （access_token は session 側）。常に undefined → anonキーにフォールバックしており、
    //    実質すべて匿名リクエストだった。authHeaders() でセッションJWTを載せる。
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${url}/rest/v1/review_likes?review_id=eq.${reviewId}&user_id=eq.${user.id}&select=id`,
          { headers: await authHeaders() }
        );
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) setLiked(true);
      } catch { /* 取得失敗時は未いいね扱い */ }
    })();
    return () => { cancelled = true; };
  }, [user, reviewId]);

  const toggle = async () => {
    if (!user) {
      alert('いいねするにはログインが必要です');
      return;
    }
    if (isLoading) return;
    setIsLoading(true);

    // ⚠️ 同上（user.access_token は存在しないため実質anonだった）
    // ⚠️ 2026-08-12: 以前はレスポンスを確認せず先に画面を更新していたため、
    //    認証切れ・RLS拒否で保存できなくても「いいね成功」に見えていた。
    //    PostgREST は対象行0件でも 2xx を返しうるので、
    //    `Prefer: return=representation` にして**返却行が1件以上あること**まで検証する。
    const headers = await authHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    });

    try {
      if (liked) {
        // いいね解除
        const res = await fetch(
          `${url}/rest/v1/review_likes?review_id=eq.${reviewId}&user_id=eq.${user.id}`,
          { method: 'DELETE', headers }
        );
        if (!res.ok) throw new Error(`いいねの解除に失敗しました (HTTP ${res.status})`);
        const removed = await res.json().catch(() => []);
        if (!Array.isArray(removed) || removed.length === 0) {
          throw new Error('いいねの解除対象がありませんでした');
        }
        // 保存に成功したときだけ画面を更新する
        setLiked(false);
        setCount(c => Math.max(0, c - 1));
      } else {
        // いいね追加
        const res = await fetch(`${url}/rest/v1/review_likes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ review_id: String(reviewId), user_id: user.id }),
        });
        if (!res.ok) throw new Error(`いいねに失敗しました (HTTP ${res.status})`);
        const created = await res.json().catch(() => []);
        if (!Array.isArray(created) || created.length === 0) {
          throw new Error('いいねを保存できませんでした');
        }
        setLiked(true);
        setCount(c => c + 1);
      }
    } catch (e) {
      console.error(e);
      // 失敗時は画面を変えない（ロールバック不要な設計にした）
      if (typeof window !== 'undefined') {
        const msg = /401|403|row-level/i.test(String(e?.message))
          ? 'ログインの有効期限が切れている可能性があります。再度ログインしてください。'
          : (e?.message || 'いいねに失敗しました');
        alert(msg);
      }
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
