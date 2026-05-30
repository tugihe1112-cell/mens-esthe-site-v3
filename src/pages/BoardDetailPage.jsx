import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import SeoHead from '../components/SeoHead.jsx';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`;
  return new Date(dateStr).toLocaleDateString('ja-JP');
}

export default function BoardDetailPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  useEffect(() => {
    if (!postId) return;
    // 投稿取得
    fetch(`${url}/rest/v1/posts?id=eq.${postId}&select=*`, { headers })
      .then(r => r.json())
      .then(data => { if (data?.[0]) setPost(data[0]); });
    // 返信取得
    fetchReplies();
  }, [postId]);

  const fetchReplies = () => {
    fetch(`${url}/rest/v1/replies?post_id=eq.${postId}&select=*&order=created_at.asc`, { headers })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setReplies(data); });
  };

  const submitReply = async () => {
    if (!user) { alert('返信するにはログインが必要です'); return; }
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch(`${url}/rest/v1/replies`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          post_id: postId,
          user_id: user.id,
          user_name: user.email?.split('@')[0] || '名無し',
          content: replyContent.trim(),
        }),
      });
      setReplyContent('');
      fetchReplies();
    } catch (e) {
      alert('返信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">読み込み中...</div>
    </div>
  );

  return (
    <>
      <SeoHead
        title={post.title}
        description={post.content ? post.content.slice(0, 120) + '…' : '掲示板の投稿'}
        path={`/board/${postId}`}
      />
      <Header />
      <div className="min-h-screen bg-slate-950 text-white pb-32 pt-20">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* 戻るリンク */}
          <Link to="/board" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition">
            ← 掲示板に戻る
          </Link>

          {/* 投稿本文 */}
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                {post.category || '雑談'}
              </span>
              {post.shop_name && (
                <span className="text-xs text-slate-500">📍 {post.shop_name}</span>
              )}
            </div>
            <h1 className="text-xl font-black text-white mb-3">{post.title}</h1>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
              <span className="text-xs text-slate-500">👤 {post.user_name}</span>
              <span className="text-xs text-slate-600">{timeAgo(post.created_at)}</span>
            </div>
          </div>

          {/* 返信一覧 */}
          <h2 className="text-sm font-black text-slate-400 mb-3">返信 {replies.length}件</h2>
          <div className="space-y-3 mb-6">
            {replies.map((r, i) => (
              <div key={r.id} className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-pink-400">#{i + 1}</span>
                  <span className="text-xs text-slate-500">👤 {r.user_name}</span>
                  <span className="text-xs text-slate-600 ml-auto">{timeAgo(r.created_at)}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
              </div>
            ))}
          </div>

          {/* 返信フォーム */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
            <h3 className="text-sm font-black text-white mb-3">返信を書く</h3>
            {user ? (
              <>
                <textarea
                  placeholder="返信内容を入力..."
                  rows={4}
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 resize-none mb-3"
                />
                <div className="flex justify-end">
                  <button
                    onClick={submitReply}
                    disabled={isSubmitting || !replyContent.trim()}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2 rounded-full text-sm transition disabled:opacity-50"
                  >
                    {isSubmitting ? '送信中...' : '返信する'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm mb-3">返信するにはログインが必要です</p>
                <Link to="/login" className="bg-pink-500 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-pink-600 transition">
                  ログイン
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
