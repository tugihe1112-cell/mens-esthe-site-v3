import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useShopData } from "../contexts/DataContext.jsx";
import { useSearch } from "../hooks/useSearch";
import { getDisplayName } from "../utils/shopHelpers";
import LazyImage from "../components/LazyImage.jsx";
import { ListSkeleton } from "../components/Skeleton.jsx"; 
import BrandResultCard from "../components/BrandResultCard"; 
import SeoHead from "../components/SeoHead.jsx";
import Header from "../components/Header.jsx";

const ITEMS_PER_PAGE = 18;

export default function ShopListPage() {
  const { shops, loading } = useShopData();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URLからクエリ取得
  const initialQuery = searchParams.get('q') || '';

  // 検索フック
  const { query, setQuery, result: rawResult, mode, summary, isSearching } = useSearch(shops, initialQuery);

  // ★ 重複排除ロジック（店舗名 + group_id + 表示名）
  const result = React.useMemo(() => {
    if (!rawResult) return [];

    // 検索ワードを配列化（重複排除の判定に使う）
    const terms = (query || '').toLowerCase().replace(/　/g, ' ').split(/\s+/).filter(Boolean);

    const seenNames = new Set();        // 元の店舗名（完全一致）
    const seenDisplayNames = new Set(); // 表示名（サフィックス除去後）
    const seenGroups = new Map();       // group_id → 既に表示した店舗の area がマッチしているか

    return rawResult.filter(shop => {
      // 1. 元の店舗名の完全重複を除外
      const normalizedName = (shop.name || '').replace(/[\s　]+/g, '').toLowerCase();
      if (seenNames.has(normalizedName)) return false;
      seenNames.add(normalizedName);

      // 2. 同一 group_id の複数ヒット → area がマッチする店舗を優先
      if (shop.group_id && terms.length > 0) {
        const areaStr = (shop.area || '').toLowerCase();
        const areaMatches = terms.some(t => areaStr.includes(t));

        if (seenGroups.has(shop.group_id)) {
          const prevAreaMatched = seenGroups.get(shop.group_id);
          if (prevAreaMatched) {
            return false;
          } else if (areaMatches) {
            seenGroups.set(shop.group_id, true);
            return true;
          } else {
            return false;
          }
        } else {
          seenGroups.set(shop.group_id, areaMatches);
        }
      }

      // 3. 表示名での重複排除（group_id が異なっても同じ見た目になる場合を防ぐ）
      // area が検索ワードにマッチする店舗は除外しない（「川口」で Lynx 川口店を正しく出す）
      if (terms.length > 0) {
        const displayName = getDisplayName(shop.name || '').replace(/[\s　]+/g, '').toLowerCase();
        const areaStr = (shop.area || '').toLowerCase();
        const areaMatches = terms.some(t => areaStr.includes(t));

        if (seenDisplayNames.has(displayName) && !areaMatches) {
          return false;
        }
        seenDisplayNames.add(displayName);
      }

      return true;
    });
  }, [rawResult, query]);

  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // ★重要: URLのクエリパラメータが変わったら、内部の検索ステートも更新する
  // これにより、ランキング等からの遷移で正しくリストが切り替わる
  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]); // queryを含めるとループする可能性があるので外す

  // 検索結果が変わったら表示件数をリセット
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [result]); 

  // 検索ボックスへの入力(State)をURLに反映させる
  // デバウンスはuseSearch内で行われているが、URL同期は入力確定ごとに行う
  useEffect(() => {
    const params = {};
    if (query) {
      params.q = query;
      setSearchParams(params, { replace: true });
    } else {
      // クエリが空ならパラメータ削除
      setSearchParams({}, { replace: true });
    }
  }, [query, setSearchParams]);

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchParams({});
  };

  const visibleShops = result ? result.slice(0, displayCount) : [];
  const hasMore = result && displayCount < result.length;

  // 動的タイトルの決定
  let pageTitle = "店舗一覧";
  if (query) {
    pageTitle = `"${query}" の検索結果`;
  }
  if (mode === 'brand' && summary) {
    pageTitle = `${summary.brandName} 店舗一覧`;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 font-sans">
      <SeoHead title={pageTitle} description={`メンズエステ店舗検索。現在の表示件数: ${result?.length || 0}件`} />
      <Header />

      <div className="pt-24 max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
              <span className="text-3xl">🏢</span> {query ? 'SEARCH RESULTS' : 'ALL SHOPS'}
            </h1>
            <div className="text-gray-400 text-sm font-bold">
              {loading ? '...' : `${result.length} 件`}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto md:mx-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="店舗名、エリア(歌舞伎町など)で検索..."
              className="w-full bg-slate-900 border border-slate-700 rounded-full py-3 px-5 pl-12 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-inner"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            
            {/* Clear Button or Status */}
            {query && (
              <button 
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
              >
                ✕
              </button>
            )}
            
            {isSearching && !query && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-pink-500 animate-pulse font-bold">Searching...</span>
            )}
          </div>
        </div>

        {loading ? (
          <ListSkeleton count={6} type="shop" />
        ) : (
          <>
            {/* ブランド検索結果の場合のサマリーカード */}
            {mode === 'brand' && summary && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                <BrandResultCard summary={summary} shops={result} />
              </div>
            )}

            {/* 通常の店舗リスト */}
            {result.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {visibleShops.map((shop) => (
                  <Link
                    key={shop.id}
                    to={`/search?shop=${encodeURIComponent(shop.name)}`}
                    className="group bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/50 hover:shadow-2xl hover:shadow-pink-900/10 transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98]"
                  >
                    <div className="h-48 relative overflow-hidden">
                      <LazyImage
                        src={shop.image_url || shop.image}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                      
                      {/* エリアバッジ */}
                      <div className="absolute top-3 left-3">
                          <span className="bg-black/60 backdrop-blur border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <span>📍</span> {shop.prefecture} {shop.city} {shop.area && `(${shop.area})`}
                          </span>
                      </div>

                      <div className="absolute bottom-0 left-0 p-4 w-full">
                        <h3 className="text-lg font-black text-white shadow-black drop-shadow-md truncate leading-tight">
                          {getDisplayName(shop.name)}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 text-xs truncate max-w-[70%]">
                           {shop.access || shop.address || "アクセス情報なし"}
                        </span>
                        <span className="text-yellow-400 font-black flex items-center gap-1 text-xs">
                          ★ {shop.rating || "New"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(shop.tags || []).slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-white/5">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* 検索結果ゼロの場合 */
              <div className="py-20 text-center text-slate-500 bg-slate-900/50 rounded-3xl border border-white/5 border-dashed animate-in zoom-in-95 duration-300">
                <p className="text-4xl mb-4">🕵️‍♂️</p>
                <p className="text-lg font-bold mb-2 text-white">条件に一致する店舗が見つかりませんでした</p>
                <p className="text-xs mb-6">別のキーワードやエリアで試してみてください。</p>
                <button onClick={handleClearSearch} className="bg-white text-slate-900 px-6 py-2 rounded-full text-sm font-bold hover:bg-slate-200 transition shadow-lg">
                  全ての店舗を表示
                </button>
              </div>
            )}

            {/* Load More ボタン */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button 
                  onClick={handleLoadMore}
                  className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-700 transition active:scale-95 shadow-lg border border-white/10"
                >
                  もっと見る (+{result.length - visibleShops.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
