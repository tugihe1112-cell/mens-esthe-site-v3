import React, { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import { useAppContext } from '../context/AppContext.tsx';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed.js';
import LazyImage from '../components/LazyImage.jsx';
import ModernReviewCard from '../components/ModernReviewCard.jsx';
import SeoHead from '../components/SeoHead.jsx';

export default function ThreadDetailPage() {
  const { shopId, threadId } = useParams();
  const navigate = useNavigate();

  const [fetchedShop, setFetchedShop] = React.useState(null);
  const [fetchedTherapist, setFetchedTherapist] = React.useState(null);

  React.useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
        
        const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}&select=*`, { headers });
        const shopData = await shopRes.json();
        if (shopData && shopData.length > 0) setFetchedShop(shopData[0]);

        const tRes = await fetch(`${url}/rest/v1/therapists?id=eq.${threadId}&select=*`, { headers });
        const tData = await tRes.json();
        if (tData && tData.length > 0) setFetchedTherapist(tData[0]);
      } catch(e) { console.error(e); }
    };
    if (shopId && threadId) fetchCloudData();
  }, [shopId, threadId]);

const { shopById, therapistById, reviews } = useShopData();
  const { favTherapists, toggleFavTherapist } = useAppContext();
  const { addToHistory } = useRecentlyViewed();

  // 1. 変数を安全に取得（Loading中でもエラーにならないようにする）
  // ☁️ クラウドから直接データ取得（迷子防止）
  const [cloudShop, setCloudShop] = React.useState(null);
  const [cloudTherapist, setCloudTherapist] = React.useState(null);
  React.useEffect(() => {
    if (!shopId || !threadId) return;
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
    fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, {headers}).then(r=>r.json()).then(d=>d[0]&&setCloudShop(d[0]));
    fetch(`${url}/rest/v1/therapists?id=eq.${threadId}`, {headers}).then(r=>r.json()).then(d=>d[0]&&setCloudTherapist(d[0]));
  }, [shopId, threadId]);

  const shop = fetchedShop || cloudShop || (shopById ? shopById[shopId] : null);
  let therapist = fetchedTherapist || cloudTherapist || (therapistById ? therapistById[threadId] : null);

  // 🔥 AI自動生成対応：公式リストにいなくても、クチコミがあれば「仮想プロフィール」を自動で作る！
  if (!therapist && reviews) {
    const hasReviews = reviews.some(r => r.therapistId === threadId || r.threadId === threadId || r.therapist_id === threadId);
    if (hasReviews) {
      const extractedName = threadId.split('_').pop(); // IDから名前部分を抽出
      therapist = {
        id: threadId,
        name: extractedName,
        image: '', // 写真はないので空
        age: null,
        T: null
      };
    }
  }

  const uniqueKey = shop && therapist ? `${shop.id}_${therapist.id || therapist.name}` : '';
  const isFav = uniqueKey ? favTherapists.includes(uniqueKey) : false;

  // 2. すべてのHook（useEffect / useMemo）をEarly Returnより前に配置！
  useEffect(() => {
    if (therapist && shop && uniqueKey) {
      addToHistory({
        id: uniqueKey,
        therapistId: therapist.id,
        shopId: shop.id,
        name: therapist.name,
        image: therapist.image,
        shopName: shop.name
      });
    }
  }, [uniqueKey, therapist, shop, addToHistory]);

  const therapistReviews = useMemo(() => {
    if (!shop || !therapist || !reviews) return [];
    return reviews.filter(r => 
      (r.therapistId === threadId) || 
      (r.threadId === threadId) || 
      (r.therapist_id === threadId) ||
      (r.therapistName === therapist.name && (r.shopId === shopId || r.shop_id === shopId || r.group_id === shop.group_id))
    );
  }, [reviews, threadId, therapist?.name, shopId, shop?.group_id]);

  const stats = useMemo(() => {
    if (therapistReviews.length === 0) return null;
    const sum = therapistReviews.reduce((acc, r) => {
      const d = r.detailedRatings || {}; 
      return {
        looks: acc.looks + Number(d.looks || r.rating),
        style: acc.style + Number(d.style || r.rating),
        technique: acc.technique + Number(d.massage || d.technique || r.rating),
        service: acc.service + Number(d.service || d.intimacy || r.rating)
      };
    }, { looks: 0, style: 0, technique: 0, service: 0 });

    const count = therapistReviews.length;
    return {
      looks: (sum.looks / count).toFixed(1),
      style: (sum.style / count).toFixed(1),
      technique: (sum.technique / count).toFixed(1),
      service: (sum.service / count).toFixed(1),
      count
    };
  }, [therapistReviews]);

  // 3. Hookの処理が終わったあとに、初めて Loading / Not Found の判定を行う！
  if (!shopById || !therapistById) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  if (!shop || !therapist) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <p>Therapist not found</p>
        <button onClick={() => navigate(-1)} className="text-pink-400 underline">Back</button>
      </div>
    );
  }

  const seoDesc = `${shop.name}（${shop.prefecture} ${shop.city}）のセラピスト、${therapist.name}さんのプロフィールとクチコミ。年齢:${therapist.age}歳。`;

  const handlePostReview = () => {
    navigate(`/shops/${shopId}/threads/${threadId}/review`);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead 
        title={`${therapist.name} | ${shop.name}`} 
        description={seoDesc}
        path={`/shops/${shopId}/threads/${threadId}`}
      />

      {/* --- 全画面写真エリア --- */}
      <div className={`relative w-full group overflow-hidden ${therapist.image ? 'h-[70vh] md:h-[80vh]' : 'h-[45vh] bg-slate-900'}`}>
        <div className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-start">
           <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/40 transition active:scale-95">←</button>
           <button onClick={() => toggleFavTherapist(uniqueKey)} className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center border transition shadow-xl active:scale-90 ${isFav ? 'bg-pink-600/80 border-pink-500 text-white shadow-pink-500/30' : 'bg-black/20 border-white/10 text-white hover:bg-white/10'}`}>
             <span className="text-2xl">{isFav ? '❤️' : '🤍'}</span>
           </button>
        </div>

        {therapist.image ? (
          <LazyImage src={therapist.image_url || therapist.image} alt={therapist.name} className="w-full h-full object-cover transition duration-[3s] group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <span className="text-4xl md:text-6xl font-black text-slate-500 tracking-widest">NO IMAGE</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/30"></div>

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-20">
          <div className="max-w-2xl mx-auto">
             <Link to={`/shops/${shop.id}`} className="inline-flex items-center gap-2 mb-4 group/shop">
               <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-xs border border-white/10 group-hover/shop:bg-pink-600 transition">🏢</div>
               <span className="text-sm font-bold text-slate-300 group-hover/shop:text-white transition">{shop.name}</span>
             </Link>
             <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl leading-none">{therapist.name}</h1>
             <div className="flex flex-wrap gap-2 mb-6">
                {therapist.age && <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/10 text-xs font-bold text-white">{therapist.age}歳</span>}
                {therapist.T && <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/10 text-xs font-bold text-white">T{therapist.T}</span>}
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-30 space-y-8">
        {/* --- プロフィールデータ --- */}
        <section className="bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span> PROFILE DATA
             </h3>
             <div className="text-right">
               <span className="text-2xl font-black text-white">{stats ? stats.count : 0}</span>
               <span className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Reviews</span>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8 text-center">
             <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">HEIGHT</div>
                <div className="text-lg font-black text-white">T{therapist.T || '-'}</div>
             </div>
             <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">SIZE</div>
                <div className="text-lg font-black text-pink-400">{therapist.cup ? `(${therapist.cup})` : '-'}</div>
             </div>
             <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">TYPE</div>
                <div className="text-xs font-bold text-white pt-1 line-clamp-1">{therapist.types?.[0] || 'Model'}</div>
             </div>
          </div>

          {stats ? (
             <div className="space-y-4">
               {[ 
                 { label: 'LOOKS', val: stats.looks, col: 'bg-pink-500' }, 
                 { label: 'STYLE', val: stats.style, col: 'bg-purple-500' }, 
                 { label: 'TECHNIQUE', val: stats.technique, col: 'bg-blue-500' }, 
                 { label: 'SERVICE', val: stats.service, col: 'bg-yellow-500' } 
               ].map((item) => (
                 <div key={item.label} className="flex items-center gap-3">
                   <span className="text-[10px] font-bold w-16 text-slate-400">{item.label}</span>
                   <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                     <div className={`${item.col} h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min((item.val / 5) * 100, 100)}%` }}></div>
                   </div>
                   <span className="text-xs font-bold text-white w-8 text-right">{item.val}</span>
                 </div>
               ))}
             </div>
          ) : (
             <div className="text-center py-6 text-slate-500 text-sm bg-slate-900/30 rounded-xl border border-dashed border-slate-800">No ratings yet</div>
          )}
        </section>

        {/* --- 🔥 クチコミ投稿ボタン --- */}
        <div className="flex justify-center pb-4">
          <button 
            onClick={handlePostReview}
            className="w-full max-w-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black py-4 px-8 rounded-full shadow-lg shadow-pink-600/30 transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <span className="text-xl">✍️</span>
            クチコミを投稿する
          </button>
        </div>

        {/* --- クチコミリスト --- */}
        {therapistReviews.length > 0 && (
          <section className="space-y-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2 px-2">
              <span className="text-pink-500">💬</span> REVIEWS <span className="text-slate-500 text-sm ml-2">({therapistReviews.length})</span>
            </h3>
            <ReviewListWithRestriction reviews={therapistReviews} />
          </section>
        )}
      </div>
    </div>
  );
}
