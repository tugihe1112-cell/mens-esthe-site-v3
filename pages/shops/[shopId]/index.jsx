/**
 * /shops/:shopId — 店舗詳細ページ（SSR）
 *
 * getServerSideProps で「公開口コミ件数・平均評価・冒頭サンプル」を取得し、
 * <title>を「{店名}の口コミ{N}件・セラピスト評判 | メンエスマップ」形式にする（Tier 2-3：CTR改善）。
 * Googlebot がJSなしでも件数入りタイトル・description を読める。
 * 本体UI・クライアント動作は既存 ShopDetailPage がそのまま担う（client SeoHeadも件数連動に更新済み）。
 */
import React from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import ShopDetailPage from '../../../src/pages/ShopDetailPage';

export async function getServerSideProps({ params, res }) {
  const { shopId } = params;
  // CDNキャッシュ＝一度誰かが開いたページは次から即返る。SSR HTMLは全員共通・ユーザー固有部分はクライアント描画なので安全。
  // ⚠️SWRを1日にするとデプロイ後に古いHTML→消えた古いJSチャンク404→真っ黒になる。stale窓は短く（最大2分）。
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  try {
    const { data: shop } = await supabase
      .from('shops')
      .select('id, name, group_id, image_url, website_url, raw_data')
      .eq('id', shopId)
      .single();

    // 口コミ共有モデル: group_idがあれば系列全店のshop_idを対象にする
    let reviewShopIds = [shopId];
    if (shop?.group_id) {
      const { data: g } = await supabase.from('shops').select('id').eq('group_id', shop.group_id);
      if (g?.length) reviewShopIds = g.map((s) => s.id);
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, content, created_at')
      .in('shop_id', reviewShopIds)
      .or('is_public.eq.true,user_id.eq.owner_manual')
      .order('created_at', { ascending: false })
      .limit(50);

    const count = reviews?.length || 0;
    const avg = count ? (reviews.reduce((s, r) => s + (r.rating || 3), 0) / count).toFixed(1) : null;
    const sample = count ? (reviews[0].content || '').replace(/\s+/g, '').slice(0, 70) : '';

    // ── ここから「1,098ページ全部に固有の中身を持たせる」ための追加取得 ──
    // 背景: 料金/営業時間は487店しか取れておらず、残りは「情報なし」の行き止まりだった。
    //       欠損を埋めることはできないので、"持っているデータ"（在籍数・口コミ付きセラピスト・同エリア他店）に置き換える。
    const prefecture = shop?.raw_data?.prefecture || null;
    const area = Array.isArray(shop?.raw_data?.area) ? shop.raw_data.area[0] : shop?.raw_data?.area || null;

    // 在籍セラピスト数（全店にある固有データ）
    const { count: therapistCount } = await supabase
      .from('therapists')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId);

    // 口コミがあるセラピスト（＝読ませる価値のある内部リンク先）
    const { data: revT } = await supabase
      .from('reviews')
      .select('therapist_id, therapist_name, rating')
      .in('shop_id', reviewShopIds)
      .or('is_public.eq.true,user_id.eq.owner_manual')
      .not('therapist_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(60);
    const seenT = new Set();
    const reviewedTherapists = [];
    for (const r of revT || []) {
      if (seenT.has(r.therapist_id)) continue;
      seenT.add(r.therapist_id);
      reviewedTherapists.push({ id: r.therapist_id, name: r.therapist_name || '', rating: r.rating || null });
      if (reviewedTherapists.length >= 8) break;
    }

    // 同エリアの他店（回遊＋クロール経路。エリアが無ければ同県でフォールバック）
    let nearbyShops = [];
    if (prefecture) {
      const { data: near } = await supabase
        .from('shops')
        .select('id, name, raw_data')
        .eq('raw_data->>prefecture', prefecture)
        .neq('id', shopId)
        .limit(60);
      const sameArea = (near || []).filter((s) => {
        const a = Array.isArray(s.raw_data?.area) ? s.raw_data.area[0] : s.raw_data?.area;
        return area ? a === area : true;
      });
      nearbyShops = (sameArea.length >= 3 ? sameArea : near || [])
        .slice(0, 8)
        .map((s) => ({ id: s.id, name: s.name }));
    }

    return {
      props: {
        ssrShop: shop || null,
        ssrReviewCount: count,
        ssrAvgRating: avg,
        ssrSample: sample,
        ssrTherapistCount: therapistCount || 0,
        ssrReviewedTherapists: reviewedTherapists,
        ssrNearbyShops: nearbyShops,
        ssrPrefecture: prefecture,
        ssrArea: area,
      },
    };
  } catch (e) {
    console.error('[SSR ShopDetail]', e.message);
    return {
      props: {
        ssrShop: null, ssrReviewCount: 0, ssrAvgRating: null, ssrSample: '',
        ssrTherapistCount: 0, ssrReviewedTherapists: [], ssrNearbyShops: [], ssrPrefecture: null, ssrArea: null,
      },
    };
  }
}

export default function ShopDetailSSRPage({
  ssrShop, ssrReviewCount, ssrAvgRating, ssrSample,
  ssrTherapistCount = 0, ssrReviewedTherapists = [], ssrNearbyShops = [], ssrPrefecture = null, ssrArea = null,
}) {
  const SITE = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';
  const shopName = ssrShop?.name || '';
  const canonical = ssrShop ? `${SITE}/shops/${ssrShop.id}` : '';

  const title = ssrReviewCount > 0
    ? `${shopName}の口コミ${ssrReviewCount}件・セラピスト評判 | メンエスマップ`
    : `${shopName}のセラピスト一覧・口コミ | メンエスマップ`;
  const description = ssrReviewCount > 0
    ? `${shopName}の口コミ${ssrReviewCount}件（平均★${ssrAvgRating}）。${ssrSample}…実際に行った体験談・セラピスト評判をメンエスマップでチェック。`
    : `${shopName}の在籍セラピスト・口コミ・体験談。メンエスマップで最新情報をチェック。`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ssrShop?.image_url && <meta property="og:image" content={ssrShop.image_url} />}
        {canonical && <meta property="og:url" content={canonical} />}
        {/* Tier 2-4: パンくず構造化データ（Home > 店舗） */}
        {ssrShop && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org', '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'メンエスマップ', item: SITE },
              { '@type': 'ListItem', position: 2, name: shopName, item: canonical },
            ],
          }) }} />
        )}
      </Head>
      <ShopDetailPage
        ssrTherapistCount={ssrTherapistCount}
        ssrReviewedTherapists={ssrReviewedTherapists}
        ssrNearbyShops={ssrNearbyShops}
        ssrPrefecture={ssrPrefecture}
        ssrArea={ssrArea}
        ssrReviewCount={ssrReviewCount}
        ssrAvgRating={ssrAvgRating}
      />
    </>
  );
}
