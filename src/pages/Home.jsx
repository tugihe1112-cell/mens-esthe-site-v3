
import React, { useMemo, useState, useEffect } from 'react';
import { getDisplayName } from '../utils/shopHelpers';
import { Link } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import SearchBar from '../components/SearchBar.jsx';
import TopHeroSlider from '../components/TopHeroSlider.jsx';
import RankingSection from '../components/RankingSection.jsx';
import RecentlyViewed from '../components/RecentlyViewed.jsx';
import LazyImage from '../components/LazyImage.jsx';
import Header from '../components/Header.jsx';
import PrefectureSelector from '../components/PrefectureSelector.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { supabase } from '../lib/supabase';
import { TherapistGridSkeleton, ShopGridSkeleton } from '../components/ui/Skeleton.jsx';

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
  const [featuredTherapists, setFeaturedTherapists] = useState([]);

  // 注目セラピスト取得（店舗分散・地域分散ロジック）
  useEffect(() => {
    if (!shops || shops.length === 0) return;
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('therapists')
          .select('id, name, image_url, shop_id')
          .not('image_url', 'is', null)
          .not('image_url', 'like', '%spacer%')
          .not('image_url', 'like', '%noimage%')
          .not('image_url', 'like', '%no_image%')
          .limit(300);
        if (error || !data) return;

        // 店舗マップ
        const shopMap = Object.fromEntries(shops.map(s => [s.id, s]));

        // 店舗ごとにグループ化 → 各店舗から最大2名ランダム選出
        const byShop = {};
        for (const t of data) {
          if (!byShop[t.shop_id]) byShop[t.shop_id] = [];
          byShop[t.shop_id].push(t);
        }
        const pool = [];
        for (const [shopId, therapists] of Object.entries(byShop)) {
          const shop = shopMap[shopId];
          const pref = shop?.prefecture || shop?.city || 'その他';
          const shuffled = [...therapists].sort(() => 0.5 - Math.random());
          pool.push(...shuffled.slice(0, 2).map(t => ({ ...t, _pref: pref })));
        }

        // 都道府県ごとにグループ化してラウンドロビン抽出（地域分散）
        const byPref = {};
        for (const t of pool) {
          if (!byPref[t._pref]) byPref[t._pref] = [];
          byPref[t._pref].push(t);
        }
        const prefArrays = Object.values(byPref).map(arr => [...arr].sort(() => 0.5 - Math.random()));
        const result = [];
        let round = 0;
        while (result.length < 20) {
          let added = false;
          for (const arr of prefArrays) {
            if (arr[round]) {
              result.push(arr[round]);
              added = true;
              if (result.length >= 20) break;
            }
          }
          round++;
          if (!added) break;
        }

        setFeaturedTherapists(result.slice(0, 20));
      } catch (e) {
        console.error(e);
      }
    };
    fetchFeatured();
  }, [shops]);

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

  const recommendedShops = shops
    ? [...shops].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 8)
    : [];

  // サイドバー用: image_urlがある店舗からランダム6件（マウント時固定）
  const sidebarShops = useMemo(() => {
    if (!shops || shops.length === 0) return [];
    return [...shops]
      .filter(s => s.image_url)
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
  }, [shops]);

  return (
    <div className="min-h-screen bg-slate-950 pb-28 md:pb-16 overflow-x-hidden font-sans text-slate-200">
      <SeoHead
        title="メンズエステ検索・口コミ"
        description="全国のメンズエステ店舗・セラピストを検索できるポータルサイト。口コミ・料金・出勤情報を掲載。"
        path="/"
      />
      <Header />
      
      {/* 1. ヒーローセクション */}
      <div className="relative">
        <TopHeroSlider />
        {/* 検索カードをスライダーに食い込ませて常にファーストビュー内に */}
        <div className="relative z-30 -mt-2 md:mt-6 px-3 md:px-4 max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-4 md:p-10 rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-3 md:mb-6">
              <h2 className="text-xl md:text-3xl font-black text-white mb-1 md:mb-2 drop-shadow-lg tracking-tight">
                店舗・セラピスト名で口コミ検索
              </h2>
              <p className="text-slate-300 text-xs md:text-sm font-bold opacity-80 hidden md:block">
                全国のメンズエステを地域・キャスト名・店舗名から探せます
              </p>
            </div>
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Write-to-Read 帯 */}
      <div className="mx-4 mt-6 max-w-4xl lg:mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/80 to-pink-900/60 border border-purple-500/30 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(168,85,247,0.15),transparent_60%)] pointer-events-none" />
          <div className="relative text-center sm:text-left">
            <p className="text-white font-black text-base md:text-lg leading-tight">
              口コミを投稿すると、みんなの口コミが読み放題になります
            </p>
            <p className="text-purple-300 text-xs mt-1">
              詳しい体験談（700文字以上）を書くと管理者が審査・閲覧日数を付与
            </p>
          </div>
          <Link
            to="/post-review"
            className="relative shrink-0 bg-white text-purple-900 font-black px-6 py-2.5 rounded-xl text-sm hover:bg-purple-50 transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap"
          >
            口コミを書く →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16">
      <div className="flex flex-col lg:flex-row gap-10">

      {/* ===== メインカラム ===== */}
      <div className="flex-1 min-w-0 space-y-24">

        {/* 1.5. 主要機能ショートカット */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '🔍', title: 'キャスト検索', desc: '名前・店舗・エリアで絞り込み検索', link: '/search' },
              { icon: '✍️', title: '口コミを書く', desc: '体験談を投稿して閲覧権を獲得', link: '/post-review' },
              { icon: '📋', title: '掲示板', desc: 'ユーザー同士で情報交換', link: '/board' },
              { icon: '🏆', title: 'ランキング', desc: '口コミ評価が高いセラピスト', link: '/ranking' },
            ].map(f => (
              <Link key={f.title} to={f.link}
                className="group rounded-2xl bg-slate-900/60 border border-white/5 hover:border-pink-500/30 p-4 transition-all duration-200 hover:-translate-y-0.5">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h4 className="text-white font-black text-sm">{f.title}</h4>
                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{f.desc}</p>
                <span className="text-pink-400 text-[11px] font-bold mt-2 block group-hover:translate-x-1 transition-transform">使ってみる →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 2. エリアから探す */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              エリアから探す
            </h3>
          </div>
          <PrefectureSelector shops={shops} />
        </section>

        {/* 3. 人気エリアランキング (詳細エリア優先) */}
        <section>
          <div className="flex items-end justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                人気エリア
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

        {/* 新人セラピスト・注目口コミ・掲示板 バナー */}
        <section className="px-2 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <Link to="/new-therapists" className="group relative rounded-2xl overflow-hidden border border-pink-500/20 bg-gradient-to-br from-pink-900/40 to-slate-900 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-1 p-4 flex flex-col justify-between min-h-[90px]">
              <div>
                <span className="text-xl">✨</span>
                <h3 className="text-sm font-black text-white mt-1">新人キャスト</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">新しく登録されたキャスト</p>
              </div>
              <span className="text-pink-400 text-xs font-bold group-hover:translate-x-1 transition-transform">一覧を見る →</span>
            </Link>
            <Link to="/popular-reviews" className="group relative rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-slate-900 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 p-4 flex flex-col justify-between min-h-[90px]">
              <div>
                <span className="text-xl">💬</span>
                <h3 className="text-sm font-black text-white mt-1">みんなの口コミ</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">注目の体験レポート</p>
              </div>
              <span className="text-purple-400 text-xs font-bold group-hover:translate-x-1 transition-transform">口コミを見る →</span>
            </Link>
            <Link to="/board" className="group relative rounded-2xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-900/40 to-slate-900 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 p-4 flex flex-col justify-between min-h-[90px]">
              <div>
                <span className="text-xl">📋</span>
                <h3 className="text-sm font-black text-white mt-1">掲示板</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">自由に質問・情報交換</p>
              </div>
              <span className="text-blue-400 text-xs font-bold group-hover:translate-x-1 transition-transform">掲示板へ →</span>
            </Link>
          </div>
        </section>

        {/* 3.5. 注目セラピスト */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <span className="text-2xl">💃</span> 注目セラピスト
            </h3>
            <Link to="/search" className="text-xs text-slate-500 font-bold hover:text-white transition">もっと見る</Link>
          </div>
          {loading || featuredTherapists.length === 0 ? (
            /* スケルトン: 横スクロール */
            <div className="flex gap-4 pb-4 -mx-4 px-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[120px] md:w-[150px]">
                  <div className="aspect-[3/4] rounded-2xl bg-slate-800 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x hide-scrollbar">
              {featuredTherapists.map((t) => {
                const shop = shops.find(s => s.id === t.shop_id);
                return (
                  <Link
                    key={t.id}
                    to={shop ? `/search?shop=${encodeURIComponent(shop.name)}&cast=${encodeURIComponent(t.name)}` : '/search'}
                    className="snap-center flex-shrink-0 w-[120px] md:w-[150px] group"
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden relative bg-slate-900">
                      <img
                        src={t.image_url}
                        alt={t.name}
                        className="w-full h-full object-cover object-top transition duration-700 group-hover:scale-110"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white font-black text-xs leading-tight [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] truncate">{t.name}</p>
                        {shop && <p className="text-pink-300 text-[9px] truncate mt-0.5">{getDisplayName(shop.name)}</p>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. 新着店舗 */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                <span className="text-2xl">✨</span> 新着店舗
              </h3>
              <Link to="/shops" className="text-xs text-slate-500 font-bold hover:text-white transition">もっと見る</Link>
          </div>

          {loading ? (
            /* スケルトン: 横スクロール */
            <div className="flex gap-4 pb-8 -mx-4 px-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[160px] md:w-[240px]">
                  <div className="aspect-[3/4] rounded-t-2xl bg-slate-800 animate-pulse" />
                  <div className="bg-slate-900 rounded-b-2xl p-3 space-y-2">
                    <div className="h-3 bg-slate-800 animate-pulse rounded-full w-3/4" />
                    <div className="h-2 bg-slate-800 animate-pulse rounded-full w-1/2 opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="flex overflow-x-auto gap-4 pb-8 -mx-4 px-4 snap-x hide-scrollbar">
            {recommendedShops.map((shop) => (
              <Link
                key={shop.id}
                to={`/search?shop=${encodeURIComponent(shop.name)}`}
                className="snap-center flex-shrink-0 w-[160px] md:w-[240px] group"
              >
                <div className="aspect-[3/4] rounded-t-2xl overflow-hidden relative bg-slate-900">
                  <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute top-2 left-2">
                    <span className="bg-pink-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">NEW</span>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-b-2xl px-3 py-2.5 border-t border-white/5">
                  <h4 className="text-white font-black text-sm leading-tight truncate">{getDisplayName(shop.name)}</h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{shop.prefecture || '東京'} {shop.city}</p>
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
          )}
        </section>

{/* 5. ランキングセクション & 6. 履歴 */}
        <RankingSection />
        <RecentlyViewed />

      </div>{/* /メインカラム */}

      {/* ===== サイドバー（PC only） ===== */}
      <aside className="hidden lg:block w-[280px] xl:w-[320px] flex-shrink-0 space-y-8">

        {/* 注目店舗バナー */}
        <div className="sticky top-4 space-y-8">
          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 px-1">注目店舗</h4>
            <div className="space-y-3">
              {sidebarShops.map(shop => (
                  <Link
                    key={shop.id}
                    to={`/search?shop=${encodeURIComponent(shop.name)}`}
                    className="group flex items-center gap-3 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-pink-500/20 rounded-2xl p-3 transition-all duration-200"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                      <img
                        src={shop.image_url}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-xs leading-tight truncate">{getDisplayName(shop.name)}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5 truncate">{shop.prefecture} {shop.city}</p>
                      <span className="text-pink-400 text-[10px] font-bold mt-1 block group-hover:translate-x-0.5 transition-transform">詳しく見る →</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>

          {/* 口コミ投稿バナー */}
          <Link
            to="/post-review"
            className="block rounded-2xl bg-gradient-to-br from-purple-900/60 to-slate-900 border border-purple-500/20 hover:border-purple-500/50 p-5 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="text-2xl mb-2">✍️</div>
            <h4 className="text-white font-black text-sm leading-tight">口コミを書いて<br />閲覧権限をゲット</h4>
            <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">700文字以上の体験談を投稿すると、管理者が審査してみんなの口コミが読める日数を付与します。</p>
            <span className="block mt-3 text-purple-300 text-xs font-black">口コミを投稿する →</span>
          </Link>

          {/* 新着口コミへのリンク */}
          <Link
            to="/popular-reviews"
            className="block rounded-2xl bg-gradient-to-br from-pink-900/40 to-slate-900 border border-pink-500/20 hover:border-pink-500/50 p-5 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="text-2xl mb-2">💬</div>
            <h4 className="text-white font-black text-sm">みんなの口コミ</h4>
            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">ユーザーの生の体験談をチェック</p>
            <span className="block mt-3 text-pink-300 text-xs font-black">口コミを見る →</span>
          </Link>

          {/* 掲示板 */}
          <Link
            to="/board"
            className="block rounded-2xl bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/20 hover:border-blue-500/50 p-5 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="text-2xl mb-2">📋</div>
            <h4 className="text-white font-black text-sm">掲示板</h4>
            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">情報交換・おすすめ・質問など</p>
            <span className="block mt-3 text-blue-300 text-xs font-black">掲示板を見る →</span>
          </Link>
        </div>
      </aside>

      </div>{/* /flex row */}
      </div>{/* /max-w-7xl */}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
