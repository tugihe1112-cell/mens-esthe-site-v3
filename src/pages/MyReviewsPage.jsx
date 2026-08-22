import React, { useEffect, useMemo, useState } from 'react';
import ModernReviewCard from '../components/ModernReviewCard.jsx';
import { Link } from '../compat/router';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export default function MyReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setReviews([]); setLoading(false); return; }
    let active = true;
    setLoading(true);
    setError('');
    supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          setError('投稿した口コミを読み込めませんでした。再読み込みしてください。');
          setReviews([]);
        } else {
          setReviews(data || []);
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [authLoading, user]);

  const stats = useMemo(() => {
    const totalChars = reviews.reduce((sum, review) => sum + String(review.content || '').length, 0);
    const average = reviews.length
      ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length
      : 0;
    return { totalChars, average: average.toFixed(1) };
  }, [reviews]);

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200">
      <SeoHead title="投稿した口コミ" noindex />
      <Header />
      <main className="pt-20 md:pt-24 max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-white">投稿した口コミ</h1>
          <p className="mt-1 text-sm text-slate-400">公開・非公開を含む、ご自身の投稿です。</p>
        </div>

        {authLoading || loading ? (
          <div className="space-y-4">{[1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-900" />)}</div>
        ) : !user ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-8 text-center">
            <p className="text-4xl mb-4">🔒</p>
            <h2 className="text-xl font-black text-white mb-2">ログインが必要です</h2>
            <Link to="/login?redirect=%2Fmy-reviews" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-pink-600 px-6 font-bold text-white">ログイン</Link>
          </section>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{error}</div>
        ) : reviews.length > 0 ? (
          <>
            <section className="grid grid-cols-3 gap-2 md:gap-3 mb-7">
              <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-3 text-center"><small className="text-slate-500">投稿数</small><b className="block text-xl text-white">{reviews.length}</b></div>
              <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-3 text-center"><small className="text-slate-500">平均評価</small><b className="block text-xl text-yellow-300">{stats.average}</b></div>
              <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-3 text-center"><small className="text-slate-500">総文字数</small><b className="block text-xl text-blue-300">{stats.totalChars.toLocaleString()}</b></div>
            </section>
            <div>{reviews.map((review) => <ModernReviewCard key={review.id} review={review} />)}</div>
          </>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/30 py-16 px-6 text-center">
            <p className="text-5xl mb-5">✍️</p>
            <h2 className="text-xl font-black text-white mb-2">まだ投稿がありません</h2>
            <p className="text-sm text-slate-400 mb-7">あなたの体験が、次にお店を選ぶ人の助けになります。</p>
            <Link to="/post-review" className="inline-flex min-h-12 items-center rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-7 font-black text-white">口コミを書く</Link>
          </section>
        )}
      </main>
    </div>
  );
}
