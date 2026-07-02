/**
 * /area/:pref — エリア別ページ（SSR強化・Tier 2-1）
 *
 * サイト最大表示（hyogo225・saitama161）を持つのに汎用リンク集のままだったページに、
 * SSRで「件数入りタイトル・エリア概況・最新の本物口コミ・ItemList/BreadcrumbList構造化データ」を付与。
 * 本体UI（店舗一覧）は既存 PrefecturePage がそのまま担う。
 */
import React from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import PrefecturePage from '../../src/pages/PrefecturePage';

const PREF_MAP = {
  tokyo: '東京都', osaka: '大阪府', aichi: '愛知県', kanagawa: '神奈川県', saitama: '埼玉県',
  chiba: '千葉県', hyogo: '兵庫県', kyoto: '京都府', fukuoka: '福岡県', miyagi: '宮城県',
  shizuoka: '静岡県', shiga: '滋賀県', hiroshima: '広島県', hokkaido: '北海道',
};

export async function getServerSideProps({ params }) {
  const pref = params.pref;
  const prefName = PREF_MAP[pref] || null;
  if (!prefName) return { props: { ssr: null } };

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  try {
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name, raw_data')
      .eq('raw_data->>prefecture', prefName)
      .limit(1000);

    const shopList = (shops || []).map((s) => ({
      id: s.id, name: s.name, city: s.raw_data?.city || s.raw_data?.area || '',
    }));
    const shopCount = shopList.length;

    const areaCount = {};
    for (const s of shopList) { const a = s.city || 'その他'; areaCount[a] = (areaCount[a] || 0) + 1; }
    const topAreas = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([a]) => a);

    let latestReviews = [];
    const shopIds = shopList.map((s) => s.id);
    if (shopIds.length) {
      const { data: revs } = await supabase
        .from('reviews')
        .select('shop_id, therapist_id, therapist_name, rating, content')
        .in('shop_id', shopIds.slice(0, 300))
        .eq('is_public', true)
        .not('therapist_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(6);
      const nameById = Object.fromEntries(shopList.map((s) => [s.id, s.name]));
      latestReviews = (revs || []).map((r) => ({
        shopId: r.shop_id, therapistId: r.therapist_id, therapistName: r.therapist_name || '',
        shopName: nameById[r.shop_id] || '', rating: r.rating || null,
        snippet: (r.content || '').replace(/\s+/g, '').slice(0, 60),
      }));
    }

    return { props: { ssr: { prefName, pref, shopCount, topAreas, shopList: shopList.slice(0, 60), latestReviews } } };
  } catch (e) {
    console.error('[SSR Area]', e.message);
    return { props: { ssr: null } };
  }
}

export default function AreaSSRPage({ ssr }) {
  const SITE = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';
  if (!ssr) return <PrefecturePage />;

  const { prefName, pref, shopCount, topAreas, shopList, latestReviews } = ssr;
  const canonical = `${SITE}/area/${pref}`;
  const title = `${prefName}のメンズエステ${shopCount}店舗・口コミ | メンエスマップ`;
  const description = `${prefName}のメンズエステ${shopCount}店舗（${topAreas.slice(0, 3).join('・')}など）を掲載。セラピスト情報・口コミ・料金・出勤スケジュールをチェック。`;

  const itemListLd = shopList.length ? {
    '@context': 'https://schema.org', '@type': 'ItemList',
    itemListElement: shopList.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.name, url: `${SITE}/shops/${s.id}` })),
  } : null;
  const breadcrumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'メンエスマップ', item: SITE },
      { '@type': 'ListItem', position: 2, name: `${prefName}のメンズエステ`, item: canonical },
    ],
  };

  return (
    <>
      <Head>
        {shopCount < 5 && <meta name="robots" content="noindex,follow" />}
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        {itemListLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      </Head>

      <PrefecturePage />

      {/* Tier 2-1: エリアの最新の本物口コミ（SSR・エリアページに一次コンテンツ＋口コミページへの内部リンク） */}
      {latestReviews.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-28 -mt-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
            <h2 className="text-base font-black text-white mb-3">{prefName}の最新の口コミ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {latestReviews.map((r, i) => (
                <a
                  key={i}
                  href={`/shops/${r.shopId}/threads/${r.therapistId}`}
                  className="block rounded-xl border border-white/10 bg-slate-800 hover:border-pink-500/40 transition p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white truncate">{r.therapistName}</span>
                    {r.rating != null && <span className="text-xs font-bold text-pink-400 shrink-0 ml-2">★ {Number(r.rating).toFixed(1)}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1 truncate">{r.shopName}</div>
                  <p className="text-xs text-slate-400 line-clamp-2">{r.snippet}…</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
