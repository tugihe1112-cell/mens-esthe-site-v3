import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import { useAppContext } from '../context/AppContext.tsx';
import { useAuth } from '../contexts/AuthContext.jsx'; 
import LazyImage from '../components/LazyImage.jsx';
import ModernReviewCard from '../components/ModernReviewCard.jsx';
import SeoHead from '../components/SeoHead.jsx';

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
  
  // ☁️ クラウド(Supabase)から直接最新データを取得する機構
  const [cloudShop, setCloudShop] = useState(null);
  const [cloudTherapists, setCloudTherapists] = useState(null);

  useEffect(() => {
    if (!shopId) return;
    const fetchFromCloud = async () => {
      try {
        // viteの環境変数からURLとキーを自動取得
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
        
        // 店舗データをクラウドから直接GET
        const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}&select=*`, { headers });
        const shopData = await shopRes.json();
        if (shopData && shopData.length > 0) setCloudShop(shopData[0]);

        // キャストデータをクラウドから直接GET
        const tRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}&select=*`, { headers });
        const tData = await tRes.json();
        if (tData && tData.length > 0) setCloudTherapists(tData);
      } catch (err) {
        console.error("Cloud fetch failed", err);
      }
    };
    fetchFromCloud();
  }, [shopId]);

  useEffect(() => { 
    window.scrollTo(0, 0); 
    if (shopId) {
      loadTherapistsForShop(shopId);
      loadReviewsForShop(shopId);
    }
  }, [shopId, loadTherapistsForShop, loadReviewsForShop]);

  if (!shopById) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  const baseShop = shopById[shopId];
  const shop = cloudShop || baseShop;
  if (!shop) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Shop not found</div>;

  // 🌟 ここで「プレミアム会員かどうか」をエンジンに伝えます！
  const reviews = getReviewsByShopId(shopId, isPremiumUser) || [];
  const therapists = cloudTherapists || getTherapistsByShopId(shopId) || [];
  const isFavorite = favorites.includes(shop.id);

  const [reviewDisplayCount, setReviewDisplayCount] = React.useState(10);
  const visibleReviews = reviews.slice(0, reviewDisplayCount);
  const visibleTherapists = therapists.slice(0, displayCount);
  console.log('🚨【セラピストデータ確認】🚨', visibleTherapists.length > 0 ? visibleTherapists[0] : 'データなし');
  const hasMore = displayCount < therapists.length;
  const handleLoadMore = () => setDisplayCount(prev => prev + LOAD_MORE_COUNT);

  const seoDesc = `${shop.name}（${shop.prefecture} ${shop.city}）の店舗情報。在籍セラピスト${therapists.length}名。`;

  const handlePostReview = () => {
    navigate(`/shops/${shop.id}/review`);
  };

  return (
    <div className="bg-slate-950 min-h-screen pb-20 text-slate-200 font-sans relative">
      <SeoHead title={shop.name} description={seoDesc} path={`/shops/${shop.id}`} />

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
               <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-2 drop-shadow-xl tracking-tight">
                 {shop.name}
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
          {['TOP', 'CAST', 'REVIEW'].map((tab) => {
            const isActive = activeTab === tab.toLowerCase();
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`flex-1 py-4 text-xs md:text-sm font-black tracking-[0.2em] transition-all relative ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
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
            {(shop.website_url || shop?.raw_data?.website) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                <a 
                  href={shop.website_url || shop.raw_data.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 transition group shadow-lg"
                >
                  <span className="text-xl opacity-60 group-hover:opacity-100 transition">🌍</span>
                  <div className="text-left flex-1">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Official</div>
                    <div className="text-xs font-bold text-slate-200 tracking-wide group-hover:text-blue-400 transition">公式サイト</div>
                  </div>
                </a>
                
                <a 
                  href={shop?.raw_data?.cast_url || (shop?.website_url || shop?.raw_data?.website || '').replace(/\/?$/, '') + '/cast/'}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 transition group shadow-lg"
                >
                  <span className="text-xl opacity-60 group-hover:opacity-100 transition">👯‍♀️</span>
                  <div className="text-left flex-1">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Cast</div>
                    <div className="text-xs font-bold text-slate-200 tracking-wide group-hover:text-pink-400 transition">キャスト</div>
                  </div>
                </a>

                <a 
                  href={shop?.raw_data?.schedule_url || (shop?.website_url || shop?.raw_data?.website || '').replace(/\/?$/, '') + '/schedule/'}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 transition group shadow-lg"
                >
                  <span className="text-xl opacity-60 group-hover:opacity-100 transition">📅</span>
                  <div className="text-left flex-1">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Schedule</div>
                    <div className="text-xs font-bold text-slate-200 tracking-wide group-hover:text-green-400 transition">出勤情報</div>
                  </div>
                </a>
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
                  <dd className="text-sm md:text-base text-white whitespace-pre-wrap leading-loose font-medium bg-slate-800/50 p-4 rounded-xl border border-white/5">{shop.price_system || shop.raw_data?.price || '料金情報なし'}</dd>
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
                 <a href={shop.website_url || shop.raw_data?.websiteUrl || '#'} target="_blank" rel="noreferrer" className="block w-full bg-white text-slate-900 hover:bg-slate-200 py-4 rounded-xl text-sm font-black text-center transition shadow-lg tracking-widest uppercase">
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
                           <button 
                             onClick={(e) => {
                               e.preventDefault();
                               toggleFavTherapist(`${shop.id}_${t.id}`);
                             }}
                             className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-lg hover:bg-pink-600 transition"
                           >
                             {favTherapists.includes(`${shop.id}_${t.id}`) ? '❤️' : '🤍'}
                           </button>
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
                 {visibleReviews.map((review, idx) => {
                   const shouldBlur = idx > 0 && !isPremiumUser;

                   return (
                     <div key={idx} className={`transition-all duration-300 ${shouldBlur ? 'blur-[6px] opacity-40 select-none pointer-events-none' : ''}`}>
                       <ModernReviewCard review={review} />
                     </div>
                   );
                 })}

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

      </div>
    </div>
  );
}
