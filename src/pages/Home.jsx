
import { shopHref } from '../utils/brandGroups.js';
import React, { useMemo, useState, useEffect } from 'react';
import { normalizeTherapistName } from '../utils/reviewIdentity.js';
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
import HomeReviewsSection from '../components/HomeReviewsSection.jsx';
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
import { FREE_READ_NOTE } from '../data/siteCopy.js';
import { shopAreaList } from '../utils/shopFields';

// 順位ごとの表示スタイル
// ⚠️ バッジは「掲載店舗数の順位」だけを書く。以前は「👑 店舗数No.1」「✨ 人気」「🔥 注目」だったが、
// 並びは当サイトの掲載数であって人気でも市場規模でもない（8/17 に見出しを「掲載店舗数の多い順」へ直した方針）。
// 色は墨の面に細い枠。1位だけ朱をごく薄く敷く（2026-09-30・デザインA案＝差し色は朱1色。
// 以前は紫・青・緑・赤のグラデーションだった）。
const RANK_STYLES = [
  { size: 'col-span-2 row-span-2', color: 'from-pink-900/50 to-slate-900', tag: '掲載数 1位' },
  { size: 'col-span-1 row-span-1', color: 'from-slate-900 to-slate-900', tag: '掲載数 2位' },
  { size: 'col-span-1 row-span-1', color: 'from-slate-900 to-slate-900', tag: '掲載数 3位' },
  // ⚠️ 4位も1段にする（2段にすると1位の下に穴が空いていた）。1位の2×2＋小さい4枚で隙間なく埋まる。
  { size: 'col-span-1 row-span-1', color: 'from-slate-900 to-slate-900', tag: '掲載数 4位' },
  { size: 'col-span-1 row-span-1', color: 'from-slate-900 to-slate-900', tag: '掲載数 5位' },
];

// 見出し帯の日付（日本時間）。サーバーと画面で日付が変わる瞬間だけ食い違うので suppressHydrationWarning を付けて出す。
function jstDateLabel() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${'日月火水木金土'[d.getUTCDay()]}）`;
}

export default function HomePage({ initialHero = [], reviewsByPref = [], latestReviews = [], reviewStats = null, liveCounts = null }) {
  const { shops, loading, roomCounts } = useShopData();
  const displayedCounts = {
    totalShops: liveCounts?.totalShops ?? siteStats.coverage?.totalShops ?? 0,
    totalTherapists: liveCounts?.totalTherapists ?? siteStats.coverage?.totalTherapists ?? 0,
  };
  const [featuredTherapists, setFeaturedTherapists] = useState([]);
  const { user } = useAuth();

  // 注目セラピストの元データ。
  // ⚠️ 2026-09-23（速度）: **店舗一覧（DataContext）を待たずに**取りに行く。
  //    以前は店舗一覧が届いてから取り始めていたので、注目セラピストが出るまで
  //    「店舗一覧の取得」＋「この取得」を順番に待っていた（実測で店舗一覧が5秒かかった回があった）。
  //    店舗一覧は選び方（店舗・地域を散らす）にだけ要るので、揃ってから下で選ぶ。
  const [featuredPool, setFeaturedPool] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        if (!cancelled && !error && data) setFeaturedPool(data);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 注目セラピストを選ぶ（店舗分散・地域分散ロジック）。元データと店舗一覧の両方が揃ってから。
  useEffect(() => {
    if (!featuredPool || !shops || shops.length === 0) return;
    const pickFeatured = () => {
      try {
        const data = featuredPool;

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
          // ⚠️ 独自の正規化を書かない。reviewIdentity に一本化する。
          const key = normalizeTherapistName(t.name);
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
    pickFeatured();
  }, [featuredPool, shops]);

  // ★自動集計ロジック (詳細エリア優先)
  const topAreas = useMemo(() => {
    if (!shops || shops.length === 0) return [];

    const counts = {};
    shops.forEach(shop => {
      // エリアがあればそれをキーにする（複数エリアの店は先頭＝本拠地）。なければ市区町村(city)を使う。
      const key = shopAreaList(shop)[0] || shop.city;
      
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
        {/* 日付入りの見出し帯（雑誌の表紙の一行）。スライダーの上・ヘッダーの下に置く。
            ⚠️ 細く保つ（390×844で「特典・登録・検索」を最初の画面に入れる・U02）。 */}
        <TopHeroSlider
          initialHero={initialHero}
          topSlot={(
            <div className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between gap-3 border-y border-slate-800 px-4 py-1.5 md:px-6">
              <span className="font-mincho text-[13px] font-bold tracking-[0.14em] text-slate-100">メンズエステの口コミ手帖</span>
              <span className="text-[11px] text-slate-400" suppressHydrationWarning>{jstDateLabel()}</span>
            </div>
          )}
        />
        {/* 検索カードをスライダーに食い込ませて常にファーストビュー内に。
            ⚠️ U02-2: PC幅880px・余白24px・角丸16px。以前の40px余白＋40px角丸は
               「何のサイトか」を書くための領域をカードの縁で食い潰していた。 */}
        <div className="relative z-30 -mt-4 md:mt-6 px-4 md:px-6 max-w-[880px] mx-auto">
          <div className="bg-slate-900 border border-slate-700 p-3 md:p-6 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* ⚠️ U02-1: ページのH1はここ1つだけ。以前は sr-only のH1が別にあり、
                   画面に見えている一番大きな文字（＝利用者が読む見出し）と食い違っていた。
                   このカード内のH1はスマホ22px・PC28pxで、汎用H1より小さくする（U02-2）。 */}
            {/* ⚠️ 2026-09-23: 以前はスマホ用とPC用の<span>を2つ並べて出し分けていたため、
                   HTML上はH1の中に同じ文が2回あった（画面に出るのは1回だが、本文として読む
                   クローラーや読み上げ以外の抽出では「見出しが重複」に見える。外部の指摘で発覚）。
                   文字の大きさだけの違いなので、1つの要素のまま幅で切り替える。
                   ⚠️ index.css に「768px以下の h1 は 1.5rem」があるが、クラス指定のほうが強いので 22px が勝つ。 */}
            <h1 className="font-mincho font-bold text-slate-50 text-[22px] md:text-[28px]" style={{ lineHeight: 1.4 }}>
              口コミを読んで、店選びの不安を減らす。
            </h1>

            <div className="mt-2">
              <SearchBar />
            </div>

            {!user ? (
              <div className="mt-1 border-t border-slate-800 pt-2">
                <p data-role="home-benefit" className="text-sm font-bold text-pink-300">無料登録で3日間、口コミ読み放題</p>
                <div className="mt-2 flex items-center gap-2 sm:gap-3">
                  <Link
                    to={withReturnTo('/register', '', { source: 'home' })}
                    onClick={() => { trackEvent('click_paywall_cta', { target: 'register', source: 'home' }); trackRegisterCtaClick('home'); }}
                    data-cta="home-register"
                    className="inline-flex min-w-0 flex-1 sm:flex-none sm:min-w-[240px] items-center justify-center rounded-sm bg-pink-500 px-3 sm:px-6 font-bold text-slate-950 transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                    style={{ minHeight: '48px', fontSize: '15px' }}
                  >
                    無料登録する
                  </Link>
                  <Link to="/popular-reviews" className="ui-link inline-flex min-h-12 min-w-0 flex-1 items-center justify-center text-center sm:flex-none" style={{ fontSize: '13px' }}>
                    登録せず口コミを読む
                  </Link>
                </div>
              </div>
            ) : (
              <p className="ui-muted mt-2">店舗名・エリア・セラピスト名で探す</p>
            )}

            {/* ⚠️ U02-6: 起算はアカウント作成時点から72時間。「メール確認完了から丸3日」とは書かない。
                   無料期間後の自動課金は実装が存在しないので「自動課金なし」は事実。
                ⚠️ 2026-09-09: この注記は**検索欄の下**へ置く。上に置くと2行ぶん(約44px)押し下げて、
                   390×844の初期画面から検索欄がはみ出す（実測851px）。受入条件は
                   「特典・登録CTA・検索操作まで初期画面に入る」なので、操作を優先する。 */}
            {!user && (
              <p data-role="home-free-note" className="ui-help mt-2">{FREE_READ_NOTE}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-5 md:mt-8">
      <div className="flex flex-col lg:flex-row gap-10">

      {/* ===== メインカラム ===== */}
      <div className="flex-1 min-w-0 space-y-24">

        {/* 呼水：最新の実体験口コミ（件数・地域チップ・最新1件・新着6件・中立宣言）。
            組み立ては src/utils/homeReviews.js、画面は src/components/HomeReviewsSection.jsx。 */}
        <HomeReviewsSection
          latestReviews={latestReviews}
          reviewsByPref={reviewsByPref}
          reviewStats={reviewStats}
          displayedCounts={displayedCounts}
        />

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
          <div className="mb-6 border-b border-slate-700 pb-3">
            <h3 className="font-mincho text-[26px] md:text-[32px] font-bold leading-[1.3] text-slate-50">エリアから探す</h3>
          </div>

          {/* ハイライト：掲載数の多いエリア */}
          <div className="flex items-end justify-between mb-4 px-2">
            <h4 className="font-mincho text-base font-bold text-slate-200">人気エリア</h4>
            {/* ⚠️「店舗数ランキング」と書いていたが、これは市場規模の順位ではなく
                   当サイトの掲載数の多い順。/stats で同じ表記を正した（2026-08-17）ので揃える。 */}
            <span className="text-xs text-slate-400">掲載店舗数の多い順</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px]">
            {topAreas.map((area) => (
              <Link
                key={area.name}
                to={`/shops?q=${area.name}`}
                className={`group relative overflow-hidden border border-slate-700 transition-colors duration-300 hover:border-pink-500/60 bg-gradient-to-br ${area.color} ${area.size}`}
              >
                {/* Unsplashの外国夜景を廃止＝1.1MBのLCP負債除去＋誠実さ。文字だけのタイルに */}
                <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-between">
                  <div className="flex flex-wrap gap-1">
                    {area.tags.map(tag => (
                      <span key={tag} className="text-[11px] tracking-[0.12em] text-pink-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div>
                    <h2 className="font-mincho text-2xl md:text-4xl font-bold text-slate-50 leading-tight group-hover:text-pink-200 transition-colors">
                      {area.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {area.sub}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 全一覧：地方→都道府県→市区のアコーディオン */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h4 className="font-mincho text-base font-bold text-slate-200 mb-4">すべてのエリア</h4>
            <PrefectureSelector shops={shops} />
          </div>
        </section>

        {/* ⚠️ 2026-09-08（U02下部4）削除: 「新人キャスト」「みんなの口コミ」バナー。
            直前のショートカットと同じ行き先の重複。ページ自体は残っている。 */}

        {/* 3.5. 注目セラピスト */}
        <section>
          <div className="mb-6 flex items-end justify-between border-b border-slate-700 pb-3">
            <h3 className="font-mincho text-[26px] md:text-[32px] font-bold leading-[1.3] text-slate-50">注目セラピスト</h3>
            <Link to="/search" className="text-xs text-slate-300 font-bold hover:text-white transition py-3 -my-3 pl-3">もっと見る →</Link>
          </div>
          {loading || featuredTherapists.length === 0 ? (
            /* スケルトン: 横スクロール */
            <div className="flex gap-4 pb-4 -mx-4 px-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[120px] md:w-[150px]">
                  <div className="aspect-[3/4] bg-slate-800 animate-pulse" />
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
                    <div className="aspect-[3/4] overflow-hidden relative border border-slate-700 bg-slate-900">
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
                        <p className="font-mincho text-white font-bold text-sm leading-tight [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] truncate">{t.name}</p>
                        {shop && <p className="text-pink-300 text-xs truncate mt-0.5">{getDisplayName(shop.name, shop)}</p>}
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
          <div className="mb-6 flex items-end justify-between border-b border-slate-700 pb-3">
              <h3 className="font-mincho text-[26px] md:text-[32px] font-bold leading-[1.3] text-slate-50">新着店舗</h3>
              <Link to="/shops" className="text-xs text-slate-300 font-bold hover:text-white transition py-3 -my-3 pl-3">もっと見る →</Link>
          </div>

          {loading ? (
            /* スケルトン: 横スクロール */
            <div className="flex gap-4 pb-8 -mx-4 px-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[160px] md:w-[240px]">
                  <div className="aspect-[3/4] bg-slate-800 animate-pulse" />
                  <div className="bg-slate-900 p-3 space-y-2">
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
                to={shopHref(shop, roomCounts)}
                className="snap-center flex-shrink-0 w-[160px] md:w-[240px] group"
              >
                {/* ⚠️ 店舗画像は横長のロゴ／キャンペーンバナーが多い（実測で245/756枚が aspect≥2.2）。
                       縦長(3/4)のカードに object-cover で入れると上下を切り落とし、
                       文字の断片だけが写って「壊れている」ように見える（2026-08-20 実機で発覚）。
                       ヒーローと同じく「ぼかし背景＋contain」にして全体を見せる。 */}
                <div className="aspect-[3/4] overflow-hidden relative border border-slate-700 bg-slate-900">
                  {/* ⚠️ object-contain は imgClassName で渡す。className はラッパーdivに付くだけ。 */}
                  <LazyImage src={shop.image_url || shop.image} alt="" className="absolute inset-0 w-full h-full scale-110 blur-xl opacity-30" imgClassName="w-full h-full object-cover" />
                  <LazyImage src={shop.image_url || shop.image} alt={shop.name} className="absolute inset-0 w-full h-full p-3 transition duration-700 group-hover:scale-105" imgClassName="w-full h-full object-contain" />
                  <div className="absolute top-2 left-2">
                    <span className="bg-pink-500 text-slate-950 text-[11px] font-bold px-2 py-0.5">NEW</span>
                  </div>
                </div>
                <div className="px-0.5 pt-2">
                  <h4 className="font-mincho text-slate-50 font-bold text-[15px] leading-tight truncate group-hover:text-pink-300">{getDisplayName(shop.name, shop)}</h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{shop.prefecture || '東京'}{shop.city && shop.city !== shop.prefecture ? ` ${shop.city}` : ''}</p>
                </div>
              </Link>
            ))}
             <Link to="/shops" className="snap-center flex-shrink-0 w-[120px] flex items-center justify-center border border-slate-700 hover:border-pink-500/60 transition group aspect-[3/4]">
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
            <div className="border border-slate-700 bg-slate-900 p-6 lg:p-8">
              <h4 className="font-mincho text-xl font-bold leading-[1.5] text-slate-50">無料登録で3日間、口コミ読み放題</h4>
              <p className="ui-help mt-2">{FREE_READ_NOTE}</p>
              <Link
                to={withReturnTo('/register', '', { source: 'home' })}
                onClick={() => { trackEvent('click_paywall_cta', { target: 'register', source: 'home' }); trackRegisterCtaClick('home'); }}
                className="mt-4 inline-flex w-full sm:w-auto sm:min-w-[240px] items-center justify-center rounded-sm bg-pink-500 px-6 font-bold text-slate-950 transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                style={{ minHeight: '48px', fontSize: '15px' }}
              >
                無料登録する
              </Link>
            </div>
          ) : (
            <div className="border border-slate-700 bg-slate-900 p-6 lg:p-8">
              <h4 className="font-mincho text-xl font-bold leading-[1.5] text-slate-50">体験談を投稿して、閲覧期間を延長</h4>
              <p className="ui-muted mt-2">200字で3日間、700字で7日間の閲覧権が即時付与されます</p>
              <Link
                to="/post-review"
                onClick={() => trackEvent('click_paywall_cta', { target: 'post_review', source: 'home' })}
                className="mt-4 inline-flex w-full sm:w-auto sm:min-w-[240px] items-center justify-center rounded-sm bg-pink-500 px-6 font-bold text-slate-950 transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
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
            <h4 className="font-mincho text-lg font-bold text-slate-50 mb-3 border-b border-slate-700 pb-2">注目店舗</h4>
            <div className="space-y-3">
              {sidebarShops.map(shop => (
                  <Link
                    key={shop.id}
                    to={shopHref(shop, roomCounts)}
                    className="group flex items-center gap-3 border-b border-slate-800 py-3 transition-colors"
                  >
                    {/* ⚠️ 16x16の小さなサムネでも、横長ロゴを cover で入れると
                           左右が切れて何の店か分からなくなる。ここも contain（D-008）。
                           p-1 でロゴが枠に貼り付かないように余白を入れる。 */}
                    <div className="w-16 h-16 overflow-hidden flex-shrink-0 border border-slate-700 bg-slate-900 p-1">
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
                      <p className="font-mincho text-slate-50 font-bold text-sm leading-tight truncate group-hover:text-pink-300">{getDisplayName(shop.name, shop)}</p>
                      <p className="text-slate-400 text-xs mt-0.5 truncate">{shop.prefecture} {shop.city}</p>
                      <span className="text-pink-300 text-xs mt-1 block">詳しく見る →</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>

          {/* ⚠️ 2026-09-08（U02下部6）: 投稿・口コミ・統計の大きなカード3枚を
              登録案内1枚＋統計のテキストリンクへ整理した。
              PC右カラムが同じ話を繰り返す長い柱になっていた。固定追従バナーは追加しない。 */}
          {!user ? (
            <div className="border border-slate-700 bg-slate-900 p-5">
              <h4 className="font-mincho text-base font-bold leading-snug text-slate-50">無料登録で3日間、口コミ読み放題</h4>
              <p className="ui-help mt-2">{FREE_READ_NOTE}</p>
              <Link
                to={withReturnTo('/register', '', { source: 'home' })}
                onClick={() => { trackEvent('click_paywall_cta', { target: 'register', source: 'home' }); trackRegisterCtaClick('home'); }}
                className="mt-3 inline-flex w-full items-center justify-center rounded-sm bg-pink-500 px-4 font-bold text-slate-950 transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                style={{ minHeight: '48px', fontSize: '14px' }}
              >
                無料登録する
              </Link>
            </div>
          ) : (
            <div className="border border-slate-700 bg-slate-900 p-5">
              <h4 className="font-mincho text-base font-bold leading-snug text-slate-50">体験談を投稿して、閲覧期間を延長</h4>
              <p className="ui-help mt-2">200字で3日間、700字で7日間</p>
              <Link
                to="/post-review"
                className="mt-3 inline-flex w-full items-center justify-center rounded-sm bg-pink-500 px-4 font-bold text-slate-950 transition hover:bg-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
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
