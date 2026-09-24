// Next.js トップページ（実体）
// ⚠️ Next.jsは .jsx を .js より優先して解決するため、トップページは必ずこの index.jsx 側に
//    getStaticProps を直接定義すること。index.js 側に書いても無視される（過去にそれで本番未反映になった）。
//
// SSR(getServerSideProps)でヒーロー店舗をサーバー側で事前取得し、画像URLを初期HTMLに埋め込む。
// これによりCSRのデータ取得待ち（LCP 14.6s/CLSの主因）を排除する。
// ※ISR(getStaticProps)はVercel永続キャッシュが古い版を配信し続ける問題があったためSSR+Cache-Controlに変更。
import React from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import Home from '../src/pages/Home';
import { HERO_SHOP_IDS, buildInitialHero } from '../src/data/heroShops';
import { PREF_TO_SLUG } from '../src/data/areaLinks';
import {
  groupReviewsByPref, buildLatestFeed, summarizeReviewIndex, FEED_FETCH, REVIEW_INDEX_LIMIT,
} from '../src/utils/homeReviews';
import { getDisplayName } from '../src/utils/shopHelpers';
import { createCountsCache } from '../src/utils/liveCountsCache';

const SITE = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

/**
 * 検索結果に出す「サイト名」の指定（Google の site name は WebSite の構造化データを最優先で読む）。
 * 2026-09-23 に追加。店舗・ブランド・エリアの各ページは構造化データを持っていたが、トップには1つも無かった。
 * ⚠️ url は canonical（SeoHead がトップに出すもの）と同じ形にする。name は og:site_name と同じ。
 * ⚠️ 検索窓（SearchAction）は付けない。Google は2024年にサイトリンク検索ボックスの表示をやめている。
 */
const WEBSITE_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'メンエスマップ',
  url: SITE,
};

export default function IndexPage({ initialHero, reviewsByPref, latestReviews, reviewStats, liveCounts }) {
  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }} />
      </Head>
      <Home
        initialHero={initialHero}
        reviewsByPref={reviewsByPref}
        latestReviews={latestReviews}
        reviewStats={reviewStats}
        liveCounts={liveCounts}
      />
    </>
  );
}

// 🚩 件数（掲載N店舗／在籍N人）は表示のたびに数えない（2026-09-24）。
//    セラピスト56,625行の数え上げがDBの実行時間全体の53%を占め（店舗の数え上げと合わせて6割超）、冷えた状態では2〜4秒かかって
//    トップ全体の待ち時間になっていた（UptimeRobot が5分おきに開くたびに冷えた状態で走っていた）。
// 🚩 数えるのは /api/site-counts（CDNに置く）。ここは読むだけ（api/site-counts.js の注記）。
//    この関数のメモリに持って数え直す方式（b00e150・8f901c0）は、返答のあと関数が止まると結果が失われ、
//    期限切れのあと数え直しを繰り返していた（本番のログで05:52〜06:19に6回）。
// ⚠️ getServerSideProps の中で件数だけの問い合わせ（head: true）を書かないこと（check_ssr_helpers が検査する）。
// この関数のメモリにも5分持つ（CDNへの問い合わせを減らすだけ。CDN側は30分で取り直し、期限切れでも即返す）。
const LIVE_COUNTS_TTL_MS = 5 * 60 * 1000;
// 手元の数が古い・無いときだけ、ほかの取得のあとに最大これだけ待つ。CDNにあれば数十ミリ秒で返るので、
// 待つのは実質デプロイ直後（CDNがまだ空）の1回だけ。間に合わなければ手元の古い数、
// 古い数も無ければ今回は出さない（Home は stats-latest.json の数に落ちる＝今までの「数えきれなかったとき」と同じ）。
const LIVE_COUNTS_GRACE_MS = 3000;

async function loadLiveCounts() {
  const r = await fetch(`${SITE}/api/site-counts`, { headers: { accept: 'application/json' } });
  if (!r.ok) return null;
  const j = await r.json();
  return Number.isInteger(j?.totalShops) && Number.isInteger(j?.totalTherapists)
    ? { totalShops: j.totalShops, totalTherapists: j.totalTherapists }
    : null;
}

const liveCountsCache = createCountsCache({ ttlMs: LIVE_COUNTS_TTL_MS, load: loadLiveCounts });

export async function getServerSideProps({ res }) {
  // ISR(getStaticProps)の永続キャッシュが古い版を配信し続ける問題を回避するためSSR化。
  // ⚠️SWRを1日にするとデプロイ後に古いHTMLが配信され、消えた古いJSチャンクを指して404→真っ黒になる（ビルドIDが毎回変わるため）。
  //   頻繁にデプロイするので stale窓は短く。s-maxage=60 + SWR=120（最大でも2分・Vercelの旧アセット保持内）。
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  let initialHero = [];
  let reviewsByPref = [];
  let latestReviews = [];
  let reviewStats = null;
  let liveCounts = null;
  try {
    // 公開データ（shops）はRLSで匿名read可。クライアントと同じanon keyで取得。
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || ''
    );
    // 件数は手元の数を使う。古い・無いときはここで数え直しを始め、ほかの取得と並べて進める（待つのは下の waitFor）。
    liveCountsCache.peek();
    // ヒーロー・公開口コミは独立 → 並列（Vercel関数↔Supabaseの往復回数を削減）
    const [
      { data },
      { data: revs },
      { data: indexRows, count: reviewTotal, error: indexError },
    ] = await Promise.all([
      supabase.from('shops').select('id, group_id, name, raw_data, image_url').in('id', HERO_SHOP_IDS),
      supabase.from('reviews')
        .select('id, shop_id, therapist_id, therapist_name, rating, content, created_at, detailed_ratings, user_name, course')
        .eq('is_public', true)
        .not('therapist_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(FEED_FETCH),
      // 件数を数えるための索引（本文は読まない）。全件数は count:'exact' で取り、
      // 県別・直近の件数は読めた範囲で数える（上限で切れたら数えきれない数字は出さない＝homeReviews.js）。
      // ⚠️ 絞り込みは /popular-reviews の一覧と同じ is_public だけ（「すべての口コミ（N件）」の N が行き先の件数と一致する）。
      supabase.from('reviews')
        .select('shop_id, created_at', { count: 'exact' })
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(REVIEW_INDEX_LIMIT),
    ]);
    initialHero = buildInitialHero(data);

    // 店名/エリア解決 と セラピスト写真 は②に依存するがお互い独立 → 並列
    const safeIndex = indexError ? [] : (indexRows || []);
    const shopIds = [...new Set([...(revs || []), ...safeIndex].map((r) => r.shop_id).filter(Boolean))];
    const therapistIds = [...new Set((revs || []).map((r) => r.therapist_id).filter(Boolean))];
    // 店舗は所在地だけ引く（raw_data 丸ごとは1店で最大14KB。索引の店が増えるとSSRが重くなる）。
    // `.in()` はURLに全idが載るので分けて引く。
    const SHOP_CHUNK = 150;
    const shopChunks = [];
    for (let i = 0; i < shopIds.length; i += SHOP_CHUNK) shopChunks.push(shopIds.slice(i, i + SHOP_CHUNK));
    const [shopResults, { data: tRows } = {}] = await Promise.all([
      Promise.all(shopChunks.map((ids) => supabase.from('shops')
        .select('id, name, prefecture:raw_data->>prefecture, area:raw_data->area, city:raw_data->>city')
        .in('id', ids))),
      therapistIds.length ? supabase.from('therapists').select('id, image_url, is_active').in('id', therapistIds) : Promise.resolve({ data: [] }),
    ]);
    const shopLookupOk = shopResults.every((r) => !r?.error);
    const shopById = Object.fromEntries(shopResults.flatMap((r) => r?.data || []).map((s) => [s.id, s]));
    const areaOf = (s) => (Array.isArray(s?.area) ? s.area[0] : s?.area) || null;
    const imgById = Object.fromEntries((tRows || []).map((t) => [t.id, t.image_url]));
    // ⚠️ 2026-09-09: 在籍一覧から外れた人のカードにも印を出す（ホームから現役として送らない）。
    //    名簿に行が無い＝取得できなかった人も「在籍一覧にない」として扱う。
    const notListedById = Object.fromEntries((tRows || []).map((t) => [t.id, t.is_active === false]));
    // ペンネーム表示用: user_nameがシステム上のプレースホルダなら出さない（実在感を損なうため）
    const PLACEHOLDER_NAMES = new Set(['owner_manual', 'mensest_user', 'menesthe_import', 'menesthe_rewritten', '匿名', '']);
    // ⚠️ 本文全文はSSRに載せない（人物ページとの重複コンテンツ回避）。ティーザー(snippet 120字)のみ。全文は人物ページの該当口コミで読む。
    const mapped = (revs || []).map((r) => ({
      id: r.id,
      shopId: r.shop_id,
      therapistId: r.therapist_id,
      therapistName: r.therapist_name || '',
      // U08: 一覧では支店名・その店自身の地名を外した表示名（DBの name は変えない）
      shopName: shopById[r.shop_id]?.name ? getDisplayName(shopById[r.shop_id].name, shopById[r.shop_id]) : '',
      prefecture: shopById[r.shop_id]?.prefecture || null,
      area: areaOf(shopById[r.shop_id]),
      rating: r.rating || null,
      image: imgById[r.therapist_id] || null,
      notListed: notListedById[r.therapist_id] === true,
      snippet: (r.content || '').replace(/\s+/g, '').slice(0, 120),
      detailedRatings: r.detailed_ratings || null,
      userName: PLACEHOLDER_NAMES.has(r.user_name) ? null : (r.user_name || null),
      course: r.course || null,
      createdAt: r.created_at || null,
    }));
    // 件数（全件・直近30日・県別）。数えきれなかった数字は null（画面は数字を出さない）。
    const summary = summarizeReviewIndex(indexError ? null : indexRows, {
      total: indexError ? null : reviewTotal,
      prefOf: (shopId) => shopById[shopId]?.prefecture || null,
    });
    reviewStats = { total: summary.total, recent: summary.recent };
    // 「すべて」の並び（最新1件＋新着6件・1店舗2件まで）と、県ごとの並び（同じ形・最大6県）。
    latestReviews = buildLatestFeed(mapped);
    reviewsByPref = groupReviewsByPref(mapped, {
      slugOf: (pref) => PREF_TO_SLUG[pref],
      // 店の所在地を引けなかった分があると県別の数が欠けるので、そのときは件数を出さない
      totals: shopLookupOk ? summary.prefTotals : null,
    });
  } catch (e) {
    console.error('getServerSideProps home fetch failed:', e);
  }
  // 件数＝期限内の手元の数は待たずに使う。古い・無いときだけ最大 LIVE_COUNTS_GRACE_MS 待ち、間に合わなければ古い数（無ければ null）。
  liveCounts = await liveCountsCache.waitFor(LIVE_COUNTS_GRACE_MS);

  // 🚩 中身が何も取れなかったときに **200で空ページを配信しない**（2026-09-15）。
  //    店舗・ブランド・人物・エリアのSSRには「200で空ページを返すのが最悪
  //    （2026-06-30の全API停止→空ページ配信→インデックス崩落）」と書いて503にしてあったが、
  //    **トップページだけ古いまま**だった。しかもGSCの実測では
  //    索引されている数少ないページの1つがトップ＝一番やられてはいけない場所。
  //
  // ⚠️ 一律503にはしない。取得は2段あり、後段だけ失敗したときは
  //    ヒーローと母数は取れている＝部分的にでも出せるものは200で出す。
  //    「全部空」のときだけ503にする。
  // ⚠️ 404ではなく503。404はURLの消滅を宣言することになる。
  //    503は「今は出せない・あとで来て」なのでURLは保持される。
  const gotNothing = initialHero.length === 0 && reviewsByPref.length === 0 && !liveCounts && latestReviews.length === 0;
  if (gotNothing) {
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
  }

  return { props: { initialHero, reviewsByPref, latestReviews, reviewStats, liveCounts } };
}
