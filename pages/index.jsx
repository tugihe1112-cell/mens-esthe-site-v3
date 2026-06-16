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

export default function IndexPage({ initialHero }) {
  return <Home initialHero={initialHero} />;
}

export async function getServerSideProps({ res }) {
  // ISR(getStaticProps)の永続キャッシュが古い版を配信し続ける問題を回避するためSSR化。
  // CDNには短時間だけキャッシュさせて速度も確保（s-maxage=60 + stale-while-revalidate）。
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  let initialHero = [];
  try {
    // 公開データ（shops）はRLSで匿名read可。クライアントと同じanon keyで取得。
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || ''
    );
    const { data } = await supabase
      .from('shops')
      .select('id, group_id, name, raw_data, image_url')
      .in('id', HERO_SHOP_IDS);
    initialHero = buildInitialHero(data);
  } catch (e) {
    // 取得失敗時は空配列で返す → クライアント側で従来通り補完（ビルドは落とさない）
    console.error('getStaticProps hero fetch failed:', e);
  }

  return { props: { initialHero } };
}
