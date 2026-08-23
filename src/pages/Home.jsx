
import React, { useMemo, useState, useEffect } from 'react';
import Head from 'next/head';
import { getDisplayName } from '../utils/shopHelpers';
import { optimizeImageUrl } from '../utils/imageUrl';
import { Link } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import SearchBar from '../components/SearchBar.jsx';
import TopHeroSlider from '../components/TopHeroSlider.jsx';
import RankingSection from '../components/RankingSection.jsx';
import RecentlyViewed from '../components/RecentlyViewed.jsx';
import LazyImage from '../components/LazyImage.jsx';
import HomeReviewCard from '../components/HomeReviewCard.jsx';
import { trackEvent } from '../utils/analytics';
import Header from '../components/Header.jsx';
import PrefectureSelector from '../components/PrefectureSelector.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { supabase } from '../lib/supabase';
import { TherapistGridSkeleton, ShopGridSkeleton } from '../components/ui/Skeleton.jsx';
import siteStats from '../data/stats-latest.json';

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

export default function HomePage({ initialHero = [], reviewsByPref = [], liveCounts = null }) {
  const { shops, loading } = useShopData();
  const displayedCounts = {
    totalShops: liveCounts?.totalShops ?? siteStats.coverage?.totalShops ?? 0,
    totalTherapists: liveCounts?.totalTherapists ?? siteStats.coverage?.totalTherapists ?? 0,
  };
  const [featuredTherapists, setFeaturedTherapists] = useState([]);
  const leadReview = useMemo(() => reviewsByPref
    .flatMap((block) => block.reviews || [])
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null, [reviewsByPref]);

  // ── 都道府県ブロック: SSR初期HTMLは全ユーザー共通。マウント後にlocalStorageの好みで一致県を先頭へ（UIなしの自動並べ替え） ──
  const [orderedPrefs, setOrderedPrefs] = useState(reviewsByPref);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    setOrderedPrefs(reviewsByPref);
    try {
      const saved = localStorage.getItem('preferredReviewPref');
      if (!saved) return;
      const idx = reviewsByPref.findIndex((b) => b.pref === saved);
      if (idx > 0) {
        // 一度クリックした県を先頭に移動（transition-opacityでフェード＝CLSを出さない）
        setReordering(true);
        setOrderedPrefs([reviewsByPref[idx], ...reviewsByPref.filter((_, i) => i !== idx)]);
        setTimeout(() => setReordering(false), 60);
      }
    } catch {}
  }, [reviewsByPref]);

  // 注目セラピスト取得（店舗分散・地域分散ロジック）
  useEffect(() => {
    if (!shops || shops.length === 0) return;
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('therapists')
          .select('id, name, image_url, shop_id')
          .not('image_url', 'is', null)
          .neq('image_url', '')
          .or('is_active.is.null,is_active.eq.true')
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

        // 同一人物の重複排除（グループ店舗に同名で多重登録されているため名前で一意化）
        const seenNames = new Set();
        const uniquePool = [];
        for (const t of pool) {
          const key = (t.name || '').replace(/[\s　]/g, '');
          if (!key || seenNames.has(key)) continue;
          seenNames.add(key);
          uniquePool.push(t);
        }

        // 都道府県ごとにグループ化してラウンドロビン抽出（地域分散）
        const byPref = {};
        for (const t of uniquePool) {
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

  // 新着店舗: ブランド（group_id / 店名ベース）で重複排除して1ブランド1枠
  const recommendedShops = useMemo(() => {
    if (!shops || shops.length === 0) return [];
    const sorted = [...shops].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const seen = new Set();
    const out = [];
    for (const s of sorted) {
      const brandKey = (s.group_id && !String(s.group_id).startsWith('g_solo'))
        ? s.group_id
        : (s.name || '').replace(/[（(].*?[)）]/g, '').replace(/[\s　]/g, '').toLowerCase();
      if (!brandKey || seen.has(brandKey)) continue;
      seen.add(brandKey);
      out.push(s);
      if (out.length >= 8) break;
    }
    return out;
  }, [shops]);

  // サイドバー用: image_urlがある店舗からランダム6件（マウント時固定）
  const sidebarShops = useMemo(() => {
    if (!shops || shops.length === 0) return [];
    return [...shops]
      .filter(s => s.image_url)
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
  }, [shops]);

  return (
    // ⚠️ pb-28 だった名残に注意（2026-08-17 修正）:
    //    BottomNav ぶんの余白は Footer 側の pb-20 md:pb-0 が既に持っているのに、
    //    ここでも 112px 取っていたため、最後のセクションとフッターの間に
    //    112 + Footer の mt-80 = 約200px の説明のつかない黒い空白ができていた。
    // ⚠️ overflow-x-hidden → **clip** に変更（2026-08-17）。
    //    hidden はこのdivをスクロールコンテナにするため、中にある
    //    サイドバーの `sticky top-4` がビューポート基準で効かなくなっていた。
    <div className="min-h-screen bg-slate-950 pb-6 md:pb-10 overflow-x-clip font-sans text-slate-200">
      <SeoHead
        title="メンズエステ検索・口コミ"
        description={`メンエスマップは全国${Number(displayedCounts.totalShops).toLocaleString()}店舗・在籍${Number(displayedCounts.totalTherapists).toLocaleString()}人のメンズエステを掲載。セラピスト別の口コミ・出勤スケジュール・料金を検索できるポータルサイトです。掲載店舗から広告費・掲載料は一切受け取っていません。`}
        path="/"
      />
      {/* LCP対策: 先頭ヒーロー画像を最優先で先読み（初期HTMLのheadに埋め込む） */}
      {initialHero?.[0]?.heroImage && (
        <Head>
          <link rel="preload" as="image" href={initialHero[0].heroImage} fetchPriority="high" />
        </Head>
      )}
      <Header />
      <h1 className="sr-only">全国のメンズエステ店舗・セラピスト検索と口コミ</h1>
      
      {/* 1. ヒーローセクション */}
      <div className="relative">
        <TopHeroSlider initialHero={initialHero} />
        {/* 検索カードをスライダーに食い込ませて常にファーストビュー内に */}
        <div className="relative z-30 -mt-2 md:mt-6 px-3 md:px-4 max-w-4xl mx-auto">
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

      <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="flex flex-col lg:flex-row gap-10">

      {/* ===== メインカラム ===== */}
      <div className="flex-1 min-w-0 space-y-24">

        {/* 検索直後に最新の実体験を1件提示。その後に中立性と地域別口コミを続ける。 */}
        {reviewsByPref.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5 px-2">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">最新の実体験口コミ</h3>
                <p className="mt-1 text-xs font-medium text-slate-400">来店情報と評価を確認してから本文を読めます</p>
              </div>
              <Link to="/popular-reviews" className="text-xs font-bold text-pink-400 hover:text-pink-300 transition py-3 -my-3 pl-3">もっと見る →</Link>
            </div>

            {leadReview && (
              <HomeReviewCard r={leadReview} variant="hero" position="latest_lead" pref={leadReview.prefecture} />
            )}

            {/* 中立宣言と母数。口コミを一度見せた直後に信頼の根拠を補う。 */}
            <div className="my-6 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-xs font-medium leading-relaxed text-slate-400">
              <span className="font-bold text-slate-200">掲載店舗から広告費・掲載料を受け取っていません。</span>
              <span className="ml-1">辛口の評価もそのまま掲載。</span>
              <span className="ml-2 text-slate-300">掲載 {Number(displayedCounts.totalShops).toLocaleString()}店舗／在籍 {Number(displayedCounts.totalTherapists).toLocaleString()}人</span>
              <Link to="/stats" className="ml-2 inline-flex min-h-11 items-center font-bold text-pink-400 hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">集計を見る →</Link>
            </div>

            {/* 並べ替え（好みの県を先頭へ）はフェードでCLSを抑制 */}
            <div className={`space-y-10 transition-opacity duration-300 ${reordering ? 'opacity-50' : 'opacity-100'}`}>
              {orderedPrefs.map((block) => {
                const blockReviews = block.reviews.filter((review) => review.id !== leadReview?.id);
                if (blockReviews.length === 0) return null;
                return (
                  <div key={block.pref}>
                    {/* 県見出し行 */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h4 className="text-lg font-black text-white">📍 {block.pref}の口コミ</h4>
                      <Link
                        to={block.slug ? `/area/${block.slug}` : '/popular-reviews'}
                        onClick={() => trackEvent('click_pref_more', { pref: block.pref })}
                        className="text-xs text-slate-400 hover:text-white transition shrink-0 ml-2"
                      >
                        もっと見る →
                      </Link>
                    </div>
                    {/* その県の最新2件・2カラム（small/引用カード） */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {blockReviews.map((r, i) => (
                        <HomeReviewCard key={r.id || i} r={r} variant="small" position={i} pref={block.pref} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* 投稿の呼び水（末尾・破線・現行踏襲） */}
              <Link
                to="/post-review"
                onClick={() => trackEvent('select_home_review', { position: 'invite', variant: 'invite' })}
                className="group flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/50 transition-all duration-200 p-5 min-h-[128px]"
              >
                <div className="text-2xl mb-1.5 transition-transform group-hover:-translate-y-0.5">✍️</div>
                <div className="text-sm font-black text-white leading-snug">あなたの体験談が<br />次にここに載ります</div>
                <div className="text-[11px] font-bold text-pink-300 mt-1.5">1件書けば口コミ読み放題 →</div>
              </Link>
            </div>
          </section>
        )}

        {/* 1.5. 主要機能ショートカット */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '🔍', title: 'キャスト検索', desc: '名前・店舗・エリアで絞り込み検索', link: '/search' },
              { icon: '✍️', title: '口コミを書く', desc: '体験談を投稿して閲覧権を獲得', link: '/post-review' },
              { icon: '🏆', title: 'ランキング', desc: '口コミ評価が高いセラピスト', link: '/ranking' },
              { icon: '✨', title: '新人を見る', desc: '新しく掲載されたセラピスト', link: '/new-therapists' },
            ].map(f => (
              <Link key={f.title} to={f.link}
                className="group rounded-2xl bg-slate-900/60 border border-white/5 hover:border-pink-500/30 p-4 transition-all duration-200 hover:-translate-y-0.5">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h4 className="text-white font-black text-sm">{f.title}</h4>
                <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">{f.desc}</p>
                <span className="text-pink-400 text-[11px] font-bold mt-2 block group-hover:translate-x-1 transition-transform">使ってみる →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 2. エリアから探す（旧「エリアから探す」＋旧「人気エリア」を1セクションに統合）
            ⚠️ 統合した理由（2026-08-17）: ホーム1枚に「エリアから探す」という見出しが
               本文とフッターの2箇所にあり、さらに隣接して「人気エリア」という
               ほぼ同義のセクションが並んでいた＝同じ話題が3ブロックに散っていた。
               「ハイライト（人気エリア）→ 全一覧（すべてのエリア）」の1本の流れに整理する。
               フッター側は「都道府県から探す」に改名して役割を分けた。 */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              エリアから探す
            </h3>
          </div>

          {/* ハイライト：掲載数の多いエリア */}
          <div className="flex items-end justify-between mb-4 px-2">
            <h4 className="text-sm font-black text-slate-300 tracking-wide">人気エリア</h4>
            {/* ⚠️「店舗数ランキング」と書いていたが、これは市場規模の順位ではなく
                   当サイトの掲載数の多い順。/stats で同じ表記を正した（2026-08-17）ので揃える。 */}
            <span className="text-xs text-slate-500 font-bold">掲載店舗数の多い順</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px]">
            {topAreas.map((area) => (
              <Link
                key={area.name}
                to={`/shops?q=${area.name}`}
                className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${area.color} ${area.size}`}
              >
                {/* Unsplashの外国夜景を廃止＝1.1MBのLCP負債除去＋誠実さ。タイポグラフィタイルに */}
                <div className="absolute inset-0 bg-slate-950/35 group-hover:bg-slate-950/15 transition duration-300" />
                <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {area.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold bg-black/25 backdrop-blur px-2 py-0.5 rounded text-white border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-none tracking-tight mb-1">
                    {area.name}
                  </h2>
                  <p className="text-xs md:text-sm font-bold text-white/80 group-hover:text-white transition">
                    {area.sub}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* 全一覧：地方→都道府県→市区のアコーディオン */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <h4 className="text-sm font-black text-slate-300 tracking-wide mb-4 px-2">すべてのエリア</h4>
            <PrefectureSelector shops={shops} />
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
            {/* ⚠️ 2026-08-12: 掲示板の導線を一時撤去（decisions.md D-006） */}
          </div>
        </section>

        {/* 3.5. 注目セラピスト */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <span className="text-2xl">💃</span> 注目セラピスト
            </h3>
            <Link to="/search" className="text-xs text-slate-400 font-bold hover:text-white transition py-3 -my-3 pl-3">もっと見る</Link>
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
                    to={shop ? `/shops/${shop.id}/threads/${t.id}` : '/search'}
                    className="snap-center flex-shrink-0 w-[120px] md:w-[150px] group"
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden relative bg-slate-900">
                      <img
                        src={optimizeImageUrl(t.image_url, 300)}
                        alt={t.name}
                        decoding="async"
                        className="w-full h-full object-cover object-top transition duration-700 group-hover:scale-110"
                        onError={(e) => {
                          if (e.currentTarget.dataset.fb !== '1' && t.image_url) { e.currentTarget.dataset.fb = '1'; e.currentTarget.src = t.image_url; }
                          else { e.currentTarget.style.display = 'none'; }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white font-black text-xs leading-tight [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] truncate">{t.name}</p>
                        {shop && <p className="text-pink-300 text-[10px] truncate mt-0.5">{getDisplayName(shop.name)}</p>}
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
              <Link to="/shops" className="text-xs text-slate-400 font-bold hover:text-white transition py-3 -my-3 pl-3">もっと見る</Link>
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
                to={`/shops/${shop.id}`}
                className="snap-center flex-shrink-0 w-[160px] md:w-[240px] group"
              >
                {/* ⚠️ 店舗画像は横長のロゴ／キャンペーンバナーが多い（実測で245/756枚が aspect≥2.2）。
                       縦長(3/4)のカードに object-cover で入れると上下を切り落とし、
                       文字の断片だけが写って「壊れている」ように見える（2026-08-20 実機で発覚）。
                       ヒーローと同じく「ぼかし背景＋contain」にして全体を見せる。 */}
                <div className="aspect-[3/4] rounded-t-2xl overflow-hidden relative bg-slate-900">
                  {/* ⚠️ object-contain は imgClassName で渡す。className はラッパーdivに付くだけ。 */}
                  <LazyImage src={shop.image_url || shop.image} alt="" className="absolute inset-0 w-full h-full scale-110 blur-xl opacity-30" imgClassName="w-full h-full object-cover" />
                  <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="absolute inset-0 w-full h-full p-3 transition duration-700 group-hover:scale-105" imgClassName="w-full h-full object-contain" />
                  <div className="absolute top-2 left-2">
                    <span className="bg-pink-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">NEW</span>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-b-2xl px-3 py-2.5 border-t border-white/5">
                  <h4 className="text-white font-black text-sm leading-tight truncate">{getDisplayName(shop.name)}</h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{shop.prefecture || '東京'}{shop.city && shop.city !== shop.prefecture ? ` ${shop.city}` : ''}</p>
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
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">注目店舗</h4>
            <div className="space-y-3">
              {sidebarShops.map(shop => (
                  <Link
                    key={shop.id}
                    to={`/shops/${shop.id}`}
                    className="group flex items-center gap-3 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-pink-500/20 rounded-2xl p-3 transition-all duration-200"
                  >
                    {/* ⚠️ 16x16の小さなサムネでも、横長ロゴを cover で入れると
                           左右が切れて何の店か分からなくなる。ここも contain（D-008）。
                           p-1 でロゴが枠に貼り付かないように余白を入れる。 */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 p-1">
                      <img
                        src={optimizeImageUrl(shop.image_url, 128)}
                        alt={shop.name}
                        decoding="async"
                        className="w-full h-full object-contain group-hover:scale-110 transition duration-500"
                        onError={(e) => {
                          if (e.currentTarget.dataset.fb !== '1' && shop.image_url) { e.currentTarget.dataset.fb = '1'; e.currentTarget.src = shop.image_url; }
                          else { e.currentTarget.style.display = 'none'; }
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-xs leading-tight truncate">{getDisplayName(shop.name)}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5 truncate">{shop.prefecture} {shop.city}</p>
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
            <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">700文字以上の体験談を投稿すると、その場で7日間の閲覧権が自動付与されます。新規登録だけでも3日間無料。</p>
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
          {/* ⚠️ 2026-08-12: 掲示板の導線を一時撤去（decisions.md D-006） */}

          {/* メンズエステ統計2026 */}
          <Link
            to="/stats"
            className="block rounded-2xl bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 hover:border-emerald-500/50 p-5 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="text-2xl mb-2">📊</div>
            <h4 className="text-white font-black text-sm">メンズエステ統計2026</h4>
            {/* 料金中央値を数字のまま出す＝他社が公開していない一次データが最も強い誘引 */}
            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
              {siteStats.nationalPrice?.median60
                ? `料金相場は60分¥${Number(siteStats.nationalPrice.median60).toLocaleString()}・90分¥${Number(siteStats.nationalPrice.median90 || 0).toLocaleString()}（${Number(siteStats.coverage?.priceSampleShops || 0).toLocaleString()}店舗の中央値）`
                : '全国の料金相場・エリア別の掲載店舗数'}
            </p>
            <span className="block mt-3 text-emerald-300 text-xs font-black">統計を見る →</span>
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
