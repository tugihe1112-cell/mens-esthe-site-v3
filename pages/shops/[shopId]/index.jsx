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
    // ── 速度改善(2026-08-09): 直列6クエリ → 3ウェーブに並列化 ──
    // 以前は shop → group → reviews → count → revT → nearby を全部 await で直列に回しており、
    // 1本50〜150msでも合計600ms〜2.5秒のTTFBになっていた（実測: HTML受信完了 2,573ms）。
    // 依存関係は「shop が要る／reviewShopIds が要る」の2段しかないので3ウェーブで足りる。

    // ── wave 1: shop 本体と 在籍数（在籍数は shopId だけで引けるので同時に投げられる）
    const [shopRes, therapistCountRes] = await Promise.all([
      supabase
        .from('shops')
        .select('id, name, group_id, image_url, website_url, raw_data')
        .eq('id', shopId)
        // ⚠️ single() は「0件」もエラー扱いになり、本物のDB障害と区別できない。
        //    404を出す判断をするので maybeSingle()（0件は data=null / error=null）にする。
        .maybeSingle(),
      supabase
        .from('therapists')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shopId),
    ]);
    const shop = shopRes.data;
    const therapistCount = therapistCountRes.count;

    // ── ソフト404の解消（2026-08-10・GSC「重複しています。ユーザーにより、正規ページとして
    //    選択されていません」30件の原因）──
    // 存在しない shopId（過去に削除した重複店・legacyの brand_<hash> 等）でも
    // **HTTP 200 で「Shop not found」画面**を返しており、canonicalもnoindexも無かった。
    // Googleから見ると「中身がほぼ同じ空ページが30枚」＝重複扱いでインデックス品質を汚す。
    // 正しくは404（このURLはもう無い）を返す。/area/* で08-06に直したのと同じ型。
    //
    // ⚠️ 404にしてよいのは「クエリは成功したが0件だった」ときだけ。
    //    DB障害（error あり）で404を返すと、6/30のような全API停止時に
    //    実在する1,098ページを一斉に「消滅」とGoogleに宣言してしまう。
    //    取れない時は消さない＝下の catch と同じ思想。
    if (!shopRes.error && !shop) {
      return { notFound: true };
    }

    const prefecture = shop?.raw_data?.prefecture || null;
    const area = Array.isArray(shop?.raw_data?.area) ? shop.raw_data.area[0] : shop?.raw_data?.area || null;

    // ── wave 2: 系列店ID と 同エリア他店（どちらも shop だけに依存＝並列可）
    const [groupRes, nearRes] = await Promise.all([
      shop?.group_id
        ? supabase.from('shops').select('id').eq('group_id', shop.group_id)
        : Promise.resolve({ data: null }),
      prefecture
        ? supabase
            .from('shops')
            .select('id, name, raw_data')
            .eq('raw_data->>prefecture', prefecture)
            .neq('id', shopId)
            .limit(60)
        : Promise.resolve({ data: null }),
    ]);

    // 口コミ共有モデル: group_idがあれば系列全店のshop_idを対象にする
    let reviewShopIds = [shopId];
    if (groupRes.data?.length) reviewShopIds = groupRes.data.map((s) => s.id);

    // ── wave 3: 口コミ2本（どちらも reviewShopIds に依存＝並列可）
    const [reviewsRes, revTRes] = await Promise.all([
      supabase
        .from('reviews')
        .select('rating, content, created_at')
        .in('shop_id', reviewShopIds)
        .or('is_public.eq.true,user_id.eq.owner_manual')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('reviews')
        .select('therapist_id, therapist_name, rating')
        .in('shop_id', reviewShopIds)
        .or('is_public.eq.true,user_id.eq.owner_manual')
        .not('therapist_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(60),
    ]);
    const reviews = reviewsRes.data;
    const revT = revTRes.data;

    const count = reviews?.length || 0;
    const avg = count ? (reviews.reduce((s, r) => s + (r.rating || 3), 0) / count).toFixed(1) : null;
    const sample = count ? (reviews[0].content || '').replace(/\s+/g, '').slice(0, 70) : '';

    // ── ここから「1,098ページ全部に固有の中身を持たせる」ための整形 ──
    // 背景: 料金/営業時間は487店しか取れておらず、残りは「情報なし」の行き止まりだった。
    //       欠損を埋めることはできないので、"持っているデータ"（在籍数・口コミ付きセラピスト・同エリア他店）に置き換える。
    // ※ 取得自体は上の wave1〜3 で並列に済ませている。ここは組み立てのみ。

    // 口コミがあるセラピスト（＝読ませる価値のある内部リンク先）
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
    {
      const near = nearRes.data;
      const sameArea = (near || []).filter((s) => {
        const a = Array.isArray(s.raw_data?.area) ? s.raw_data.area[0] : s.raw_data?.area;
        return area ? a === area : true;
      });
      nearbyShops = (sameArea.length >= 3 ? sameArea : near || [])
        .slice(0, 8)
        .map((s) => ({ id: s.id, name: s.name }));
    }

    // ⚠️ ssrShop に raw_data を載せない。
    //    raw_data は1店あたり約11.9KBで、その96%が raw_data.threads（古い重複セラピスト）。
    //    これを props に入れると __NEXT_DATA__ 経由でHTMLに丸ごと焼き込まれ、
    //    実測でHTML 16KB中13KBがこのブロブだった（＝全店舗ページのHTMLが3倍に膨れていた）。
    //    このラッパーが shop から使うのは id / name / image_url だけ。
    //    prefecture・area は上で取り出して別propsで渡している。
    const ssrShop = shop
      ? { id: shop.id, name: shop.name, image_url: shop.image_url || null }
      : null;

    return {
      props: {
        ssrShop,
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
    // ⚠️ ここは「DBが落ちている」等の異常系。404は絶対に返さない（実在ページを消滅扱いにしてしまう）。
    //    代わりに 503（一時的に利用不可）を返す＝Googleは「後でまた来る」と解釈しURLを保持する。
    //    200で空ページを返すのが最悪（6/30の全API 402停止 → 空ページを配信 → インデックス崩落の型）。
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
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
