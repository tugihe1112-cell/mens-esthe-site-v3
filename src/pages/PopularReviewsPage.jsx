import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';
import ReviewLikeButton from '../components/ReviewLikeButton.jsx';

const PAGE_SIZE = 20;

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`;
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

const ratingColor = (r) => {
  if (r >= 4.5) return 'text-emerald-400';
  if (r >= 3.5) return 'text-amber-400';
  return 'text-rose-400';
};

const TAGS_COLORS = {
  'スレンダー': 'from-pink-600/30 to-rose-600/30 border-pink-500/40 text-pink-200',
  'グラマー': 'from-purple-600/30 to-pink-600/30 border-purple-500/40 text-purple-200',
  '巨乳': 'from-rose-600/30 to-pink-600/30 border-rose-500/40 text-rose-200',
  '美脚': 'from-fuchsia-600/30 to-purple-600/30 border-fuchsia-500/40 text-fuchsia-200',
  '可愛い系': 'from-pink-600/30 to-purple-600/30 border-pink-500/40 text-pink-200',
  '美人系': 'from-purple-600/30 to-indigo-600/30 border-purple-500/40 text-purple-200',
  'default': 'from-slate-600/30 to-slate-700/30 border-slate-500/40 text-slate-300',
};

function getTagColor(tag) {
  return TAGS_COLORS[tag] || TAGS_COLORS['default'];
}

export default function PopularReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [shopMap, setShopMap] = useState({});
  const [therapistMap, setTherapistMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('new'); // 'new' | 'rating'

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  // 店舗・セラピスト情報を取得
  useEffect(() => {
    Promise.all([
      fetch(`${url}/rest/v1/shops?select=id,name,raw_data`, { headers }).then(r => r.json()),
      fetch(`${url}/rest/v1/therapists?select=id,name,image_url,shop_id`, { headers }).then(r => r.json()),
    ]).then(([shops, therapists]) => {
      const sm = {};
      (shops || []).forEach(s => {
        sm[s.id] = { name: s.name, prefecture: s.raw_data?.prefecture || '', city: s.raw_data?.city || '' };
      });
      setShopMap(sm);

      const tm = {};
      (therapists || []).forEach(t => { tm[t.name] = t; });
      setTherapistMap(tm);
    }).catch(() => {});
  }, []);

  const fetchReviews = useCallback(async (currentOffset, sort, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    const order = sort === 'rating' ? 'rating.desc,created_at.desc' : 'created_at.desc';
    try {
      const res = await fetch(
        `${url}/rest/v1/reviews?select=*&order=${order}&limit=${PAGE_SIZE}&offset=${currentOffset}`,
        { headers }
      );
      const data = await res.json();
      if (!Array.isArray(data)) return;

      if (isLoadMore) {
        setReviews(prev => [...prev, ...data]);
      } else {
        setReviews(data);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [url, key]);

  useEffect(() => {
    setOffset(0);
    fetchReviews(0, sortBy, false);
  }, [sortBy]);

  const loadMore = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchReviews(next, sortBy, true);
  };

  return (
    <>
      <SeoHead title="みんなの口コミ" description="全国のメンズエステ・セラピストへのリアルな口コミ体験談一覧。" path="/popular-reviews" />
      <Header />

      <div className="min-h-screen bg-slate-950 text-white pb-32">
        {/* ヘッダーバナー */}
        <div className="bg-gradient-to-br from-purple-900/60 via-slate-900 to-pink-900/40 border-b border-white/5 pt-20 pb-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💬</span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">みんなの口コミ</h1>
            </div>
            <p className="text-slate-400 text-sm">全国のセラピストへのリアルな体験レポート</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* ソートタブ */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'new', label: '🕐 新着順' },
              { key: 'rating', label: '⭐ 評価順' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSortBy(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  sortBy === tab.key
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-900/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-800/50 animate-pulse h-40" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reviews.map(r => {
                  const shop = shopMap[r.shop_id] || {};
                  const therapist = therapistMap[r.therapist_name] || {};
                  const tags = Array.isArray(r.tags) ? r.tags : [];
                  const content = r.content || '';
                  const preview = content.length > 120 ? content.slice(0, 120) + '…' : content;

                  return (
                    <div
                      key={r.id}
                      className="bg-slate-900/80 border border-white/5 hover:border-pink-500/30 rounded-2xl p-4 transition-all duration-200"
                    >
                      <div className="flex gap-3">
                        {/* セラピスト写真 */}
                        <div className="flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden bg-slate-800 border border-white/5">
                          {therapist.image_url ? (
                            <img src={therapist.image_url} alt={r.therapist_name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                          )}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          {/* 上段: 名前・評価 */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <Link
                                to={`/search?shop=${encodeURIComponent(shop.name || '')}&cast=${encodeURIComponent(r.therapist_name || '')}`}
                                className="text-white font-black text-base hover:text-pink-400 transition truncate block"
                              >
                                {r.therapist_name || '名前不明'}
                              </Link>
                              {shop.name && (
                                <p className="text-slate-500 text-[10px] truncate">
                                  📍 {shop.prefecture}{shop.city} | {shop.name}
                                </p>
                              )}
                            </div>
                            <div className={`flex-shrink-0 text-xl font-black ${ratingColor(r.rating)}`}>
                              {Number(r.rating).toFixed(1)}
                            </div>
                          </div>

                          {/* タグ */}
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {tags.slice(0, 4).map(tag => (
                                <span
                                  key={tag}
                                  className={`bg-gradient-to-r ${getTagColor(tag)} border px-2 py-0.5 rounded-full text-[10px] font-bold`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 口コミ本文プレビュー */}
                          <p
                            className="text-slate-400 text-xs leading-relaxed"
                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                            onCopy={e => e.preventDefault()}
                            onContextMenu={e => e.preventDefault()}
                          >{preview}</p>

                          {/* 下段: 投稿日 + いいね */}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-slate-600 text-[10px]">{timeAgo(r.created_at)}</p>
                            <ReviewLikeButton reviewId={r.id} initialLikeCount={r.like_count || 0} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* もっと見る */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-purple-500/50 text-white font-bold px-10 py-3 rounded-full transition-all disabled:opacity-50"
                  >
                    {isLoadingMore ? '読み込み中...' : 'もっと見る'}
                  </button>
                </div>
              )}

              {reviews.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <p className="text-4xl mb-4">💬</p>
                  <p>口コミがまだありません</p>
                  <Link to="/post-review" className="mt-4 inline-block bg-pink-500 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-pink-600 transition">
                    最初の口コミを書く
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
