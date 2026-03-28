import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import { supabase } from '../lib/supabase'; // 🌟 データベース直接通信用
import LazyImage from '../components/LazyImage.jsx';
import Header from '../components/Header.jsx';

const TAG_CATEGORIES = [
  { title: "BODY TYPE", id: "body", tags: ["スレンダー", "グラマー", "巨乳", "美脚", "小柄", "高身長"] },
  { title: "ATMOSPHERE", id: "vibe", tags: ["可愛い系", "美人系", "清楚系", "ギャル系", "お姉さん系"] },
  { title: "AGE GROUP", id: "age", tags: ["10代", "20代前半", "20代後半", "30代", "40代"] },
  { title: "ATTRIBUTES", id: "attr", tags: ["色白", "健康的", "ベテラン", "外国人", "新人"] }
];

const ITEMS_PER_PAGE = 24;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // 🌟 therapists の代わりに「全店舗データ(shops)」だけをもらう
  const { shops, shopById } = useShopData();

  const initialQuery = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  
  const initialTags = searchParams.get('tags') ? searchParams.get('tags').split(',') : [];
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  
  const [isPending, startTransition] = useTransition();

  // 🌟 【新規】Supabaseから取得した結果を入れるハコ
  const [serverTherapists, setServerTherapists] = useState([]);
  const [isFetchingDB, setIsFetchingDB] = useState(true);

  // 入力時の処理（デバウンス）
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedQuery(inputValue);
      });
      const params = {};
      if (inputValue) params.q = inputValue;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');
      setSearchParams(params, { replace: true });
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, selectedTags, setSearchParams]);

  // 🌟 【大改造】キーワードが変わるたびに、Supabaseに直接聞きに行くエンジン！
  useEffect(() => {
    const fetchTherapistsFromDB = async () => {
      setIsFetchingDB(true);
      try {
        let fetchedData = [];

        if (!debouncedQuery.trim()) {
          // 検索ワードがない場合：とりあえず最新のキャスト300人だけ高速取得
          const { data } = await supabase
            .from('therapists')
            .select('id, shop_id, raw_data, image_url, website_url, price_system, business_hours')
            .limit(300);
          fetchedData = data || [];
        } else {
          // 検索ワードがある場合：
          const q = debouncedQuery.toLowerCase();

          // 1. ローカルの「店舗リスト」から、エリアや店名が一致する店舗IDを探し出す
          const matchingShopIds = shops.filter(shop => {
            const sName = (shop.name || '').toLowerCase();
            const sAddr = (shop.address || '').toLowerCase();
            const sArea = (shop.area || '').toLowerCase();
            const sCity = (shop.city || '').toLowerCase();
            return sName.includes(q) || sAddr.includes(q) || sArea.includes(q) || sCity.includes(q);
          }).map(s => s.id);

          // 2. その店舗に所属しているセラピストをDBから取得
          let shopTherapists = [];
          if (matchingShopIds.length > 0) {
            const { data } = await supabase
              .from('therapists')
              .select('id, shop_id, raw_data, image_url, website_url, price_system, business_hours')
              .in('shop_id', matchingShopIds.slice(0, 100)) // 最大100店舗に制限
              .limit(200);
            shopTherapists = data || [];
          }

          // 3. セラピストの「名前」が直接一致する人もDBから取得
          const { data: nameTherapists } = await supabase
            .from('therapists')
            .select('id, shop_id, raw_data, image_url, website_url, price_system, business_hours')
            .ilike('raw_data->>name', `%${q}%`)
            .limit(100);

          // 4. 合体して重複を削除！
          const merged = [...shopTherapists, ...(nameTherapists || [])];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          fetchedData = unique;
        }

        // 画面で使いやすい形にデータを整える
        if (fetchedData) {
          const formatted = fetchedData.map(d => ({
            ...d.raw_data,
            id: d.id,
            shop_id: d.shop_id
          }));
          setServerTherapists(formatted);
        }
      } catch (error) {
        console.error('❌ 検索取得エラー:', error);
      } finally {
        setIsFetchingDB(false);
      }
    };

    if (shops.length > 0) {
      fetchTherapistsFromDB();
    }
  }, [debouncedQuery, shops]);

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [debouncedQuery, selectedTags]);

  // 1. フィルタリング実行 (ローカル処理。DBから持ってきた serverTherapists を対象にする)
  const filteredTherapists = useMemo(() => {
    if (!serverTherapists || serverTherapists.length === 0) return [];

    let results = serverTherapists;

    // A. キーワード検索 (DB結果をさらに厳密に絞る)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      results = results.filter(t => {
        const shop = shopById[t.shop_id];
        const tName = t.name ? t.name.toLowerCase() : '';
        const shopName = shop ? shop.name.toLowerCase() : '';
        const address = shop ? (shop.address || '').toLowerCase() : '';
        const access = shop ? (shop.access || '').toLowerCase() : '';
        const area = shop ? (shop.area || '').toLowerCase() : '';
        const city = shop ? (shop.city || '').toLowerCase() : '';
        
        return tName.includes(q) || shopName.includes(q) || address.includes(q) || access.includes(q) || area.includes(q) || city.includes(q);
      });
    }

    // B. タグ検索
    if (selectedTags.length > 0) {
      results = results.filter(t => {
        const tTags = t.types || t.tags || [];
        let ageTag = "";
        if (t.age) {
           const a = +t.age;
           if (a < 20) ageTag = "10代";
           else if (a < 25) ageTag = "20代前半";
           else if (a < 30) ageTag = "20代後半";
           else if (a < 40) ageTag = "30代";
           else ageTag = "40代";
        }
        return selectedTags.every(selTag => tTags.includes(selTag) || selTag === ageTag);
      });
    }

    return results;
  }, [serverTherapists, debouncedQuery, selectedTags, shopById]);

  // 2. 表示用データ
  const visibleTherapists = useMemo(() => {
    return filteredTherapists.slice(0, displayCount);
  }, [filteredTherapists, displayCount]);

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const toggleTag = (tag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
  };

  // タグ件数カウント
  const tagCounts = useMemo(() => {
    const counts = {};
    TAG_CATEGORIES.forEach(cat => cat.tags.forEach(t => counts[t] = 0));
    
    for (const t of filteredTherapists) {
      const tTags = t.types || t.tags || [];
      for (const tag of tTags) {
        if (counts[tag] !== undefined) counts[tag]++;
      }
      if (t.age) {
        const a = +t.age;
        if (a < 20 && counts["10代"] !== undefined) counts["10代"]++;
        else if (a < 25 && counts["20代前半"] !== undefined) counts["20代前半"]++;
        else if (a < 30 && counts["20代後半"] !== undefined) counts["20代後半"]++;
        else if (a < 40 && counts["30代"] !== undefined) counts["30代"]++;
        else if (counts["40代"] !== undefined) counts["40代"]++;
      }
    }
    return counts;
  }, [filteredTherapists]);

  // ローディング中はどちらかがTrueならスピナーを回す
  const isLoading = isPending || isFetchingDB;

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <Header />
      
      {/* 🔍 Sticky Search Bar */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-900/40">
                 {isLoading ? (
                   <span className="animate-spin text-xl">⏳</span>
                 ) : (
                   <span className="text-xl">🔍</span>
                 )}
               </div>
               
               {/* ⌨️ Search Input */}
               <div className="flex-grow relative">
                 <input 
                   type="text"
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   placeholder="エリア、店名、セラピスト名で検索..."
                   className="w-full bg-slate-900/50 border border-white/10 rounded-full px-5 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-inner"
                 />
                 {inputValue && (
                   <button 
                     onClick={() => { setInputValue(''); setDebouncedQuery(''); }}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-slate-800 rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                   >
                     ✕
                   </button>
                 )}
               </div>

               {/* Filter Toggle (Mobile) */}
               <button 
                 onClick={() => setIsFilterOpen(!isFilterOpen)}
                 className={`lg:hidden px-4 py-2 rounded-full text-xs font-bold border transition ${isFilterOpen ? 'bg-white text-slate-900 border-white' : 'bg-white/10 text-white border-white/10'}`}
               >
                 FILTER {selectedTags.length > 0 && `(${selectedTags.length})`}
               </button>
            </div>

            {/* Status Line */}
            <div className="flex justify-between items-end px-1">
               <div className="min-w-0">
                 <h1 className="text-xs font-bold text-slate-400 truncate">
                   {debouncedQuery ? `Results for "${debouncedQuery}"` : 'ALL CASTS'}
                 </h1>
                 <p className="text-[10px] text-pink-400 font-bold truncate">
                   {isLoading ? 'Searching Database...' : `${filteredTherapists.length.toLocaleString()} results found`}
                 </p>
               </div>
            </div>
          </div>

          {/* Active Tags */}
          {selectedTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mt-4 hide-scrollbar snap-x">
              {selectedTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="snap-start flex-shrink-0 bg-pink-600 text-white pl-3 pr-2 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-pink-500 transition shadow-lg shadow-pink-900/30"
                >
                  {tag}
                  <span className="bg-black/20 rounded-full w-4 h-4 flex items-center justify-center">✕</span>
                </button>
              ))}
              <button 
                onClick={() => { setSelectedTags([]); setInputValue(''); setDebouncedQuery(''); }}
                className="snap-start flex-shrink-0 text-[10px] text-slate-500 hover:text-white underline px-2 font-bold"
              >
                CLEAR
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[280px_1fr] gap-8 items-start">
        
        {/* 👈 Left Column: Filter Sidebar */}
        <aside className={`lg:block space-y-8 ${isFilterOpen ? 'block' : 'hidden'} lg:sticky lg:top-36`}>
          {TAG_CATEGORIES.map((category) => (
             <div key={category.id} className="bg-slate-900/40 backdrop-blur rounded-3xl p-6 border border-white/5 shadow-xl">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                 {category.title}
               </h3>
               <div className="flex flex-wrap gap-2">
                 {category.tags.map(tag => {
                   const count = tagCounts[tag] || 0;
                   const isSelected = selectedTags.includes(tag);
                   return (
                     <button
                       key={tag}
                       onClick={() => count > 0 && toggleTag(tag)}
                       disabled={count === 0 && !isSelected}
                       className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                         isSelected 
                           ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-600/20' 
                           : count === 0 
                             ? 'bg-transparent border-slate-800 text-slate-700 cursor-not-allowed' 
                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white hover:border-slate-500'
                       }`}
                     >
                       {tag} <span className="opacity-50 ml-0.5">({count})</span>
                     </button>
                   );
                 })}
               </div>
             </div>
          ))}
        </aside>

        {/* 👉 Right Column: Results Grid */}
        <main className="min-h-[50vh]">
          <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
            {visibleTherapists.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {visibleTherapists.map((t, idx) => {
                    const shop = shopById[t.shop_id];
                    return (
                      <Link 
                        key={t.id} 
                        to={`/shops/${t.shop_id}/threads/${t.id}`}
                        className="group relative block bg-slate-900 rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-900/20 hover:-translate-y-1"
                      >
                        <div className="aspect-[3/4] overflow-hidden relative">
                          <LazyImage src={t.image_url || t.image} alt={t.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90 group-hover:opacity-60 transition duration-500"></div>
                          
                          <div className="absolute bottom-0 left-0 w-full p-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 group-hover:bg-white/10 transition duration-300">
                               <div className="flex items-center gap-1.5 mb-1.5">
                                   {t.age && <span className="bg-black/40 px-1.5 py-0.5 rounded text-[9px] font-bold text-white border border-white/10">{t.age}歳</span>}
                                   {t.T && <span className="bg-black/40 px-1.5 py-0.5 rounded text-[9px] font-bold text-white border border-white/10">T{t.T}</span>}
                               </div>
                               <h3 className="text-white font-black text-lg leading-tight truncate mb-0.5">{t.name}</h3>
                               
                               {/* ★エリア名表示 */}
                               <p className="text-[10px] text-slate-300 font-bold truncate flex items-center gap-1 mt-1">
                                 <span className="text-pink-500">📍</span> 
                                 {shop ? (shop.area || shop.city) : ''} 
                                 <span className="opacity-50 mx-1">|</span>
                                 {shop ? shop.name : ''}
                               </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {visibleTherapists.length < filteredTherapists.length && (
                  <div className="mt-12 text-center">
                    <button 
                      onClick={handleLoadMore}
                      className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-700 transition active:scale-95 shadow-lg border border-white/10"
                    >
                      Load More ({filteredTherapists.length - visibleTherapists.length} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              !isLoading && (
                <div className="py-20 text-center animate-in fade-in duration-700">
                   <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                     <span className="text-4xl opacity-50">🕵️</span>
                   </div>
                   <h3 className="text-2xl font-black text-white mb-2">No Matches Found</h3>
                   <p className="text-slate-400 text-sm mb-8">お探しの条件に一致するキャストは見つかりませんでした。</p>
                   <button onClick={() => {setSelectedTags([]); setInputValue(''); setDebouncedQuery('');}} className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm hover:bg-slate-200 transition">
                     条件をクリアする
                   </button>
                </div>
              )
            )}
          </div>
        </main>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
