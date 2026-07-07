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

export default function IndexPage({ initialHero, latestReviews }) {
  return <Home initialHero={initialHero} latestReviews={latestReviews} />;
}

export async function getServerSideProps({ res }) {
  // ISR(getStaticProps)の永続キャッシュが古い版を配信し続ける問題を回避するためSSR化。
  // CDNには短時間だけキャッシュさせて速度も確保（s-maxage=60 + stale-while-revalidate）。
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  let initialHero = [];
  let latestReviews = [];
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

    // Tier 2-2: 最新の本物口コミ（is_public）をSSRで取得 → ホームから口コミページへ直リンク（クローラー発見の最短経路）
    const { data: revs } = await supabase
      .from('reviews')
      .select('id, shop_id, therapist_id, therapist_name, rating, content, created_at')
      .eq('is_public', true)
      .not('therapist_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8);
    const shopIds = [...new Set((revs || []).map((r) => r.shop_id).filter(Boolean))];
    let shopNameById = {}, shopLocById = {};
    if (shopIds.length) {
      const { data: shopRows } = await supabase.from('shops').select('id, name, raw_data').in('id', shopIds);
      shopNameById = Object.fromEntries((shopRows || []).map((s) => [s.id, s.name]));
      shopLocById = Object.fromEntries((shopRows || []).map((s) => {
        const rd = s.raw_data || {};
        const area = Array.isArray(rd.area) ? rd.area[0] : (rd.area || null);
        return [s.id, { prefecture: rd.prefecture || null, area: area || null }];
      }));
    }
    // セラピスト写真（A-3: 口コミカードのサムネ用）
    const therapistIds = [...new Set((revs || []).map((r) => r.therapist_id).filter(Boolean))];
    let imgById = {};
    if (therapistIds.length) {
      const { data: tRows } = await supabase.from('therapists').select('id, image_url').in('id', therapistIds);
      imgById = Object.fromEntries((tRows || []).map((t) => [t.id, t.image_url]));
    }
    // ⚠️ 本文全文はSSRに載せない（ホームと本命セラピストページの重複コンテンツ回避）。
    //    SSRにはティーザー(snippet)のみ。展開時の300字はクライアントがidでフェッチする。
    latestReviews = (revs || []).map((r) => ({
      id: r.id,
      shopId: r.shop_id,
      therapistId: r.therapist_id,
      therapistName: r.therapist_name || '',
      shopName: shopNameById[r.shop_id] || '',
      prefecture: shopLocById[r.shop_id]?.prefecture || null,
      area: shopLocById[r.shop_id]?.area || null,
      rating: r.rating || null,
      image: imgById[r.therapist_id] || null,
      snippet: (r.content || '').replace(/\s+/g, '').slice(0, 64),
    }));
  } catch (e) {
    // 取得失敗時は空配列で返す → クライアント側で従来通り補完（ビルドは落とさない）
    console.error('getServerSideProps home fetch failed:', e);
  }

  return { props: { initialHero, latestReviews } };
}
