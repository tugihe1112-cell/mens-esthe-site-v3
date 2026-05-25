import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const PAGE_SIZE = 20;

const CATEGORIES = [
  { key: 'all', label: 'すべて' },
  { key: 'general', label: '雑談' },
  { key: 'recommend', label: 'おすすめ店舗' },
  { key: 'therapist', label: 'セラピスト情報' },
  { key: 'newbie', label: '新人情報' },
  { key: 'question', label: '質問' },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`;
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export default function BoardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', shop_name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const fetchPosts = async (cat, currentOffset, append = false) => {
    setIsLoading(!append);
    const filter = cat !== 'all' ? `&category=eq.${cat}` : '';
    try {
      const res = await fetch(
        `${url}/rest/v1/posts?select=*&order=created_at.desc&limit=${PAGE_SIZE}&offset=${currentOffset}${filter}`,
        { headers }
      );
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setPosts(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchPosts(category, 0, false);
  }, [category]);

  const submit = async () => {
    if (!user) { alert('投稿するにはログインが必要です'); return; }
    if (!form.title.trim() || !form.content.trim()) { alert('タイトルと本文を入力してください'); return; }
    setIsSubmitting(true);
    try {
      await fetch(`${url}/rest/v1/posts`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          user_id: user.id,
          user_name: user.email?.split('@')[0] || '名無し',
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          shop_name: form.shop_name.trim() || null,
        }),
      });
      setForm({ title: '', content: '', category: 'general', shop_name: '' });
      setShowForm(false);
      fetchPosts(category, 0, false);
    } catch (e) {
      alert('投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead title="掲示板" description="メンズエステについて自由に質問・情報交換できる掲示板" path="/board" />
      <Header />

      <div className="min-h-screen bg-slate-950 text-white pb-32">
        {/* バナー */}
        <div className="bg-gradient-to-br from-blue-900/60 via-slate-900 to-indigo-900/40 border-b border-white/5 pt-20 pb-8 px-4">
          <div className="max-w-3xl mx-auto flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📋</span>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">掲示板</h1>
              </div>
              <p className="text-slate-400 text-sm">店舗・セラピスト情報を自由に質問・共有</p>
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="bg-pink-500 hover:bg-pink-600 text-white font-black px-5 py-2.5 rounded-full text-sm transition shadow-lg shadow-pink-900/40"
            >
              ✍️ 投稿する
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* 投稿フォーム */}
          {showForm && (
            <div className="bg-slate-900 border border-pink-500/30 rounded-2xl p-5 mb-6">
              <h3 className="font-black text-white mb-4">新規投稿</h3>
              <div className="space-y-3">
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50"
                >
                  {CATEGORIES.filter(c => c.key !== 'all').map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
                <input
                  placeholder="タイトル（例：渋谷でおすすめの店を教えてください）"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50"
                />
                <input
                  placeholder="関連店舗名（任意）"
                  value={form.shop_name}
                  onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50"
                />
                <textarea
                  placeholder="本文を入力..."
                  rows={5}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition">キャンセル</button>
                  <button
                    onClick={submit}
                    disabled={isSubmitting}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2 rounded-full text-sm transition disabled:opacity-50"
                  >
                    {isSubmitting ? '投稿中...' : '投稿する'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* カテゴリフィルター */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 hide-scrollbar">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  category === c.key
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* 投稿一覧 */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-800/50 animate-pulse h-24" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <p className="text-4xl mb-4">📋</p>
              <p>まだ投稿がありません</p>
              <button onClick={() => setShowForm(true)} className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-pink-600 transition">
                最初の投稿をする
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <Link
                  key={post.id}
                  to={`/board/${post.id}`}
                  className="block bg-slate-900/80 border border-white/5 hover:border-blue-500/30 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          post.category === 'question' ? 'bg-yellow-500/20 text-yellow-300' :
                          post.category === 'recommend' ? 'bg-green-500/20 text-green-300' :
                          post.category === 'newbie' ? 'bg-pink-500/20 text-pink-300' :
                          post.category === 'therapist' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {CATEGORIES.find(c => c.key === post.category)?.label || '雑談'}
                        </span>
                        {post.shop_name && (
                          <span className="text-[10px] text-slate-500">📍 {post.shop_name}</span>
                        )}
                      </div>
                      <h3 className="text-white font-bold text-sm truncate">{post.title}</h3>
                      <p className="text-slate-500 text-xs truncate mt-0.5">{post.content}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-slate-600 text-[10px]">{timeAgo(post.created_at)}</p>
                      {post.reply_count > 0 && (
                        <p className="text-blue-400 text-[10px] font-bold mt-1">💬 {post.reply_count}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasMore && !isLoading && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => { const next = offset + PAGE_SIZE; setOffset(next); fetchPosts(category, next, true); }}
                className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold px-10 py-3 rounded-full transition"
              >
                もっと見る
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
