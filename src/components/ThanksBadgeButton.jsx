import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { authHeaders } from '../utils/supabaseRest';

export default function ThanksBadgeButton({ reviewId, toUserId, initialCount = 0 }) {
  const { user } = useAuth();
  const [given, setGiven] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!user || !reviewId) return;
    // ⚠️ 2026-08-12: anonキー固定だと TO authenticated のRLSが発火せず、常に空が返っていた。
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${url}/rest/v1/user_badges?from_user_id=eq.${user.id}&review_id=eq.${reviewId}&select=id`,
          { headers: await authHeaders() }
        );
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) setGiven(true);
      } catch { /* 取得失敗時は未送信扱い */ }
    })();
    return () => { cancelled = true; };
  }, [user, reviewId]);

  const toggle = async () => {
    if (!user) { alert('感謝バッジを送るにはログインが必要です'); return; }
    if (user.id === toUserId) { alert('自分の口コミには送れません'); return; }
    if (isLoading) return;
    setIsLoading(true);

    // ⚠️ 2026-08-12: 以前は anonキー固定＋レスポンス未確認で、
    //    一般ユーザーには「成功したように見えて保存されない」状態だった。
    //    PostgREST は対象行0件でも 2xx を返しうるので、返却行まで検証する。
    const headers = await authHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    });

    try {
      if (given) {
        const res = await fetch(
          `${url}/rest/v1/user_badges?from_user_id=eq.${user.id}&review_id=eq.${reviewId}`,
          { method: 'DELETE', headers }
        );
        if (!res.ok) throw new Error(`取り消しに失敗しました (HTTP ${res.status})`);
        const removed = await res.json().catch(() => []);
        if (!Array.isArray(removed) || removed.length === 0) throw new Error('取り消し対象がありませんでした');
        setGiven(false);
        setCount(c => Math.max(0, c - 1));
      } else {
        const res = await fetch(`${url}/rest/v1/user_badges`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            from_user_id: user.id,
            to_user_id: toUserId || user.id,
            review_id: String(reviewId),
          }),
        });
        if (!res.ok) throw new Error(`感謝バッジの送信に失敗しました (HTTP ${res.status})`);
        const created = await res.json().catch(() => []);
        if (!Array.isArray(created) || created.length === 0) throw new Error('感謝バッジを保存できませんでした');
        setGiven(true);
        setCount(c => c + 1);
      }
    } catch (e) {
      console.error(e);
      if (typeof window !== 'undefined') {
        alert(/401|403|row-level/i.test(String(e?.message))
          ? 'ログインの有効期限が切れている可能性があります。再度ログインしてください。'
          : (e?.message || '感謝バッジの送信に失敗しました'));
      }
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
