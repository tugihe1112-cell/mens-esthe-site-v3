/**
 * /brands/:brandId — ブランドページ（SSR）
 *
 * 【なぜSSRにするか（2026-09-14 オーナー確認）】
 * 利用者が読みたいのは「アロマモアというブランドと、そこにいるセラピスト」の口コミで、
 * **セラピストは店舗ではなくブランドに属する**。支店レコードは「渋谷で検索した人に
 * 引っかかる」ために地名を持っているだけで、「渋谷店」自体に価値はない。
 * したがってブランドが本命のページになる。
 *
 * ⚠️ これまでブランドページは中身がクライアント描画だけで、Googleには空に見えていた。
 *    店舗ページ(SSRあり)から301で送る前に、ここをSSRにしないと**悪い方へ動かす**ことになる。
 *
 * ⚠️ 口コミの共有単位は group_id（CLAUDE.md 2026-07 に記録された確定事項）。
 *    1件書けば系列全店のページに出る。ここでも group_id 全体から集める。
 */
import React from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import BrandPage from '../../src/pages/BrandPage';
import { buildBrands, pickNearbyBrands, buildBrandRoster } from '../../src/utils/brandGroups.js';

// PostgREST は1回に最大1000行。人数を数えるので取り切る必要がある。
const THERAPIST_PAGE = 1000;
const THERAPIST_MAX = 4000;

export async function getServerSideProps({ params, res }) {
  const { brandId } = params;
  // ⚠️ SWRは最大2分。長くするとデプロイ後に古いHTML→消えたJSチャンク404→真っ黒になる。
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  try {
    // group_id で引く。単独店（group_idなし）は id そのものがブランドの鍵になる。
    const [byGroup, byId] = await Promise.all([
      supabase.from('shops').select('id, name, group_id, image_url, website_url, raw_data').eq('group_id', brandId),
      supabase.from('shops').select('id, name, group_id, image_url, website_url, raw_data').eq('id', brandId).maybeSingle(),
    ]);
    if (byGroup.error) throw byGroup.error;
    if (byId.error) throw byId.error;

    const rooms = (byGroup.data && byGroup.data.length)
      ? byGroup.data
      : (byId.data && !byId.data.group_id ? [byId.data] : []);

    // ⚠️ 404にするのは「クエリ成功かつ0件」のときだけ。DB障害で404を返すと実在ページを消滅扱いにする。
    if (rooms.length === 0) return { notFound: true };

    const brand = buildBrands(rooms)[0];
    const shopIds = rooms.map((s) => s.id);

    // 代表ルーム＝口コミ投稿の宛先。投稿APIは shop_id を要るので必ず実在の店舗IDを渡す。
    const primaryShopId = brand.primaryShopId || rooms[0].id;
    // ⚠️ brand.prefecture / brand.area を直接読んではいけない。
    //    buildBrands は代表行をそのまま展開するので、DBの生レコードでは
    //    prefecture も area も**トップレベルには無い**（raw_data の中にある）＝常に undefined になり、
    //    「同エリアの他ブランド」が永久に同県フォールバックへ落ちる（静かに劣化する型）。
    //    正規化済みの brand.rooms から取る。
    const headRoom = (brand.rooms || []).find((r) => r.id === brand.primaryShopId) || (brand.rooms || [])[0] || null;
    const prefecture = headRoom?.prefecture || null;
    const headArea = (Array.isArray(headRoom?.area) ? headRoom.area[0] : headRoom?.area) || null;

    const [reviewRes, revTRes, rosterRes, nearRes] = await Promise.all([
      supabase.from('reviews')
        .select('id, shop_id, therapist_id, therapist_name, rating, content, created_at, user_name')
        .in('shop_id', shopIds)
        .or('is_public.eq.true,user_id.eq.owner_manual')
        .order('created_at', { ascending: false })
        .limit(20),
      // 口コミがある人＝読ませる価値のある内部リンク先（店舗ページと同じ作り）
      supabase.from('reviews')
        .select('therapist_id, therapist_name, shop_id, rating, created_at')
        .in('shop_id', shopIds)
        .or('is_public.eq.true,user_id.eq.owner_manual')
        .not('therapist_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(60),
      // 在籍セラピスト。名簿（写真あり）と**実人数**の両方をこの1本から作る。
      // ⚠️ PostgREST は1回に最大1000行しか返さない。ここを limit だけで書くと、
      //    ルーム数の多いブランドで人数が黙って頭打ちになる。足りなければ下で継ぎ足す。
      supabase.from('therapists').select('id, name, image_url, shop_id, is_active').in('shop_id', shopIds).range(0, THERAPIST_PAGE - 1),
      // 同エリア他ブランド（回遊＋クロール経路）。店舗ページの「他の店舗」に相当する。
      prefecture
        ? supabase.from('shops').select('id, name, group_id, raw_data').eq('raw_data->>prefecture', prefecture).limit(120)
        : Promise.resolve({ data: null }),
    ]);
    if (reviewRes.error) throw reviewRes.error;
    if (revTRes.error) throw revTRes.error;
    if (rosterRes.error) throw rosterRes.error;
    if (nearRes.error) throw nearRes.error;

    const seenT = new Set();
    const reviewedTherapists = [];
    for (const r of revTRes.data || []) {
      if (!r.therapist_id || seenT.has(r.therapist_id)) continue;
      seenT.add(r.therapist_id);
      reviewedTherapists.push({ id: r.therapist_id, name: r.therapist_name || '', shopId: r.shop_id, rating: r.rating || null });
      if (reviewedTherapists.length >= 12) break;
    }

    // 1000行で埋まっていたら次のページを継ぎ足す（人数を頭打ちにしないため）。
    // 1ページで収まるブランドが大半なので、その場合は追加リクエストは飛ばない。
    let therapistRows = rosterRes.data || [];
    while (therapistRows.length >= THERAPIST_PAGE && therapistRows.length < THERAPIST_MAX) {
      const nextRes = await supabase
        .from('therapists')
        .select('id, name, image_url, shop_id, is_active')
        .in('shop_id', shopIds)
        .range(therapistRows.length, therapistRows.length + THERAPIST_PAGE - 1);
      if (nextRes.error) throw nextRes.error;
      if (!nextRes.data?.length) break;
      therapistRows = therapistRows.concat(nextRes.data);
    }
    // ⚠️ 上限に当たったら人数は**出さない**。数え切れていない数字を出さない（D-010の考え方）。
    const rosterTruncated = therapistRows.length >= THERAPIST_MAX;
    const { roster, personCount } = buildBrandRoster(therapistRows, { limit: 24 });

    const nearby = pickNearbyBrands(nearRes.data, {
      area: headArea,
      excludeIds: [brand.id, ...shopIds],
      limit: 8,
    });

    const reviews = reviewRes.data || [];
    const count = reviews.length;
    const rated = reviews.filter((r) => Number(r.rating) > 0);
    const avg = rated.length ? (rated.reduce((s, r) => s + Number(r.rating), 0) / rated.length).toFixed(1) : null;
    const sample = count ? (reviews[0].content || '').replace(/\s+/g, '').slice(0, 70) : '';

    return {
      props: {
        ssrBrand: {
          id: brand.id,
          name: brand.name,
          image_url: brand.image_url || null,
          website_url: brand.website_url || null,
          roomCount: brand.roomCount,
          areaLabels: brand.areaLabels || [],
          primaryShopId,
          // ⚠️ raw_data は丸ごと渡さない（1店約11.9KBでHTMLが膨れる）。必要な項目だけ平らにする。
          rooms: (brand.rooms || []).map((r) => ({
            id: r.id, prefecture: r.prefecture, city: r.city, address: r.address,
            area: Array.isArray(r.area) ? r.area[0] || null : r.area || null,
          })),
        },
        ssrTherapistCount: rosterTruncated ? null : personCount,
        ssrReviewedTherapists: reviewedTherapists,
        ssrReviews: reviews,
        ssrReviewCount: count,
        ssrAvgRating: avg,
        ssrSample: sample,
        ssrRoster: roster,
        ssrRosterTruncated: personCount > roster.length,
        ssrNearbyBrands: nearby.brands,
        ssrNearbyScope: nearby.scope,
        ssrArea: headArea,
        ssrPrefecture: prefecture,
      },
    };
  } catch (e) {
    console.error('[SSR BrandPage]', e.message);
    // ⚠️ 異常系で404を返さない。503でURLを保持させる（2026-06-30の空ページ配信でインデックス崩落した型）。
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
    return { props: { ssrBrand: null, ssrTherapistCount: 0, ssrReviewedTherapists: [], ssrReviews: [], ssrReviewCount: 0, ssrAvgRating: null, ssrSample: '', ssrRoster: [], ssrRosterTruncated: false, ssrNearbyBrands: [], ssrNearbyScope: 'prefecture', ssrArea: null, ssrPrefecture: null } };
  }
}

export default function BrandSSRPage({
  ssrBrand, ssrTherapistCount = 0, ssrReviewedTherapists = [], ssrReviews = [], ssrReviewCount = 0, ssrAvgRating = null, ssrSample = '',
  ssrRoster = [], ssrRosterTruncated = false, ssrNearbyBrands = [], ssrNearbyScope = 'prefecture', ssrArea = null, ssrPrefecture = null,
}) {
  const SITE = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';
  const name = ssrBrand?.name || '';
  const canonical = ssrBrand ? `${SITE}/brands/${ssrBrand.id}` : '';
  const areas = (ssrBrand?.areaLabels || []).join('・');

  const title = ssrReviewCount > 0
    ? `${name}の口コミ${ssrReviewCount}件・セラピスト評判 | メンエスマップ`
    : `${name}のセラピスト一覧・口コミ | メンエスマップ`;
  const description = ssrReviewCount > 0
    ? `${name}の口コミ${ssrReviewCount}件（平均★${ssrAvgRating}）。${ssrSample}…${areas ? `${areas}の` : ''}在籍セラピスト${ssrTherapistCount}名の評判・体験談をメンエスマップでチェック。`
    : `${name}${areas ? `（${areas}）` : ''}の在籍セラピスト${ssrTherapistCount}名。口コミ・体験談をメンエスマップでチェック。`;

  const businessLd = ssrBrand ? {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    '@id': `${canonical}#business`,
    name,
    url: canonical,
    ...(ssrBrand.website_url ? { sameAs: ssrBrand.website_url } : {}),
    ...(ssrBrand.image_url ? { image: ssrBrand.image_url } : {}),
    // 全ルームを1つのブランドの拠点として出す（支店ごとに別事業者ではない）
    ...(ssrBrand.rooms?.length ? {
      location: ssrBrand.rooms.map((r) => ({
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          ...(r.prefecture ? { addressRegion: r.prefecture } : {}),
          ...(r.city || r.area ? { addressLocality: r.city || r.area } : {}),
          addressCountry: 'JP',
        },
      })),
    } : {}),
    ...(ssrReviewCount > 0 && ssrAvgRating ? {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: ssrAvgRating, reviewCount: ssrReviewCount, bestRating: 5, worstRating: 1 },
      // ⚠️ 本文つきの review[] を出す。店舗ページ側は持っていてブランド側に無いと、
      //    301で寄せたときにリッチリザルトの材料だけ痩せる。
      review: ssrReviews.slice(0, 5).map((r) => ({
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: Number(r.rating || 0), bestRating: 5, worstRating: 1 },
        author: { '@type': 'Person', name: r.user_name || '匿名' },
        datePublished: r.created_at?.slice(0, 10),
        reviewBody: (r.content || '').slice(0, 1500),
      })),
    } : {}),
  } : null;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
        {/* ⚠️ 口コミ0件のページはサイトマップの方針に合わせて noindex,follow。
            follow を残すのでセラピストページへのクロール経路は殺さない。
            口コミが1件でも付けば自動で index 対象に戻る（手動の戻し作業を作らない）。 */}
        {ssrReviewCount === 0 && <meta name="robots" content="noindex,follow" />}
        {/* パンくず（Home > ブランド）。店舗ページが持っているものをブランド側にも揃える。 */}
        {ssrBrand && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org', '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'メンエスマップ', item: SITE },
              { '@type': 'ListItem', position: 2, name, item: canonical },
            ],
          }) }} />
        )}
        {businessLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
        )}
      </Head>
      <BrandPage
        ssrBrand={ssrBrand}
        ssrTherapistCount={ssrTherapistCount}
        ssrReviewedTherapists={ssrReviewedTherapists}
        ssrReviews={ssrReviews}
        ssrReviewCount={ssrReviewCount}
        ssrAvgRating={ssrAvgRating}
        ssrRoster={ssrRoster}
        ssrRosterTruncated={ssrRosterTruncated}
        ssrNearbyBrands={ssrNearbyBrands}
        ssrNearbyScope={ssrNearbyScope}
        ssrArea={ssrArea}
        ssrPrefecture={ssrPrefecture}
        renderSeo={false}
      />
    </>
  );
}
