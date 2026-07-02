/**
 * /shops/:shopId/threads/:threadId — セラピスト詳細ページ（SSR）
 *
 * getServerSideProps で公開データを取得 → 初期HTMLに埋め込む。
 * Googlebot がJSなしでも口コミ・評価・JSON-LDを読める。
 * クライアント側の動的フェッチ（認証後の全口コミ表示等）は既存コンポーネントが担う。
 */
import React from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import ThreadDetailPage from '../../../../src/pages/ThreadDetailPage.jsx';

// ────────────────────────────────────────────────────────────
// SSR: サーバー側でSupabaseから公開データを取得
// ────────────────────────────────────────────────────────────
export async function getServerSideProps({ params }) {
  const { shopId, threadId } = params;

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    // 1. 店舗取得
    const { data: shopData } = await supabase
      .from('shops')
      .select('id, name, group_id, image_url, website_url, raw_data')
      .eq('id', shopId)
      .single();

    // 2. セラピスト取得
    const { data: therapistData } = await supabase
      .from('therapists')
      .select('id, name, image_url, shop_id')
      .eq('id', threadId)
      .single();

    // 3. 公開口コミ取得（is_public=true または owner_manual）
    let reviewShopIds = [shopId];
    if (shopData?.group_id) {
      const { data: groupShops } = await supabase
        .from('shops')
        .select('id')
        .eq('group_id', shopData.group_id);
      if (groupShops?.length) reviewShopIds = groupShops.map(s => s.id);
    }

    const therapistName = therapistData?.name || threadId.split('_').pop();
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, shop_id, therapist_name, therapist_id, rating, content, detailed_ratings, tags, created_at, is_public, user_id')
      .in('shop_id', reviewShopIds)
      .or('is_public.eq.true,user_id.eq.owner_manual')
      .order('created_at', { ascending: false })
      .limit(10);

    // セラピスト名でフィルタ
    const normName = (therapistName || '').replace(/[\s　]/g, '');
    const publicReviews = (reviews || []).filter(r =>
      r.therapist_name && r.therapist_name.replace(/[\s　]/g, '') === normName
    );

    // 評価集計
    let avgRating = null;
    if (publicReviews.length > 0) {
      avgRating = (publicReviews.reduce((s, r) => s + (r.rating || 3), 0) / publicReviews.length).toFixed(1);
    }

    return {
      props: {
        ssrShop: shopData || null,
        ssrTherapist: therapistData || null,
        ssrPublicReviews: publicReviews,
        ssrAvgRating: avgRating,
      },
    };
  } catch (e) {
    console.error('[SSR ThreadDetail]', e.message);
    return { props: { ssrShop: null, ssrTherapist: null, ssrPublicReviews: [], ssrAvgRating: null } };
  }
}

// ────────────────────────────────────────────────────────────
// ページコンポーネント：SSRデータをHeadタグ + JSON-LDに使用
// 既存の ThreadDetailPage をそのままレンダリング（クライアント動作を維持）
// ────────────────────────────────────────────────────────────
export default function ThreadDetailSSRPage({ ssrShop, ssrTherapist, ssrPublicReviews, ssrAvgRating }) {
  const SITE = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';

  const shopName = ssrShop?.name || '';
  const therapistName = ssrTherapist?.name || '';
  const title = therapistName
    ? `${therapistName} | ${shopName} | メンエスマップ`
    : `${shopName} | メンエスマップ`;
  const description = ssrPublicReviews.length > 0
    ? `${therapistName}（${shopName}）の口コミ${ssrPublicReviews.length}件。${ssrPublicReviews[0]?.content?.slice(0, 80) || ''}...`
    : `${therapistName}（${shopName}）のセラピスト情報。メンエスマップで口コミ・体験談をチェック。`;

  const canonicalUrl = ssrShop && ssrTherapist
    ? `${SITE}/shops/${ssrShop.id}/threads/${ssrTherapist.id}`
    : '';

  // JSON-LD（Googleがインデックスする構造化データ）
  const jsonLd = (ssrShop && ssrTherapist && ssrPublicReviews.length > 0) ? {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: `${shopName} ${therapistName}`,
    url: canonicalUrl,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ssrAvgRating,
      reviewCount: ssrPublicReviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: ssrPublicReviews.slice(0, 5).map(r => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating || 3, bestRating: 5, worstRating: 1 },
      author: { '@type': 'Person', name: '匿名' },
      datePublished: r.created_at?.slice(0, 10) || '',
      reviewBody: (r.content || '').slice(0, 300),
    })),
  } : null;

  // Tier 2-4: パンくず構造化データ（Home > 店舗 > セラピスト）
  const breadcrumbLd = ssrShop ? {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'メンエスマップ', item: SITE },
      { '@type': 'ListItem', position: 2, name: shopName, item: `${SITE}/shops/${ssrShop.id}` },
      ...(ssrTherapist ? [{ '@type': 'ListItem', position: 3, name: therapistName, item: canonicalUrl }] : []),
    ],
  } : null;

  return (
    <>
      {/* SSRで確実にHeadを出力（react-helmet-asyncのサーバー描画を補完） */}
      <Head>
        {/* 公開口コミ0件の薄いセラピストページは noindex,follow。
            目的: 45,000の空ページをGoogleに索引させずクロール予算と品質評価を守る
            （GSCの「クロール済-未登録144」「検出-未登録453」の主因）。
            口コミが1件でも付けば索引対象に自動復帰＝コンテンツ戦略と一致。 */}
        {ssrTherapist && ssrPublicReviews.length === 0 && (
          <meta name="robots" content="noindex,follow" />
        )}
        <title>{title}</title>
        <meta name="description" content={description} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ssrTherapist?.image_url && <meta property="og:image" content={ssrTherapist.image_url} />}
        <meta property="og:url" content={canonicalUrl} />
        {/* JSON-LD — SSRで初期HTMLに埋め込まれる */}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        {breadcrumbLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
          />
        )}
      </Head>

      {/* 既存コンポーネントをそのまま使用（クライアント側の全機能を維持） */}
      <ThreadDetailPage />
    </>
  );
}
