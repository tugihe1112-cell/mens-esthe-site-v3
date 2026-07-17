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

export default function IndexPage({ initialHero, reviewsByPref }) {
  return <Home initialHero={initialHero} reviewsByPref={reviewsByPref} />;
}

export async function getServerSideProps({ res }) {
  // ISR(getStaticProps)の永続キャッシュが古い版を配信し続ける問題を回避するためSSR化。
  // ⚠️SWRを1日にするとデプロイ後に古いHTMLが配信され、消えた古いJSチャンクを指して404→真っ黒になる（ビルドIDが毎回変わるため）。
  //   頻繁にデプロイするので stale窓は短く。s-maxage=60 + SWR=120（最大でも2分・Vercelの旧アセット保持内）。
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  let initialHero = [];
  let reviewsByPref = [];
  try {
    // 公開データ（shops）はRLSで匿名read可。クライアントと同じanon keyで取得。
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || ''
    );
    // ①ヒーロー店舗 と ②公開口コミ最新30件 は独立 → 並列（Vercel関数↔Supabaseの往復回数を削減）
    const [{ data }, { data: revs }] = await Promise.all([
      supabase.from('shops').select('id, group_id, name, raw_data, image_url').in('id', HERO_SHOP_IDS),
      supabase.from('reviews')
        .select('id, shop_id, therapist_id, therapist_name, rating, content, created_at, detailed_ratings, user_name, course')
        .eq('is_public', true)
        .not('therapist_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);
    initialHero = buildInitialHero(data);

    // 店名/エリア解決 と セラピスト写真 は②に依存するがお互い独立 → 並列
    const shopIds = [...new Set((revs || []).map((r) => r.shop_id).filter(Boolean))];
    const therapistIds = [...new Set((revs || []).map((r) => r.therapist_id).filter(Boolean))];
    const [{ data: shopRows } = {}, { data: tRows } = {}] = await Promise.all([
      shopIds.length ? supabase.from('shops').select('id, name, raw_data').in('id', shopIds) : Promise.resolve({ data: [] }),
      therapistIds.length ? supabase.from('therapists').select('id, image_url').in('id', therapistIds) : Promise.resolve({ data: [] }),
    ]);
    const shopNameById = Object.fromEntries((shopRows || []).map((s) => [s.id, s.name]));
    const shopLocById = Object.fromEntries((shopRows || []).map((s) => {
      const rd = s.raw_data || {};
      const area = Array.isArray(rd.area) ? rd.area[0] : (rd.area || null);
      return [s.id, { prefecture: rd.prefecture || null, area: area || null }];
    }));
    const imgById = Object.fromEntries((tRows || []).map((t) => [t.id, t.image_url]));
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
      snippet: (r.content || '').replace(/\s+/g, '').slice(0, 120),
      detailedRatings: r.detailed_ratings || null,
      userName: PLACEHOLDER_NAMES.has(r.user_name) ? null : (r.user_name || null),
      course: r.course || null,
      createdAt: r.created_at || null,
    }));
    // 都道府県でグルーピング→各県 最新2件→県は口コミ総数の降順→最大4県（0件の県は構造的に出ない）
    const byPref = {};
    for (const rv of mapped) {
      if (!rv.prefecture) continue;
      (byPref[rv.prefecture] = byPref[rv.prefecture] || []).push(rv);
    }
    reviewsByPref = Object.entries(byPref)
      .map(([pref, list]) => ({ pref, slug: PREF_TO_SLUG[pref] || null, count: list.length, reviews: list.slice(0, 2) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  } catch (e) {
    // 取得失敗時は空配列で返す（ビルドは落とさない）
    console.error('getServerSideProps home fetch failed:', e);
  }

  return { props: { initialHero, reviewsByPref } };
}
