// Next.js トップページ（実体）
// ⚠️ Next.jsは .jsx を .js より優先して解決するため、トップページは必ずこの index.jsx 側に
//    getStaticProps を直接定義すること。index.js 側に書いても無視される（過去にそれで本番未反映になった）。
//
// SSR(getServerSideProps)でヒーロー店舗をサーバー側で事前取得し、画像URLを初期HTMLに埋め込む。
// これによりCSRのデータ取得待ち（LCP 14.6s/CLSの主因）を排除する。
// ※ISR(getStaticProps)はVercel永続キャッシュが古い版を配信し続ける問題があったためSSR+Cache-Controlに変更。
import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Home from '../src/pages/Home';
import { HERO_SHOP_IDS, buildInitialHero } from '../src/data/heroShops';
import { PREF_TO_SLUG } from '../src/data/areaLinks';
import { groupReviewsByPref } from '../src/utils/homeReviews';

export default function IndexPage({ initialHero, reviewsByPref, liveCounts }) {
  return <Home initialHero={initialHero} reviewsByPref={reviewsByPref} liveCounts={liveCounts} />;
}

export async function getServerSideProps({ res }) {
  // ISR(getStaticProps)の永続キャッシュが古い版を配信し続ける問題を回避するためSSR化。
  // ⚠️SWRを1日にするとデプロイ後に古いHTMLが配信され、消えた古いJSチャンクを指して404→真っ黒になる（ビルドIDが毎回変わるため）。
  //   頻繁にデプロイするので stale窓は短く。s-maxage=60 + SWR=120（最大でも2分・Vercelの旧アセット保持内）。
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  let initialHero = [];
  let reviewsByPref = [];
  let liveCounts = null;
  try {
    // 公開データ（shops）はRLSで匿名read可。クライアントと同じanon keyで取得。
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || ''
    );
    // ヒーロー・公開口コミ・表示母数は独立 → 並列（Vercel関数↔Supabaseの往復回数を削減）
    const [
      { data },
      { data: revs },
      { count: shopCount },
      { count: activeTherapistCount },
    ] = await Promise.all([
      supabase.from('shops').select('id, group_id, name, raw_data, image_url').in('id', HERO_SHOP_IDS),
      supabase.from('reviews')
        .select('id, shop_id, therapist_id, therapist_name, rating, content, created_at, detailed_ratings, user_name, course')
        .eq('is_public', true)
        .not('therapist_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('shops').select('id', { count: 'exact', head: true }),
      supabase.from('therapists')
        .select('id', { count: 'exact', head: true })
        .or('is_active.is.null,is_active.eq.true'),
    ]);
    initialHero = buildInitialHero(data);
    if (Number.isInteger(shopCount) && Number.isInteger(activeTherapistCount)) {
      liveCounts = { totalShops: shopCount, totalTherapists: activeTherapistCount };
    }

    // 店名/エリア解決 と セラピスト写真 は②に依存するがお互い独立 → 並列
    const shopIds = [...new Set((revs || []).map((r) => r.shop_id).filter(Boolean))];
    const therapistIds = [...new Set((revs || []).map((r) => r.therapist_id).filter(Boolean))];
    const [{ data: shopRows } = {}, { data: tRows } = {}] = await Promise.all([
      shopIds.length ? supabase.from('shops').select('id, name, raw_data').in('id', shopIds) : Promise.resolve({ data: [] }),
      therapistIds.length ? supabase.from('therapists').select('id, image_url, is_active').in('id', therapistIds) : Promise.resolve({ data: [] }),
    ]);
    const shopNameById = Object.fromEntries((shopRows || []).map((s) => [s.id, s.name]));
    const shopLocById = Object.fromEntries((shopRows || []).map((s) => {
      const rd = s.raw_data || {};
      const area = Array.isArray(rd.area) ? rd.area[0] : (rd.area || null);
      return [s.id, { prefecture: rd.prefecture || null, area: area || null }];
    }));
    const imgById = Object.fromEntries((tRows || []).map((t) => [t.id, t.image_url]));
    // ⚠️ 2026-09-09: 在籍一覧から外れた人のカードにも印を出す（ホームから現役として送らない）。
    //    名簿に行が無い＝取得できなかった人も「在籍一覧にない」として扱う。
    const notListedById = Object.fromEntries((tRows || []).map((t) => [t.id, t.is_active === false]));
    // ペンネーム表示用: user_nameがシステム上のプレースホルダなら出さない（実在感を損なうため）
    const PLACEHOLDER_NAMES = new Set(['owner_manual', 'mensest_user', 'menesthe_import', 'menesthe_rewritten', '匿名', '']);
    // ⚠️ 本文全文/300字はSSRに載せない（重複コンテンツ回避）。ティーザー(snippet 120字)のみ。展開時の300字はクライアントがidフェッチ。
    const mapped = (revs || []).map((r) => ({
      id: r.id,
      shopId: r.shop_id,
      therapistId: r.therapist_id,
      therapistName: r.therapist_name || '',
      shopName: shopNameById[r.shop_id] || '',
      prefecture: shopLocById[r.shop_id]?.prefecture || null,
      area: shopLocById[r.shop_id]?.area || null,
      rating: r.rating || null,
      image: imgById[r.therapist_id] || null,
      notListed: notListedById[r.therapist_id] === true,
      snippet: (r.content || '').replace(/\s+/g, '').slice(0, 120),
      detailedRatings: r.detailed_ratings || null,
      userName: PLACEHOLDER_NAMES.has(r.user_name) ? null : (r.user_name || null),
      course: r.course || null,
      createdAt: r.created_at || null,
    }));
    // 都道府県でまとめる→県は口コミ総数の降順→最大4県（0件の県は構造的に出ない）。
    // ⚠️ 各県「表示件数＋1」件を渡す（画面が最新1件と同じ口コミを除くため）。src/utils/homeReviews.js
    reviewsByPref = groupReviewsByPref(mapped, { slugOf: (pref) => PREF_TO_SLUG[pref] });
  } catch (e) {
    console.error('getServerSideProps home fetch failed:', e);
  }

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
  const gotNothing = initialHero.length === 0 && reviewsByPref.length === 0 && !liveCounts;
  if (gotNothing) {
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
  }

  return { props: { initialHero, reviewsByPref, liveCounts } };
}
