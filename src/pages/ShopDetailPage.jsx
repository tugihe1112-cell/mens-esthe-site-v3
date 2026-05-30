import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import { useAppContext } from '../context/AppContext.tsx';
import { useAuth } from '../contexts/AuthContext.jsx'; 
import LazyImage from '../components/LazyImage.jsx';
import ModernReviewCard from '../components/ModernReviewCard.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { getDisplayName } from '../utils/shopHelpers';

const INITIAL_DISPLAY_COUNT = 12;
const LOAD_MORE_COUNT = 12;

export default function ShopDetailPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { shopById, getTherapistsByShopId, getReviewsByShopId, loadTherapistsForShop, loadReviewsForShop } = useShopData();
  const { toggleFavorite, favorites, toggleFavTherapist, favTherapists } = useAppContext();
  
  const { userPlan } = useAuth();
  const isPremiumUser = userPlan === 'premium' || userPlan === 'vip';

  const [activeTab, setActiveTab] = useState('top');
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  // 🔒 ロック1：完全個室化ステート（※変数名は cloudShop のまま残して、後半のエラーを完全回避！）
  const [cloudShop, setCloudShop] = useState(null);
  const [cloudTherapists, setCloudTherapists] = useState(null);
  const [cloudReviews, setCloudReviews] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  // レビューページネーション
  const REVIEW_PAGE_SIZE = 20;
  const [reviewOffset, setReviewOffset] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);

  // セラピスト別口コミ件数 { name → count }
  const [therapistReviewCounts, setTherapistReviewCounts] = useState({});

  useEffect(() => {
    if (!shopId) return;
    let isMounted = true;
    
    const fetchAllData = async () => {
      setIsFetching(true);
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

        // 1. 先に店舗データだけを取得してブランドIDを確定させる
        const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}&select=*`, { headers, cache: 'no-store' });
        const shopData = await shopRes.json();

        // 店舗データは即座にセット（後続の処理が失敗しても表示できるように）
        if (isMounted && Array.isArray(shopData) && shopData.length > 0) {
          setCloudShop(shopData[0]);
        }

        const groupId = shopData?.[0]?.group_id;

        // group_idが同じ店舗のIDを先に取得してからセラピストを取得
        let therapistShopIds = [shopId];
        if (groupId) {
          const groupShopsRes = await fetch(`${url}/rest/v1/shops?group_id=eq.${groupId}&select=id`, { headers, cache: 'no-store' });
          const groupShops = await groupShopsRes.json();
          if (Array.isArray(groupShops) && groupShops.length > 0) {
            therapistShopIds = groupShops.map(s => s.id);
          }
        }
        const therapistQuery = `shop_id=in.(${therapistShopIds.join(',')})`;

        // 2. group_id がある場合は系列店全店の口コミを取得（最新20件のみ）
        const reviewShopIds = therapistShopIds;
        const reviewBase = reviewShopIds.length > 1
          ? `${url}/rest/v1/reviews?shop_id=in.(${reviewShopIds.join(',')})`
          : `${url}/rest/v1/reviews?shop_id=eq.${shopId}`;
        const reviewFetchUrl = `${reviewBase}&select=*&order=created_at.desc&limit=${REVIEW_PAGE_SIZE}&offset=0`;

        const [tRes, rRes] = await Promise.all([
          fetch(`${url}/rest/v1/therapists?select=*&${therapistQuery}`, { headers, cache: 'no-store' }),
          fetch(reviewFetchUrl, { headers, cache: 'no-store' })
        ]);

        // セラピスト別口コミ件数（therapist_name列のみ取得・軽量）
        const countFetchUrl = reviewShopIds.length > 1
          ? `${url}/rest/v1/reviews?shop_id=in.(${reviewShopIds.join(',')})&select=therapist_name`
          : `${url}/rest/v1/reviews?shop_id=eq.${shopId}&select=therapist_name`;

        const [tData, rData, cData] = await Promise.all([
          tRes.json(),
          rRes.json(),
          fetch(countFetchUrl, { headers, cache: 'no-store' }).then(r => r.json()),
        ]);

        if (isMounted) {
          if (Array.isArray(tData) && tData.length > 0) setCloudTherapists(tData);
          if (Array.isArray(rData)) {
            setCloudReviews(rData);
            setHasMoreReviews(rData.length === REVIEW_PAGE_SIZE);
            setReviewOffset(REVIEW_PAGE_SIZE);
          }
          if (Array.isArray(cData)) {
            const norm = (s) => (s || '').replace(/[\s　]/g, '');
            const counts = {};
            cData.forEach(r => {
              const n = norm(r.therapist_name);
              if (n) counts[n] = (counts[n] || 0) + 1;
            });
            setTherapistReviewCounts(counts);
          }
        }
      } catch (err) {
        console.error("Cloud fetch failed", err);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };
    fetchAllData();
    return () => { isMounted = false; };
  }, [shopId]);

  // 追加のレビューを取得（プレミアム用ページネーション）
  const loadMoreReviews = async () => {
    if (isLoadingMoreReviews || !hasMoreReviews) return;
    setIsLoadingMoreReviews(true);
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
      const shop = cloudShop;
      if (!shop) return;

      // group_id がある場合は系列店全店分
      let shopIds = [shopId];
      if (shop.group_id) {
        const grpRes = await fetch(`${url}/rest/v1/shops?group_id=eq.${shop.group_id}&select=id`, { headers });
        const grpData = await grpRes.json();
        if (Array.isArray(grpData) && grpData.length > 0) shopIds = grpData.map(s => s.id);
      }
      const base = shopIds.length > 1
        ? `${url}/rest/v1/reviews?shop_id=in.(${shopIds.join(',')})`
        : `${url}/rest/v1/reviews?shop_id=eq.${shopId}`;
      const fetchUrl = `${base}&select=*&order=created_at.desc&limit=${REVIEW_PAGE_SIZE}&offset=${reviewOffset}`;
      const res = await fetch(fetchUrl, { headers });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCloudReviews(prev => [...prev, ...data]);
        setHasMoreReviews(data.length === REVIEW_PAGE_SIZE);
        setReviewOffset(prev => prev + REVIEW_PAGE_SIZE);
      }
    } catch (e) {
      console.error('loadMoreReviews error', e);
    } finally {
      setIsLoadingMoreReviews(false);
    }
  };

  // 共有箱(Context)はあくまで「保険」。基本は直接取ってきた cloudShop を使う
  const shop = cloudShop || (shopById ? shopById[shopId] : null);
  // グループ店舗で同一セラピストが複数店舗に登録されている場合に重複除去
  const dedupeTherapists = (arr) => {
    if (!arr) return arr;
    const seen = new Set();
    return arr.filter(t => {
      const key = (t.name || '').replace(/\s/g, '').replace(/　/g, '').trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const therapists = dedupeTherapists(cloudTherapists) || (getTherapistsByShopId ? getTherapistsByShopId(shopId) : []) || [];
  const reviews = cloudReviews.length > 0 ? cloudReviews : (getReviewsByShopId ? getReviewsByShopId(shopId, isPremiumUser) : []);
  const isFavorite = shop ? favorites.includes(shop.id) : false;

  // 🌟 店舗IDからロゴ画像を判定するロジック
  let logoUrl = null;
  if (shopId?.includes('yuruspa') || shop?.brand_id === 'yuruspa') {
    logoUrl = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/yuruspa.png';
  } else if (shopId?.includes('mens_esthe_group') || shopId?.includes('menes_group') || shop?.brand_id === 'mens_esthe_group') {
    logoUrl = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/menesgroup.png';
  }

  const visibleTherapists = therapists.slice(0, displayCount);
  const hasMore = displayCount < therapists.length;
  const handleLoadMore = () => setDisplayCount(prev => prev + LOAD_MORE_COUNT);

  // ✨ すべてのHook（useState, useEffect）が終わったので、ここで初めて安全に早期リターン！
  if (isFetching && !shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold tracking-widest animate-pulse">LOADING...</div>;
  if (!shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Shop not found</div>;

  const seoDesc = `${shop.name}（${shop.prefecture} ${shop.city}）の店舗情報。在籍セラピスト${therapists.length}名。`;

  const handlePostReview = () => {
    navigate(`/shops/${shop.id}/review`);
  };

  return (
    <div className="bg-slate-950 min-h-screen pb-28 md:pb-16 text-slate-200 font-sans relative">
      <SeoHead title={shop.name} description={seoDesc} path={`/shops/${shop.id}`} image={shop.image_url || shop.image} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HealthAndBeautyBusiness",
        "name": shop.name,
        "description": seoDesc,
        "url": shop.website_url || shop.raw_data?.url || `https://www.mens-esthe-map.jp/shops/${shop.id}`,
        "image": shop.image_url || shop.image || undefined,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": shop.prefecture || shop.raw_data?.prefecture,
          "addressLocality": shop.city || shop.raw_data?.city,
          "addressCountry": "JP"
        },
        "telephone": shop.phone_number || shop.raw_data?.phone || undefined,
        "aggregateRating": cloudReviews.length > 0 ? {
          "@type": "AggregateRating",
          "ratingValue": (cloudReviews.reduce((s, r) => s + (r.rating || 0), 0) / cloudReviews.length).toFixed(1),
          "reviewCount": cloudReviews.length,
          "bestRating": 5,
          "worstRating": 1
        } : undefined
      }) }} />

      {/* 1. Cinematic Hero Header */}
      <div className="relative h-[45vh] md:h-[55vh] w-full overflow-hidden group">
         <button 
           onClick={() => navigate(-1)} 
           className="absolute top-6 left-4 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition active:scale-95"
         >
           ←
         </button>

         <div className="absolute inset-0">
           <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover transition duration-[2s] group-hover:scale-105" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30"></div>
         </div>

         <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-20">
           <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
             <div className="flex-1">
               <div className="flex flex-wrap gap-2 mb-3">
                 <span className="px-2.5 py-0.5 rounded-md bg-pink-600/80 backdrop-blur text-white text-[10px] font-bold tracking-widest uppercase border border-white/10">
                   {shop.city} {shop.area}
                 </span>
                 {shop.group_id && (
                   <span className="px-2.5 py-0.5 rounded-md bg-blue-600/80 backdrop-blur text-white text-[10px] font-bold tracking-widest uppercase border border-white/10">
                     GROUP STORE
                   </span>
                 )}
               </div>
               {logoUrl && (<div className="mb-4 flex justify-center"><img src={logoUrl} alt="Brand Logo" className="h-16 md:h-20 w-auto object-contain" /></div>)}
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-2 drop-shadow-xl tracking-tight">
                 {getDisplayName(shop.name)}
               </h1>
               <div className="flex items-center gap-4 text-slate-300 text-xs md:text-sm font-medium">
                 <span>📍 {shop.address}</span>
                 <span className="text-yellow-400 font-bold">★ {shop.rating || 'New'}</span>
               </div>
             </div>

             <div className="flex gap-3">
               <button 
                  onClick={() => toggleFavorite(shop.id)} 
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition shadow-lg backdrop-blur-sm ${
                    isFavorite 
                      ? 'bg-pink-600 text-white border border-pink-500' 
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {isFavorite ? 'Saved ❤️' : 'Save'}
                </button>
               <button 
                 onClick={handlePostReview}
                 className="hidden md:flex bg-white text-slate-950 px-6 py-3 rounded-full font-black shadow-lg hover:bg-pink-500 hover:text-white transition-all transform hover:-translate-y-1 items-center gap-2"
               >
                 <span>✍️</span> クチコミ
               </button>
             </div>
           </div>
         </div>
      </div>

      {/* 2. Sticky Tab Navigation */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg">
        <div className="flex max-w-4xl mx-auto">
          {([
            { key: 'top', label: 'トップ' },
            { key: 'cast', label: 'キャスト' },
            { key: 'review', label: '口コミ' },
            ...(cloudShop?.schedule_url ? [{ key: 'schedule', label: '出勤' }] : []),
          ]).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 text-xs md:text-sm font-black tracking-wider transition-all relative ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_-2px_10px_rgba(236,72,153,0.5)]"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-8 min-h-[50vh]">
        
        {activeTab === 'top' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="md:hidden">
                <button 
                  onClick={handlePostReview}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-xl font-black shadow-lg shadow-pink-900/30 flex items-center justify-center gap-2"
                >
                  <span>✍️</span> このお店のクチコミを書く
                </button>
            </div>

            
            
            
            {/* ▼ サイト＆キャスト＆スケジュールリンク (洗練版・3ボタン) ▼ */}
            {(shop.url || shop.websiteUrl || shop.website_url || shop?.raw_data?.url || shop?.raw_data?.website || cloudShop?.schedule_url) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                {cloudShop?.schedule_url && (
              <button onClick={() => setActiveTab('schedule')} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 transition group shadow-lg">
                <span className="text-xl opacity-60 group-hover:opacity-100 transition">📅</span>
                <div className="text-left flex-1">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Schedule</div>
                  <div className="text-xs font-bold text-slate-200 tracking-wide group-hover:text-green-400 transition">出勤情報</div>
                </div>
              </button>
            )}
              </div>
            )}
<div className="bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                   SHOP INFORMATION
                 </h3>
              </div>

              <dl className="space-y-6">
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] items-baseline">
                  <dt className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">HOURS</dt>
                  <dd className="text-sm md:text-base font-bold text-white">{shop.business_hours || shop.raw_data?.hours || '営業時間情報なし'}</dd>
                </div>
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] items-baseline">
                  <dt className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">PRICE</dt>
                  <dd className="text-sm md:text-base text-white w-full bg-slate-800/50 p-4 rounded-xl border border-white/5">{shop?.price_system ? (
  <div className="flex flex-col space-y-3 w-full">
    {(() => {
      let ps = shop.price_system;
      // 文字列で来た場合はJSONパースを試みる
      if (typeof ps === 'string') {
        try { ps = JSON.parse(ps); } catch {}
      }
      // オブジェクト形式: {"70": 12500, "90": 15000, ...}
      if (ps && typeof ps === 'object' && !Array.isArray(ps)) {
        return Object.entries(ps)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([min, price]) => (
            <div key={min} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-slate-300">{min}分</span>
              <span className="text-white font-bold tracking-wider">¥{Number(price).toLocaleString()}</span>
            </div>
          ));
      }
      // 旧フォーマット "70分:12500\n90分:15000"
      const str = typeof ps === 'string' ? ps : JSON.stringify(ps);
      return str.split('\n').filter(Boolean).map((line, idx) => {
        const parts = line.split(':');
        return (
          <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
            <span className="text-slate-300">{parts[0]}</span>
            <span className="text-white font-bold tracking-wider">{parts[1] || ''}</span>
          </div>
        );
      });
    })()}
  </div>
) : (
  <div className="text-slate-300">料金情報なし</div>
)}
                </dd>
                </div>
                {(shop.phone_number || shop.raw_data?.phone) && (
                  <div className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] items-baseline">
                    <dt className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">TEL</dt>
                    <dd className="text-sm md:text-base font-bold text-white tracking-widest">
                       <a href={`tel:${shop.phone_number || shop.raw_data?.phone}`} className="hover:text-pink-400 transition">{shop.phone_number || shop.raw_data?.phone}</a>
                    </dd>
                  </div>
                )}
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[120px_1fr] items-baseline">
                  <dt className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">ACCESS</dt>
                  <dd className="text-sm md:text-base text-slate-300 leading-relaxed">
                    {shop.address}
                  </dd>
                </div>
              </dl>
              
              <div className="mt-8">
                 <a href={shop.url || shop.website_url || shop.raw_data?.url || shop.raw_data?.websiteUrl || '#'} target="_blank" rel="noreferrer" className="block w-full bg-white text-slate-900 hover:bg-slate-200 py-4 rounded-xl text-sm font-black text-center transition shadow-lg tracking-widest uppercase">
                   Official Website ↗
                 </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cast' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="flex items-center justify-between mb-6 px-1">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                 THERAPISTS
               </h3>
               <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300">
                 Total {therapists.length}
               </span>
             </div>
             
             {therapists.length > 0 ? (
               <>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {visibleTherapists.map(t => (
                     <Link key={t.id} to={`/shops/${shop.id}/threads/${t.id}`} className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all duration-300">
                         <div className="aspect-[3/4] relative overflow-hidden">
                           <LazyImage src={t.image_url || t.image} alt={t.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60"></div>
                           <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {t.age && <span className="bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">{t.age}歳</span>}
                           </div>
                           <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                             {(() => {
                               const cnt = therapistReviewCounts[(t.name || '').replace(/[\s　]/g, '')];
                               return cnt > 0 ? (
                                 <span className="bg-pink-500 text-white text-[11px] font-black px-2 py-1 rounded-full shadow-lg shadow-pink-500/50 flex items-center gap-1">
                                   💬 {cnt}
                                 </span>
                               ) : null;
                             })()}
                             <button
                               onClick={(e) => {
                                 e.preventDefault();
                                 toggleFavTherapist(`${shop.id}_${t.id}`);
                               }}
                               className="w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-lg hover:bg-pink-600 transition"
                             >
                               {favTherapists.includes(`${shop.id}_${t.id}`) ? '❤️' : '🤍'}
                             </button>
                           </div>
                         </div>
                         <div className="absolute bottom-0 left-0 w-full p-3">
                           <div className="flex items-end justify-between">
                             <div>
                               <h4 className="text-white font-bold text-base leading-tight">{t.name}</h4>
                               <p className="text-[10px] text-slate-400 mt-0.5">T{t.tall || '-'} / B{t.cup || '-'}</p>
                             </div>
                             {t.isNew && <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">NEW</span>}
                           </div>
                         </div>
                     </Link>
                   ))}
                 </div>
                 {hasMore && (
                    <div className="mt-12 text-center">
                      <button 
                        onClick={handleLoadMore}
                        className="px-8 py-3 rounded-full bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 hover:text-white transition border border-white/5"
                      >
                        もっと見る (+{therapists.length - displayCount})
                      </button>
                    </div>
                 )}
               </>
             ) : (
                <div className="py-20 text-center text-slate-500 text-sm">
                   在籍セラピスト情報はありません
                </div>
             )}
          </div>
        )}

        {/* 🌟 REVIEWタブ */}
        {activeTab === 'review' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
            <div className="flex items-center justify-between mb-6 px-1">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                 REVIEWS
               </h3>
               <button 
                  onClick={handlePostReview}
                  className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold text-white border border-white/10 transition flex items-center gap-2"
               >
                 <span>✍️</span> 投稿する
               </button>
            </div>

            {reviews.length > 0 ? (
               <div className="space-y-4 relative">
                 {reviews.map((review, idx) => {
                   const shouldBlur = idx > 0 && !isPremiumUser;

                   return (
                     <div key={review.id || idx} className={`transition-all duration-300 ${shouldBlur ? 'blur-[6px] opacity-40 select-none pointer-events-none' : ''}`}>
                       <ModernReviewCard review={review} />
                     </div>
                   );
                 })}

                 {/* プレミアム: もっと見る */}
                 {isPremiumUser && hasMoreReviews && (
                   <button
                     onClick={loadMoreReviews}
                     disabled={isLoadingMoreReviews}
                     className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition disabled:opacity-50"
                   >
                     {isLoadingMoreReviews ? '読み込み中...' : 'さらに読み込む'}
                   </button>
                 )}

                 {!isPremiumUser && reviews.length > 1 && (
                   <div className="absolute inset-0 top-[20%] z-10 flex flex-col items-center justify-center p-6 text-center">
                     <div className="bg-slate-900/95 backdrop-blur-xl p-8 rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.1)] max-w-sm w-full mx-auto animate-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20">
                          <span className="text-3xl">👑</span>
                        </div>
                        <h4 className="text-xl font-black text-white mb-2">続きはプレミアム限定</h4>
                        <p className="text-sm text-slate-400 mb-6 font-medium">
                          過去のすべてのクチコミや、リアルな評価を読むにはプレミアム会員（月額500円）の登録が必要です。
                        </p>
                        <button 
                          onClick={() => navigate('/premium')}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-black text-base shadow-lg shadow-yellow-600/30 hover:scale-105 transition-all"
                        >
                          プレミアムに登録する
                        </button>
                     </div>
                   </div>
                 )}
               </div>
            ) : (
               <div className="py-20 text-center bg-slate-900/50 rounded-3xl border border-white/5 border-dashed">
                 <p className="text-slate-500 font-bold mb-4">まだクチコミがありません</p>
                 <button 
                   onClick={handlePostReview}
                   className="text-pink-400 font-bold text-sm hover:underline"
                 >
                   一番乗りで投稿する →
                 </button>
               </div>
            )}
          </div>
        )}

        {/* 📅 SCHEDULEタブ */}
        {activeTab === 'schedule' && cloudShop?.schedule_url && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                SCHEDULE
              </h3>
              <a
                href={cloudShop.schedule_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                別タブで開く ↗
              </a>
            </div>
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900" style={{ height: '75vh' }}>
              <iframe
                src={cloudShop.schedule_url}
                title="出勤スケジュール"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <div className="mt-4 flex justify-center">
              <a
                href={cloudShop.schedule_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 border border-white/10 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                表示されない場合は公式サイトで確認
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
