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

    return { props: { ssrShop: shop || null, ssrReviewCount: count, ssrAvgRating: avg, ssrSample: sample } };
  } catch (e) {
    console.error('[SSR ShopDetail]', e.message);
    return { props: { ssrShop: null, ssrReviewCount: 0, ssrAvgRating: null, ssrSample: '' } };
  }
}

export default function ShopDetailSSRPage({ ssrShop, ssrReviewCount, ssrAvgRating, ssrSample }) {
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
      <ShopDetailPage />
    </>
  );
}
