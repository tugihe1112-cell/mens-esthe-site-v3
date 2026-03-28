// src/pages/SearchResultsPage.jsx
// 新データ基盤対応版（検索結果）

import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx'; // 👈 新データ
import LazyImage from '../components/LazyImage.jsx';
import LikeButton from '../components/LikeButton.jsx';
import { ListSkeleton } from '../components/Skeleton.jsx';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { shops, loading , getTherapistsByShopId} = useShopData(); // 新データ取得

  // 🔍 検索ロジック
  const searchResults = useMemo(() => {
    if (!shops || !query.trim()) return { shops: [], therapists: [] };
    const lowerQuery = query.toLowerCase();

    // 1. 店舗検索
    const matchedShops = shops.filter(shop =>
      shop?.name?.toLowerCase().includes(lowerQuery) ||
      shop?.prefecture?.includes(query) ||
      shop?.city?.includes(query)
    );

    // 2. セラピスト検索
    const matchedTherapists = [];
    shops.forEach(shop => {
      // threadsもtherapistsも、オブジェクトか文字列か判定して安全に取り出す
      const allT = [...(shop.threads || []), ...(getTherapistsByShopId(shop.id) || [])];
      
      allT.forEach((t, i) => {
        // 文字列ならそのまま、オブジェクトならnameプロパティ
        const tName = (typeof t === 'string' ? t : t.name) || '';
        
        if (tName.toLowerCase().includes(lowerQuery)) {
          const tId = (typeof t === 'object' && t.id) ? t.id : i;
          
          matchedTherapists.push({
            uid: `therapist_${shop.id}_${tId}`,
            id: tId,
            name: tName,
            image: (typeof t === 'object' && t.image) ? t.image : null,
            shopName: shop.name,
            shopId: shop.id
          });
        }
      });
    });

    return { shops: matchedShops, therapists: matchedTherapists };
  }, [query, shops]);

  const totalResults = searchResults.shops.length + searchResults.therapists.length;

  return (
    <div className="min-h-screen bg-slate-900 text-white py-24 pb-32">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-3xl font-black mb-3">
            🔍 <span className="text-pink-500">"{query}"</span> の検索結果
          </h1>
          <p className="text-slate-500 font-bold">{totalResults}件のヒット</p>
        </div>

        {loading ? (
          <ListSkeleton count={6} />
        ) : totalResults === 0 ? (
          <div className="bg-slate-800/50 rounded-3xl p-20 text-center border border-slate-700 border-dashed">
            <div className="text-6xl mb-6">🏜️</div>
            <p className="text-xl font-bold text-gray-400 mb-2">一致する結果がありません</p>
            <p className="text-sm text-gray-500">キーワードを変えて再検索してみてください</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* 🏢 店舗セクション */}
            {searchResults.shops.length > 0 && (
              <section>
                <h2 className="text-xl font-black mb-6 flex items-center gap-3 border-l-4 border-blue-500 pl-4 uppercase tracking-widest">
                  Shops <span className="text-sm font-normal text-slate-500">({searchResults.shops.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.shops.map(shop => (
                    <div key={shop.id} className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all relative">
                      <Link to={`/shops/${shop.id}`}>
                        <div className="h-48 overflow-hidden">
                          <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition">{shop.name}</h3>
                          <p className="text-xs text-slate-500">📍 {shop.prefecture} {shop.city}</p>
                        </div>
                      </Link>
                      <LikeButton id={`shop_${shop.id}`} className="absolute top-3 right-3 w-10 h-10 p-2.5 bg-slate-900/60 backdrop-blur rounded-full" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 💆‍♀️ セラピストセクション */}
            {searchResults.therapists.length > 0 && (
              <section>
                <h2 className="text-xl font-black mb-6 flex items-center gap-3 border-l-4 border-pink-500 pl-4 uppercase tracking-widest">
                  Therapists <span className="text-sm font-normal text-slate-500">({searchResults.therapists.length})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {searchResults.therapists.map((t) => (
                    <div key={t.uid} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative group">
                      <Link to={`/shops/${t.shop_id}/threads/${t.id}`}>
                        <div className="aspect-[3/4] overflow-hidden">
                          <LazyImage src={t.image_url || t.image || "/images/therapists/no_image.jpg"} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                        </div>
                        <div className="p-3 text-center">
                          <div className="font-bold text-sm text-white truncate">{t.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">@{t.shopName}</div>
                        </div>
                      </Link>
                      <LikeButton id={t.uid} className="absolute top-2 right-2 w-8 h-8 p-2 bg-slate-900/40 backdrop-blur rounded-full" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
