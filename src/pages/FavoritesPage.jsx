import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import { useShopData } from '../contexts/DataContext.jsx';
import { Link, useNavigate } from '../compat/router';
import LazyImage from '../components/LazyImage.jsx';
import Header from '../components/Header.jsx';
import { getDisplayName } from '../utils/shopHelpers';
import SeoHead from '../components/SeoHead.jsx';

export default function FavoritesPage() {
  const { favorites, favTherapists } = useAppContext();
  const { shopById, therapistById } = useShopData();
  const [activeTab, setActiveTab] = useState('therapists'); // 'therapists' | 'shops'
  const navigate = useNavigate();

  // Loading check
  if (!shopById || !therapistById) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500">Loading...</div>;

  // --- Restore Data ---
  const favShopList = useMemo(() => {
    return favorites.map(id => shopById[id]).filter(Boolean);
  }, [favorites, shopById]);

  const favTherapistList = useMemo(() => {
    return favTherapists.map(uniqueKey => {
      const [sId, tId] = uniqueKey.split('_');
      const therapist = therapistById[tId];
      const shop = shopById[sId];
      if (!therapist) return null;
      return { ...therapist, shopId: sId, shopName: shop ? shop.name : 'Unknown Shop' };
    }).filter(Boolean);
  }, [favTherapists, therapistById, shopById]);

  return (
    <div className="min-h-screen bg-slate-950 pb-32 font-sans text-slate-200">
      <SeoHead title="お気に入り" noindex />
      <Header />
      
      <div className="pt-24 px-4 max-w-5xl mx-auto">
        
        {/* Header Area */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <span className="text-4xl">❤️</span> FAVORITES
            </h1>
            <p className="text-slate-400 text-sm font-bold mt-1 ml-1">あなたの推しコレクション</p>
          </div>
        </div>

        {/* Tab Switcher (iOS Segmented Control Style) */}
        <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl mb-10 border border-white/5 flex shadow-inner sticky top-20 z-30">
          <button 
            onClick={() => setActiveTab('therapists')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 relative overflow-hidden ${
              activeTab === 'therapists' 
                ? 'bg-gradient-to-br from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-900/30' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span>👩‍🦰</span> THERAPISTS <span className="bg-black/20 px-2 py-0.5 rounded-md text-[10px]">{favTherapistList.length}</span>
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('shops')}
            className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 relative overflow-hidden ${
              activeTab === 'shops' 
                ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/30' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span>🏢</span> SHOPS <span className="bg-black/20 px-2 py-0.5 rounded-md text-[10px]">{favShopList.length}</span>
            </span>
          </button>
        </div>

        {/* --- Content Area --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[50vh]">
          
          {/* Therapists Grid */}
          {activeTab === 'therapists' && (
            favTherapistList.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {favTherapistList.map(t => (
                  <Link 
                    key={`${t.shopId}_${t.id}`} 
                    to={`/shops/${t.shopId}/threads/${t.id}`} 
                    className="group relative block bg-slate-900 rounded-2xl overflow-hidden border border-white/5 shadow-xl transition-all duration-300 hover:border-pink-500/50 hover:shadow-pink-900/20 hover:-translate-y-1"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <LazyImage src={t.image_url || t.image} alt={t.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-70 transition"></div>
                      
                      {/* Badge (Age) */}
                      {t.age && (
                        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg">
                          <span className="text-[10px] font-bold text-white">{t.age}歳</span>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 w-full p-4">
                        <h3 className="text-xl font-black text-white leading-tight mb-1 group-hover:text-pink-400 transition">{t.name}</h3>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                          {t.shopName}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState type="therapist" />
            )
          )}

          {/* Shops List */}
          {activeTab === 'shops' && (
            favShopList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favShopList.map(shop => (
                  <Link 
                    key={shop.id} 
                    to={`/search?shop=${encodeURIComponent(shop.name)}`}
                    className="flex items-center gap-5 bg-slate-900/50 p-4 rounded-3xl border border-white/5 hover:border-blue-500/50 hover:bg-slate-900 transition-all duration-300 group shadow-lg"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 shadow-inner">
                      <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">{shop.area}</span>
                      </div>
                      <h3 className="text-lg font-black text-white truncate group-hover:text-blue-400 transition">{getDisplayName(shop.name)}</h3>
                      <p className="text-xs text-slate-500 mt-1 truncate">{shop.access || 'アクセス情報なし'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition">
                      →
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState type="shop" />
            )
          )}

        </div>
      </div>
    </div>
  );
}

// Sub Component: Empty State
function EmptyState({ type }) {
  const isTherapist = type === 'therapist';
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
      <div className="text-6xl mb-6 opacity-50 grayscale">{isTherapist ? '👩' : '🏢'}</div>
      <h3 className="text-xl font-bold text-white mb-2">
        {isTherapist ? '推しメンがまだいません' : 'お気に入り店舗がありません'}
      </h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
        {isTherapist 
          ? '気になるセラピストを見つけて、ハートボタンを押してみましょう。' 
          : 'よく行くお店や、気になるお店をお気に入りに追加してリストを作成しましょう。'}
      </p>
      <Link 
        to={isTherapist ? '/search' : '/'} 
        className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition transform hover:-translate-y-1 ${isTherapist ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-900/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'}`}
      >
        {isTherapist ? 'セラピストを探す' : 'お店を探す'}
      </Link>
    </div>
  );
}
