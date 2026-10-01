// Next.js トップページ（実体）
// ⚠️ Next.jsは .jsx を .js より優先して解決するため、トップページは必ずこの index.jsx 側に
//    getStaticProps を直接定義すること。index.js 側に書いても無視される（過去にそれで本番未反映になった）。
//
// SSR(getServerSideProps)でヒーロー店舗をサーバー側で事前取得し、画像URLを初期HTMLに埋め込む。
// これによりCSRのデータ取得待ち（LCP 14.6s/CLSの主因）を排除する。
// ※ISR(getStaticProps)はVercel永続キャッシュが古い版を配信し続ける問題があったためSSR+Cache-Controlに変更。
import React from 'react';
import Head from 'next/head';
import { createServerSupabase } from '../server/supabaseServer';
import Home from '../src/pages/Home';
import { HERO_SHOP_IDS, buildInitialHero } from '../src/data/heroShops';
import { loadHomeReviews } from '../server/homeReviews';
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

export default function IndexPage({ initialHero, reviewsByPref, latestReviews, reviewStats, liveCounts, reviewLoadFailed = false }) {
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
        reviewLoadFailed={reviewLoadFailed}
      />
    </>
  );
}

// 🚩 件数（掲載N店舗／在籍N人）は表示のたびに数えない（2026-09-24）。
//    セラピスト56,625行の数え上げがDBの実行時間全体の53%を占め（店舗の数え上げと合わせて6割超）、冷えた状態では2〜4秒かかって
//    トップ全体の待ち時間になっていた（UptimeRobot が5分おきに開くたびに冷えた状態で走っていた）。
// 🚩 数えるのは /api/shops-lite?view=counts（CDNに置く）。ここは読むだけ（server/siteCounts.js の注記）。
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
  const r = await fetch(`${SITE}/api/shops-lite?view=counts`, { headers: { accept: 'application/json' } });
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
  // 正常な口コミ応答を確認するまで失敗扱い。例外で代入に到達しなくても0件へ丸めない。
  let reviewLoadFailed = true;
  try {
    // 公開データ（shops）はRLSで匿名read可。クライアントと同じanon keyで取得。
    const supabase = createServerSupabase(process.env.VITE_SUPABASE_ANON_KEY);
    // 件数は手元の数を使う。古い・無いときはここで数え直しを始め、ほかの取得と並べて進める（待つのは下の waitFor）。
    liveCountsCache.peek();
    // ヒーロー・公開口コミは独立 → 並列（Vercel関数↔Supabaseの往復回数を削減）
    const [heroResult, reviewResult] = await Promise.allSettled([
      supabase.from('shops').select('id, group_id, name, raw_data, image_url').in('id', HERO_SHOP_IDS).retry(false),
      loadHomeReviews(supabase),
    ]);
    if (reviewResult.status === 'fulfilled') {
      ({ reviewsByPref, latestReviews, reviewStats, reviewLoadFailed } = reviewResult.value);
    } else {
      console.error('Home public reviews fetch failed:', reviewResult.reason);
    }
    // ヒーローの取得・整形に失敗しても、正常に読めた口コミまで捨てない。
    if (heroResult.status === 'fulfilled' && !heroResult.value?.error) {
      initialHero = buildInitialHero(heroResult.value.data);
    }
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
  // ⚠️ 写真や所在地だけの失敗なら、取得済みの口コミを200で表示する。
  //    本文の取得失敗は、ヒーロー・母数の成功で隠さず503＋no-storeにする。
  // ⚠️ 404ではなく503。404はURLの消滅を宣言することになる。
  //    503は「今は出せない・あとで来て」なのでURLは保持される。
  const gotNothing = initialHero.length === 0 && reviewsByPref.length === 0 && !liveCounts && latestReviews.length === 0;
  if (gotNothing) {
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
  }
  if (reviewLoadFailed) {
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
  }

  return { props: { initialHero, reviewsByPref, latestReviews, reviewStats, liveCounts, reviewLoadFailed } };
}
