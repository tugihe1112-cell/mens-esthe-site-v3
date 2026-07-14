import React, { useState, useEffect, useCallback } from 'react';
import { Link } from '../compat/router';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';

const PAGE_SIZE = 24;

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`;
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

// 同名キャストを名前で重複除去（複数店舗登録ブランド対策）
function dedupeByName(list) {
  const seen = new Set();
  return list.filter(t => {
    const key = (t.name || '').replace(/[\s　]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function NewTherapistsPage() {
  const [therapists, setTherapists] = useState([]);
  const [shopMap, setShopMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  // 店舗情報を一括取得してMapに
  useEffect(() => {
    fetch(`${url}/rest/v1/shops?select=id,name,raw_data`, { headers })
      .then(r => r.json())
      .then(data => {
        const m = {};
        (data || []).forEach(s => {
          m[s.id] = {
            name: s.name,
            prefecture: s.raw_data?.prefecture || '',
            city: s.raw_data?.city || '',
          };
        });
        setShopMap(m);
      })
      .catch(() => {});
  }, []);

  const fetchTherapists = useCallback(async (currentOffset, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const res = await fetch(
        `${url}/rest/v1/therapists?select=id,name,image_url,shop_id,created_at&image_url=not.is.null&order=created_at.desc&limit=${PAGE_SIZE}&offset=${currentOffset}`,
        { headers }
      );
      const data = await res.json();
      if (!Array.isArray(data)) return;

      if (isLoadMore) {
        setTherapists(prev => dedupeByName([...prev, ...data]));
      } else {
        setTherapists(dedupeByName(data));
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
    fetchTherapists(0, false);
  }, []);

  const loadMore = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchTherapists(next, true);
  };

  return (
    <>
      <SeoHead title="新人セラピスト一覧" description="全国のメンズエステに新しく登録されたセラピスト一覧。最新情報をチェック！" path="/new-therapists" />
      <Header />

      <div className="min-h-screen bg-slate-950 text-white pb-32">
        {/* ヘッダーバナー */}
        <div className="bg-gradient-to-br from-pink-900/60 via-slate-900 to-purple-900/40 border-b border-white/5 pt-20 pb-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">✨</span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">新人セラピスト一覧</h1>
              <span className="bg-pink-500 text-white text-xs font-black px-2 py-0.5 rounded-full animate-pulse">NEW</span>
            </div>
            <p className="text-slate-400 text-sm">全国のメンズエステに新しく登録されたセラピストをチェック</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-800/50 animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {therapists.map(t => {
                  const shop = shopMap[t.shop_id] || {};
                  return (
                    <Link
                      key={t.id}
                      to={`/search?shop=${encodeURIComponent(shop.name || '')}&cast=${encodeURIComponent(t.name)}`}
                      className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-900/20 bg-slate-900"
                    >
                      {/* 写真 */}
                      <div className="aspect-[3/4] relative overflow-hidden">
                        <img
                          src={t.image_url}
                          alt={t.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        {/* グラデーション */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        {/* NEWバッジ */}
                        <div className="absolute top-2 left-2 bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
                          NEW
                        </div>

                        {/* 登録日時 */}
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur text-slate-300 text-[9px] px-1.5 py-0.5 rounded-full">
                          {timeAgo(t.created_at)}
                        </div>

                        {/* 下部情報 */}
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <p className="text-white font-black text-sm leading-tight mb-0.5 truncate drop-shadow">
                            {t.name}
                          </p>
                          {shop.name && (
                            <p className="text-pink-300 text-[10px] truncate leading-tight">
                              📍 {shop.prefecture}{shop.city}
                            </p>
                          )}
                          {shop.name && (
                            <p className="text-slate-400 text-[9px] truncate leading-tight mt-0.5">
                              {shop.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* もっと見る */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-pink-500/50 text-white font-bold px-10 py-3 rounded-full transition-all disabled:opacity-50"
                  >
                    {isLoadingMore ? '読み込み中...' : 'もっと見る'}
                  </button>
                </div>
              )}

              {therapists.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <p className="text-4xl mb-4">🌸</p>
                  <p>セラピストが見つかりませんでした</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
