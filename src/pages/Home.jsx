import ShibuyaCards from "../components/ShibuyaCards.jsx";

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import SearchBar from '../components/SearchBar.jsx';
import TopHeroSlider from '../components/TopHeroSlider.jsx';
import RankingSection from '../components/RankingSection.jsx';
import RecentlyViewed from '../components/RecentlyViewed.jsx';
import LazyImage from '../components/LazyImage.jsx';
import Header from '../components/Header.jsx';
import PrefectureSelector from '../components/PrefectureSelector.jsx';

// エリア名に対応する画像の定義
const AREA_IMAGES = {
  // --- 東京エリア ---
  '恵比寿': 'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?q=80&w=2006&auto=format&fit=crop',
  '歌舞伎町': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1994&auto=format&fit=crop',
  '新宿': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1994&auto=format&fit=crop',
  '池袋': 'https://images.unsplash.com/photo-1626507306233-14e9f7831ca6?q=80&w=2070&auto=format&fit=crop',
  '五反田': 'https://images.unsplash.com/photo-1554797589-7241bb691973?q=80&w=1936&auto=format&fit=crop',
  '吉原': 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=2036&auto=format&fit=crop',
  '上野': 'https://images.unsplash.com/photo-1590559599520-2c70094776e0?q=80&w=2070&auto=format&fit=crop',
  '錦糸町': 'https://images.unsplash.com/photo-1588764062142-32c0276634b0?q=80&w=2000&auto=format&fit=crop',
  '六本木': 'https://images.unsplash.com/photo-1634304620573-22872390a184?q=80&w=2000&auto=format&fit=crop',
  '赤坂': 'https://images.unsplash.com/photo-1552560880-2c763d3f29b6?q=80&w=2000&auto=format&fit=crop',
  '銀座': 'https://images.unsplash.com/photo-1572979244073-63c2677d2425?q=80&w=2000&auto=format&fit=crop',
  '日本橋': 'https://images.unsplash.com/photo-1572979244073-63c2677d2425?q=80&w=2000&auto=format&fit=crop', // 銀座・東京駅周辺イメージ
  '秋葉原': 'https://images.unsplash.com/photo-1616763355548-1b606f439f86?q=80&w=2000&auto=format&fit=crop',
  
  // --- 大阪エリア ---
  '梅田': 'https://images.unsplash.com/photo-1590559599520-2c70094776e0?q=80&w=2070&auto=format&fit=crop',
  '難波': 'https://images.unsplash.com/photo-1590559599520-2c70094776e0?q=80&w=2070&auto=format&fit=crop',
  '堺筋本町': 'https://images.unsplash.com/photo-1590559599520-2c70094776e0?q=80&w=2070&auto=format&fit=crop', // 大阪オフィス街
  '谷町九丁目': 'https://images.unsplash.com/photo-1590559599520-2c70094776e0?q=80&w=2070&auto=format&fit=crop',
  '新大阪': 'https://images.unsplash.com/photo-1590559599520-2c70094776e0?q=80&w=2070&auto=format&fit=crop',

  // --- その他主要都市 ---
  '中洲': 'https://images.unsplash.com/photo-1617439343362-e621118ee66d?q=80&w=2000&auto=format&fit=crop',
  'すすきの': 'https://images.unsplash.com/photo-1599557458156-a115b9c0d604?q=80&w=2000&auto=format&fit=crop',
  '横浜': 'https://images.unsplash.com/photo-1574786358485-6bc01127027b?q=80&w=2070&auto=format&fit=crop',
  '川崎': 'https://images.unsplash.com/photo-1605218427368-35b08968e279?q=80&w=2000&auto=format&fit=crop',
  
  // デフォルト
  'DEFAULT': 'https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=2000&auto=format&fit=crop',
};

// 順位ごとの表示スタイル
const RANK_STYLES = [
  { size: 'col-span-2 row-span-2', color: 'from-purple-600 to-indigo-900', tag: '👑 店舗数No.1' }, // 1位
  { size: 'col-span-1 row-span-1', color: 'from-pink-600 to-rose-900', tag: '🥈 No.2' },       // 2位
  { size: 'col-span-1 row-span-1', color: 'from-blue-600 to-cyan-900', tag: '🥉 No.3' },        // 3位
  { size: 'col-span-1 row-span-2', color: 'from-emerald-600 to-teal-900', tag: '✨ 人気' },      // 4位
  { size: 'col-span-1 row-span-1', color: 'from-red-600 to-orange-900', tag: '🔥 注目' },        // 5位
];

export default function HomePage() {
  const { shops, loading } = useShopData();

  // ★自動集計ロジック (詳細エリア優先)
  const topAreas = useMemo(() => {
    if (!shops || shops.length === 0) return [];

    const counts = {};
    shops.forEach(shop => {
      // エリア(area)があればそれをキーにする。なければ市区町村(city)を使う。
      const key = shop.area || shop.city; 
      
      // 無効な文字列を除外
      if (key && key !== "エリア指定なし" && key !== "指定なし") {
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    // 多い順にソートしてトップ5を抽出
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count], index) => {
        const style = RANK_STYLES[index] || RANK_STYLES[1];
        return {
          name,
          sub: `${count} 店舗`,
          tags: [style.tag],
          size: style.size,
          color: style.color,
          // 画像マッピング
          image: AREA_IMAGES[name] || AREA_IMAGES[name.replace("区", "")] || AREA_IMAGES['DEFAULT']
        };
      });
  }, [shops]);

  const recommendedShops = shops ? shops.slice(0, 8) : [];

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-950 pb-32 overflow-x-hidden font-sans text-slate-200">
      <Header />
      
      {/* 1. ヒーローセクション */}
      <div className="relative">
        <TopHeroSlider />
        <div className="relative z-30 -mt-24 px-4 max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
                極上の癒やしを、あなたに。
              </h2>
              <p className="text-slate-300 text-xs md:text-sm font-bold opacity-80">
                洗練された大人のための、最高級メンズエステ検索
              </p>
            </div>
            <SearchBar />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-20 space-y-24">

        {/* 2. エリアから探す */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              エリアから探す
            </h3>
          </div>
          <PrefectureSelector />
        </section>

        {/* 3. 人気エリアランキング (詳細エリア優先) */}
        <section>
          <div className="flex items-end justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <span className="text-3xl">🏙️</span> 人気エリア
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-bold">店舗数ランキング</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px]">
            {topAreas.map((area) => (
              <Link 
                key={area.name} 
                to={`/shops?q=${area.name}`}
                className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:z-10 hover:scale-[1.02] ${area.size}`}
              >
                <div className="absolute inset-0 w-full h-full">
                  <LazyImage src={area.image_url || area.image} alt={area.name} className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" />
                </div>
                
                <div className={`absolute inset-0 bg-gradient-to-br ${area.color} mix-blend-multiply opacity-60 group-hover:opacity-40 transition duration-500`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>

                <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                    <div className="flex flex-wrap gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                      {area.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold bg-white/20 backdrop-blur px-2 py-0.5 rounded text-white border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white leading-none tracking-tight mb-1">
                      {area.name}
                    </h2>
                    <p className="text-xs md:text-sm font-bold text-slate-300 group-hover:text-white transition">
                      {area.sub}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. 新着店舗 */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                <span className="text-2xl">✨</span> 新着店舗
              </h3>
              <Link to="/shops" className="text-xs text-slate-500 font-bold hover:text-white transition">もっと見る</Link>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-8 -mx-4 px-4 snap-x hide-scrollbar">
            {recommendedShops.map((shop) => (
              <Link 
                key={shop.id} 
                to={`/shops/${shop.id}`}
                className="snap-center flex-shrink-0 w-[160px] md:w-[240px] group"
              >
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 relative shadow-lg mb-3 bg-slate-900">
                  <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                  
                  <div className="absolute top-2 left-2">
                    <span className="bg-pink-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">NEW</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-white font-black text-sm md:text-lg leading-tight truncate w-full drop-shadow-md">{shop.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{shop.prefecture || '東京'} {shop.city}</p>
                  </div>
                </div>
              </Link>
            ))}
             <Link to="/shops" className="snap-center flex-shrink-0 w-[120px] flex items-center justify-center border border-dashed border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 transition group aspect-[3/4]">
                <div className="text-center">
                  <span className="block text-2xl mb-2 group-hover:translate-x-1 transition">→</span>
                  <span className="text-xs font-bold text-slate-400">すべて見る</span>
                </div>
             </Link>
          </div>
        </section>

        {/* ★復旧した渋谷の店舗カード一覧 */}
        <section className="mb-12">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 shadow-2xl">
            <ShibuyaCards />
          </div>
        </section>

        {/* 5. ランキングセクション & 6. 履歴 */}
        <RankingSection />
        <RecentlyViewed />
        
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
