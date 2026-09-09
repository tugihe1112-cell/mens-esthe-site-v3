
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
import { useAuth } from '../contexts/AuthContext';
import { withReturnTo } from '../utils/authRedirect.js';
import { trackRegisterCtaClick } from '../utils/registerAnalytics';

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
  // ⚠️ U02: 全県分を縦に並べると、ホームが「口コミの倉庫」になって読み終われない。
  //    見出し＋select＋選択地域の最大2件にする。空文字＝先頭（SSRと初回レンダーを一致させる）。
  const [selectedPref, setSelectedPref] = useState('');
  const { user } = useAuth();

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

  // 選択中の地域ブロック（最大2件・最新カードと同じ口コミは除く）
  const activePref = selectedPref || orderedPrefs[0]?.pref || '';
  const activeBlock = orderedPrefs.find((b) => b.pref === activePref) || orderedPrefs[0] || null;
  const activeBlockReviews = (activeBlock?.reviews || [])
    .filter((review) => review.id !== leadReview?.id)
    .slice(0, 2);

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

      {/* 1. ヒーローセクション
          ⚠️ U02: スライダーの置換・静的化・coverflow効果や高さの再設計はしない。 */}
      <div className="relative">
        <TopHeroSlider initialHero={initialHero} />
        {/* 検索カードをスライダーに食い込ませて常にファーストビュー内に。
            ⚠️ U02-2: PC幅880px・余白24px・角丸16px。以前の40px余白＋40px角丸は
               「何のサイトか」を書くための領域をカードの縁で食い潰していた。 */}
        <div className="relative z-30 -mt-2 md:mt-6 px-4 md:px-6 max-w-[880px] mx-auto">
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-4 md:p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* ⚠️ U02-1: ページのH1はここ1つだけ。以前は sr-only のH1が別にあり、
                   画面に見えている一番大きな文字（＝利用者が読む見出し）と食い違っていた。
                   このカード内のH1はスマホ22px・PC28pxで、汎用H1より小さくする（U02-2）。 */}
            <h1 className="font-black text-white tracking-tight" style={{ fontSize: '22px', lineHeight: 1.3 }}>
              <span className="md:hidden">口コミを読んで、店選びの不安を減らす。</span>
              <span className="hidden md:inline" style={{ fontSize: '28px' }}>口コミを読んで、店選びの不安を減らす。</span>
            </h1>

            {!user ? (
              <div className="mt-3">
                <p className="text-pink-300 font-bold" style={{ fontSize: '15px' }}>無料登録で3日間、口コミ読み放題</p>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Link
                    to={withReturnTo('/register', '', { source: 'home' })}
                    onClick={() => { trackEvent('click_paywall_cta', { target: 'register', source: 'home' }); trackRegisterCtaClick('home'); }}
                    className="inline-flex w-full sm:w-auto sm:min-w-[240px] items-center justify-center rounded-xl bg-[#be185d] px-6 font-black text-white transition hover:bg-[#9d174d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                    style={{ minHeight: '48px', fontSize: '15px' }}
                  >
                    無料登録する
                  </Link>
                  <Link to="/popular-reviews" className="ui-link inline-flex min-h-11 items-center justify-center px-2" style={{ fontSize: '14px' }}>
                    登録せず口コミを読む
                  </Link>
                </div>
                {/* ⚠️ U02-6: 起算はアカウント作成時点から72時間。「メール確認完了から丸3日」とは書かない。
                       無料期間後の自動課金は実装が存在しないので「自動課金なし」は事実。 */}
                <p className="ui-help mt-2">閲覧期間は登録手続き時から3日間です。メール確認後に利用できます。自動課金はありません</p>
              </div>
            ) : (
              <p className="ui-muted mt-2">店舗名・エリア・セラピスト名で探す</p>
            )}

            <div className="mt-4">
              <SearchBar />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
      <div className="flex flex-col lg:flex-row gap-10">

      {/* ===== メインカラム ===== */}
      <div className="flex-1 min-w-0 space-y-24">

        {/* 検索直後に最新の実体験を1件提示。その後に中立性と地域別口コミを続ける。 */}
        {reviewsByPref.length > 0 ? (
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

            {/* 地域別の口コミ（U02下部2〜3）
                ⚠️ 全県分を縦に並べない。見出し＋select＋選択地域の**最大2件**。
                   足りない場合は他地域の口コミで埋めない（「その地域の口コミ」ではなくなる）。
                   全エリアの内部リンクは下の「すべてのエリア」とフッターに残っている。 */}
            <div className={`transition-opacity duration-300 ${reordering ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-3 px-1">
                <h4 className="text-lg font-black text-white">地域別の口コミ</h4>
                <div className="flex items-center gap-2">
                  <label htmlFor="home-pref-select" className="ui-label">口コミの地域</label>
                  <select
                    id="home-pref-select"
                    value={activePref}
                    onChange={(e) => setSelectedPref(e.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-800 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={{ minHeight: '44px', fontSize: '14px' }}
                  >
                    {orderedPrefs.map((block) => (
                      <option key={block.pref} value={block.pref}>{block.pref}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeBlock && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeBlockReviews.map((r, i) => (
                      <HomeReviewCard key={r.id || i} r={r} variant="small" position={i} pref={activeBlock.pref} />
                    ))}
                  </div>
                  {activeBlockReviews.length === 0 && (
                    <p className="ui-muted px-1">この地域の口コミはまだ準備中です。</p>
                  )}
                  <Link
                    to={activeBlock.slug ? `/area/${activeBlock.slug}` : '/popular-reviews'}
                    onClick={() => trackEvent('click_pref_more', { pref: activeBlock.pref })}
                    className="ui-link mt-3 inline-flex min-h-11 items-center font-bold"
                    style={{ fontSize: '13px' }}
                  >
                    この地域の口コミを見る →
                  </Link>
                </>
              )}
            </div>
          </section>
        ) : (
          /* ⚠️ U02: 口コミが0件でも架空のカードを作らない。探せる場所へ送る。 */
          <section className="ui-card p-5 text-center">
            <p className="text-white font-black text-lg">まだ公開口コミがありません</p>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/popular-reviews" className="ui-link inline-flex min-h-11 items-center justify-center px-2">公開口コミを探す</Link>
              <Link to="/shops" className="ui-link inline-flex min-h-11 items-center justify-center px-2">店舗を探す</Link>
            </div>
          </section>
        )}

        {/* ⚠️ 2026-09-08（U02下部4）削除: 4機能ショートカット。
            共通ナビ（ホーム/探す/口コミ/投稿/登録）と検索カードで同じ導線を既に持っており、
            ホーム1枚に同じ行き先が3重に並んでいた。**リンク先のページは削除していない。** */}

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
                      <span key={tag} className="text-xs font-bold bg-black/25 backdrop-blur px-2 py-0.5 rounded text-white border border-white/10">
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

        {/* ⚠️ 2026-09-08（U02下部4）削除: 「新人キャスト」「みんなの口コミ」バナー。
            直前のショートカットと同じ行き先の重複。ページ自体は残っている。 */}

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
                        {shop && <p className="text-pink-300 text-xs truncate mt-0.5">{getDisplayName(shop.name)}</p>}
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
                    <span className="bg-pink-600/90 backdrop-blur text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg">NEW</span>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-b-2xl px-3 py-2.5 border-t border-white/5">
                  <h4 className="text-white font-black text-sm leading-tight truncate">{getDisplayName(shop.name)}</h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{shop.prefecture || '東京'}{shop.city && shop.city !== shop.prefecture ? ` ${shop.city}` : ''}</p>
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

{/* 投稿バナー（U02下部5）
            ⚠️ ホーム下部の**1か所だけ**に集約する。以前は本文中の破線バナー・
               右サイドバー・ショートカットに同じ話が散っていた。
            ⚠️「1件で読み放題」という期限のない書き方をしない。日数を明記する。 */}
        <section>
          {!user ? (
            <div className="ui-card p-5 lg:p-6 text-center">
              <h4 className="text-white font-black text-lg">無料登録で3日間、口コミ読み放題</h4>
              <p className="ui-help mt-2">閲覧期間は登録手続き時から3日間です。メール確認後に利用できます</p>
              <Link
                to={withReturnTo('/register', '', { source: 'home' })}
                onClick={() => { trackEvent('click_paywall_cta', { target: 'register', source: 'home' }); trackRegisterCtaClick('home'); }}
                className="mt-4 inline-flex w-full sm:w-auto sm:min-w-[240px] items-center justify-center rounded-xl bg-[#be185d] px-6 font-black text-white transition hover:bg-[#9d174d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                style={{ minHeight: '48px', fontSize: '15px' }}
              >
                無料登録する
              </Link>
            </div>
          ) : (
            <div className="ui-card p-5 lg:p-6 text-center">
              <h4 className="text-white font-black text-lg">体験談を投稿して、閲覧期間を延長</h4>
              <p className="ui-muted mt-2">200字で3日間、700字で7日間の閲覧権が即時付与されます</p>
              <Link
                to="/post-review"
                onClick={() => trackEvent('click_paywall_cta', { target: 'post_review', source: 'home' })}
                className="mt-4 inline-flex w-full sm:w-auto sm:min-w-[240px] items-center justify-center rounded-xl bg-[#be185d] px-6 font-black text-white transition hover:bg-[#9d174d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                style={{ minHeight: '48px', fontSize: '15px' }}
              >
                体験談を書く
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
                      <p className="text-slate-400 text-xs mt-0.5 truncate">{shop.prefecture} {shop.city}</p>
                      <span className="text-pink-400 text-xs font-bold mt-1 block group-hover:translate-x-0.5 transition-transform">詳しく見る →</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>

          {/* ⚠️ 2026-09-08（U02下部6）: 投稿・口コミ・統計の大きなカード3枚を
              登録案内1枚＋統計のテキストリンクへ整理した。
              PC右カラムが同じ話を繰り返す長い柱になっていた。固定追従バナーは追加しない。 */}
          {!user ? (
            <div className="ui-card p-5">
              <h4 className="text-white font-black text-sm leading-snug">無料登録で3日間、口コミ読み放題</h4>
              <p className="ui-help mt-2">閲覧期間は登録手続き時から3日間です。メール確認後に利用できます</p>
              <Link
                to={withReturnTo('/register', '', { source: 'home' })}
                onClick={() => { trackEvent('click_paywall_cta', { target: 'register', source: 'home' }); trackRegisterCtaClick('home'); }}
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#be185d] px-4 font-black text-white transition hover:bg-[#9d174d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                style={{ minHeight: '48px', fontSize: '14px' }}
              >
                無料登録する
              </Link>
            </div>
          ) : (
            <div className="ui-card p-5">
              <h4 className="text-white font-black text-sm leading-snug">体験談を投稿して、閲覧期間を延長</h4>
              <p className="ui-help mt-2">200字で3日間、700字で7日間</p>
              <Link
                to="/post-review"
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#be185d] px-4 font-black text-white transition hover:bg-[#9d174d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                style={{ minHeight: '48px', fontSize: '14px' }}
              >
                体験談を書く
              </Link>
            </div>
          )}

          <p className="px-1">
            <Link to="/stats" className="ui-link inline-flex min-h-11 items-center" style={{ fontSize: '13px' }}>
              メンズエステ統計2026（料金相場・掲載店舗数）→
            </Link>
          </p>
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
