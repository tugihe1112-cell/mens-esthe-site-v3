import React, { useState, useEffect } from 'react';
import { authHeaders } from '../utils/supabaseRest';
import { useAuth } from '../contexts/AuthContext.jsx';

const supabaseUrl = process.env.VITE_SUPABASE_URL;

export default function ReviewLikeButton({ reviewId, initialLikeCount = 0 }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

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
          `${supabaseUrl}/rest/v1/review_likes?review_id=eq.${reviewId}&user_id=eq.${user.id}&select=id`,
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
          `${supabaseUrl}/rest/v1/review_likes?review_id=eq.${reviewId}&user_id=eq.${user.id}`,
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
        const res = await fetch(`${supabaseUrl}/rest/v1/review_likes`, {
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
      aria-pressed={liked}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-sm border px-3 text-xs font-bold transition ${
        liked
          ? 'border-pink-500/60 text-pink-300'
          : 'border-slate-700 text-slate-400 hover:border-pink-500/50 hover:text-pink-300'
      } ${isLoading ? 'opacity-50' : ''}`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      <span>{count > 0 ? `参考になった ${count}` : '参考になった'}</span>
    </button>
  );
}
