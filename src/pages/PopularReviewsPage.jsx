import React, { useState, useEffect, useCallback } from 'react';
import { authHeaders } from '../utils/supabaseRest';
import { Link } from '../compat/router';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';
import ReviewLikeButton from '../components/ReviewLikeButton.jsx';
import LazyImage from '../components/LazyImage.jsx';
import { ratingGradientClass } from '../utils/ratingStyle';

const PAGE_SIZE = 20;

// 相対日付（HomeReviewCardと同じ表記ルール：7日以内はNEWドット）
function relTime(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  const day = Math.floor((Date.now() - t) / 86400000);
  if (day <= 0) return { label: '今日', isNew: true };
  if (day < 7) return { label: `${day}日前`, isNew: true };
  if (day < 30) return { label: `${Math.floor(day / 7)}週間前`, isNew: false };
  if (day < 365) return { label: `${Math.floor(day / 30)}ヶ月前`, isNew: false };
  return { label: `${Math.floor(day / 365)}年前`, isNew: false };
}

// PostgREST の in.(...) 値を安全に組み立てる（日本語ID・カンマ入り店名対策）
function inList(values) {
  return `(${values.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',')})`;
}

const areaOf = (raw) => {
  const a = raw?.area;
  if (Array.isArray(a)) return a[0] || '';
  return a || '';
};

export default function PopularReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [shopMap, setShopMap] = useState({});
  const [therapistMap, setTherapistMap] = useState({}); // 正規化名 → therapist
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('new'); // 'new' | 'rating'

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  // ⚠️ 2026-08-12: anonキー固定をやめ、fetch直前に await authHeaders() で
  //    セッションJWT（未ログイン時はanon）を載せる。

  const normName = (s) => (s || '').replace(/[\s　]/g, '');

  /**
   * ⚠️ 2026-08修正: 以前は shops / therapists を limit無しで全件取得していた。
   * PostgREST の max-rows=1000 で先頭1000件しか返らず（在籍60,999人の大半が欠落）、
   * 写真が👤・店舗名/エリアが空になるうえ、数MB級のJSONをモバイルに配っていた。
   * → 表示中の口コミに含まれるIDだけを .in() で引く。
   */
  const hydrateMaps = useCallback(async (rows) => {
    if (!rows || rows.length === 0) return;

    const shopIds = [...new Set(rows.map(r => r.shop_id).filter(Boolean))];
    const therapistIds = [...new Set(rows.map(r => r.therapist_id).filter(Boolean))];
    const therapistNames = [...new Set(rows.map(r => r.therapist_name).filter(Boolean))];

    try {
      const reqs = [];
      reqs.push(shopIds.length
        ? fetch(`${url}/rest/v1/shops?select=id,name,raw_data&id=in.${encodeURIComponent(inList(shopIds))}`, { headers: await authHeaders() }).then(r => r.json())
        : Promise.resolve([]));
      // therapist は id 一致を優先、取りこぼしは名前一致でフォールバック（旧データのID揺れ対策）
      reqs.push(therapistIds.length
        ? fetch(`${url}/rest/v1/therapists?select=id,name,image_url,shop_id&id=in.${encodeURIComponent(inList(therapistIds))}`, { headers: await authHeaders() }).then(r => r.json())
        : Promise.resolve([]));
      reqs.push(therapistNames.length
        ? fetch(`${url}/rest/v1/therapists?select=id,name,image_url,shop_id&name=in.${encodeURIComponent(inList(therapistNames))}&limit=200`, { headers: await authHeaders() }).then(r => r.json())
        : Promise.resolve([]));

      const [shops, tById, tByName] = await Promise.all(reqs);

      if (Array.isArray(shops) && shops.length) {
        setShopMap(prev => {
          const next = { ...prev };
          shops.forEach(s => {
            next[s.id] = { name: s.name, prefecture: s.raw_data?.prefecture || '', area: areaOf(s.raw_data) };
          });
          return next;
        });
      }

      const found = [...(Array.isArray(tById) ? tById : []), ...(Array.isArray(tByName) ? tByName : [])];
      if (found.length) {
        setTherapistMap(prev => {
          const next = { ...prev };
          found.forEach(t => {
            const k = normName(t.name);
            // 写真ありを優先（同名が複数店に登録されているため）
            if (!next[k] || (!next[k].image_url && t.image_url)) next[k] = t;
          });
          return next;
        });
      }
    } catch { /* マップ取得失敗はカードのフォールバック表示で吸収 */ }
  }, [url, key]);

  const fetchReviews = useCallback(async (currentOffset, sort, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    const order = sort === 'rating' ? 'rating.desc,created_at.desc' : 'created_at.desc';
    try {
      // ⚠️ is_public=true 必須。以前は select=* かつ無フィルタで、非公開口コミの本文を
      // クライアントに配り120字プレビューとして表示していた（W2Rゲートの穴）。
      const res = await fetch(
        `${url}/rest/v1/reviews?select=id,shop_id,therapist_id,therapist_name,rating,tags,content,course,user_name,created_at,like_count` +
        `&is_public=eq.true&order=${order}&limit=${PAGE_SIZE}&offset=${currentOffset}`,
        { headers: await authHeaders() }
      );
      const data = await res.json();
      if (!Array.isArray(data)) return;

      if (isLoadMore) setReviews(prev => [...prev, ...data]);
      else setReviews(data);
      setHasMore(data.length === PAGE_SIZE);
      hydrateMaps(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [url, key, hydrateMaps]);

  useEffect(() => {
    setOffset(0);
    fetchReviews(0, sortBy, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <p className="text-slate-500 text-[11px] mt-1">掲載店舗から広告費・掲載料は受け取っていません。だから辛口もそのまま載ります。</p>
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
                  const therapist = therapistMap[normName(r.therapist_name)] || {};
                  const tags = Array.isArray(r.tags) ? r.tags : [];
                  const content = r.content || '';
                  const preview = content.length > 120 ? content.slice(0, 120) + '…' : content;
                  const rating = r.rating != null ? Number(r.rating) : null;
                  const time = relTime(r.created_at);
                  const loc = [shop.prefecture, shop.area].filter(Boolean).join('・');
                  // (c) 各口コミ自身のセラピストページへ。旧実装は /search?shop=&cast= で
                  //     「続きが読めない・内部リンクが本命に流れない」行き止まりだった。
                  const threadLink = (r.shop_id && r.therapist_id)
                    ? `/shops/${r.shop_id}/threads/${r.therapist_id}`
                    : `/search?cast=${encodeURIComponent(r.therapist_name || '')}`;
                  const shopLink = r.shop_id ? `/search?shopId=${encodeURIComponent(r.shop_id)}` : '/search';

                  return (
                    <div
                      key={r.id}
                      className="bg-slate-900 border border-white/10 hover:border-pink-500/40 rounded-2xl p-4 transition-all duration-200"
                    >
                      <div className="flex gap-3">
                        {/* セラピスト写真 */}
                        <Link to={threadLink} className="flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden bg-slate-800 border border-white/5 block">
                          {therapist.image_url ? (
                            <LazyImage src={therapist.image_url} alt={r.therapist_name} width={160} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          {/* 1行目: 🏢店舗名(主役) ＋ 📍エリアピル ＋ ★色バッジ（HomeReviewCardと同序列） */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <Link to={shopLink} className="inline-flex items-center gap-1.5 min-w-0 font-black text-white text-sm hover:text-pink-300 transition">
                                <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[10px] shrink-0">🏢</span>
                                <span className="truncate">{shop.name || '店舗情報なし'}</span>
                              </Link>
                              {loc && (
                                <span className="text-[10px] font-bold text-pink-200 bg-pink-500/10 border border-pink-500/20 rounded-full px-2 py-0.5 shrink-0">📍 {loc}</span>
                              )}
                            </div>
                            {rating != null && (
                              <span className={`inline-flex items-center text-[11px] font-black text-white bg-gradient-to-br ${ratingGradientClass(rating)} rounded-md px-1.5 py-0.5 shrink-0 shadow`}>
                                ★ {rating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* 2行目: セラピスト名 ＋ 相対日付 ＋ by ペンネーム ＋ 🧾course */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                            <Link to={threadLink} className="font-bold text-slate-200 text-xs truncate hover:text-pink-300 transition">
                              {r.therapist_name || '名前不明'}
                            </Link>
                            {time && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                {time.isNew && <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow shadow-pink-500/50" />}
                                {time.label}
                              </span>
                            )}
                            {r.user_name && <span className="text-[10px] text-slate-400">by <span className="font-bold text-slate-300">{r.user_name}</span></span>}
                            {r.course && (
                              <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">🧾 {r.course}</span>
                            )}
                          </div>

                          {/* タグ */}
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {tags.slice(0, 4).map(tag => (
                                <span key={tag} className="bg-slate-800 border border-white/10 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 口コミ本文プレビュー（公開口コミのみ） */}
                          <p
                            className="text-slate-300/90 text-xs leading-relaxed mt-2"
                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                            onCopy={e => e.preventDefault()}
                            onContextMenu={e => e.preventDefault()}
                          >{preview}</p>

                          <div className="flex items-center justify-between mt-2">
                            <Link to={threadLink} className="text-[11px] font-black text-pink-400 hover:text-pink-300 transition">
                              全文を読む → セラピストページ
                            </Link>
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
