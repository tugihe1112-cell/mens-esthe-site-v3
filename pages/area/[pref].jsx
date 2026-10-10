/**
 * /area/:pref — エリア別ページ（SSR強化・Tier 2-1）
 *
 * サイト最大表示（hyogo225・saitama161）を持つのに汎用リンク集のままだったページに、
 * SSRで「件数入りタイトル・エリア概況・最新の本物口コミ・ItemList/BreadcrumbList構造化データ」を付与。
 * 本体UI（店舗一覧）は既存 PrefecturePage がそのまま担う。
 */
import React from 'react';
import Head from 'next/head';
import { createServerSupabase } from '../../server/supabaseServer';
import PrefecturePage from '../../src/pages/PrefecturePage';
import { PREF_SLUG_MAP } from '../../src/data/areaLinks';
import { getDisplayName } from '../../src/utils/shopHelpers';
import { buildBrands, countRoomsByBrand, brandCanonicalPath } from '../../src/utils/brandGroups.js';
import { peopleInPrefecture, personLinkProps, canonicalPathMap } from '../../src/utils/reviewedPeople.js';
import { loadReviewedPeople } from '../../server/reviewedPeople.js';

// 県リストは src/data/areaLinks.js に集約（4箇所に散らばって soft404 を生んだため）
const PREF_MAP = PREF_SLUG_MAP;

export async function getServerSideProps({ params, res }) {
  // CDNキャッシュ＝一度開かれたエリアページは次から即返る。副作用なし・全員共通HTMLなので安全。
  // ⚠️SWRを1日にするとデプロイ後に古いHTML→消えた古いJSチャンク404→真っ黒になる。stale窓は短く（最大2分）。
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  const pref = params.pref;
  const prefName = PREF_MAP[pref] || null;
  if (!prefName) return { notFound: true };

  const supabase = createServerSupabase(process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    // ── 速度（2026-09-23 実測）──────────────────────────────────────
    // 以前は ①この県の店を raw_data 丸ごと ②全店のルーム数 ③口コミ を**順番に**取っていた。
    // raw_data は1店あたり約1.5KB（東京は497店で約750KB）あり、使うのは地名の4項目だけ。
    // 押してからの待ちは実測 391〜931ms（ほかのページは200〜300ms）。
    // ⇒ 地名の4項目だけを取り（中身の形は同じ raw_data に組み直す）、①と②を同時に取る。
    // ⚠️ 取り出した値が null の項目は raw_data に入れない（以前の「キーが無い」と同じ形にする）。
    const fetchAllRooms = async () => {
      // ⚠️ PostgRESTは1回に最大1000行。店舗は1,000件を超えているので必ず繰ること。
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const page = await supabase.from('shops').select('id, group_id').range(from, from + 999);
        if (page.error) throw page.error;
        rows.push(...(page.data || []));
        if (!page.data || page.data.length < 1000) break;
      }
      return rows;
    };
    const [shopsRes, allRooms, people, latestRes] = await Promise.all([
      supabase
        .from('shops')
        .select('id, name, group_id, prefecture:raw_data->prefecture, city:raw_data->city, area:raw_data->area, address:raw_data->address')
        .eq('raw_data->>prefecture', prefName)
        .limit(1000),
      fetchAllRooms(),
      // 口コミがある人（全国）。取れなくてもページは落とさない（[] が返る）。
      loadReviewedPeople(supabase),
      // 最新の口コミ（下で、この県のルームの口コミだけに絞る）。
      // ⚠️ 以前は `.in('shop_id', ブランドの代表ルームのid)` で引いていたので、**代表以外のルームで
      //    書かれた口コミが県ページに一度も出なかった**。全体の新しい順から県のルームで絞る。
      //    条件はサイトマップ・人物ページと同じ（is_public か owner_manual）。
      supabase
        .from('reviews')
        .select('shop_id, therapist_id, therapist_name, rating, content, created_at')
        .or('is_public.eq.true,user_id.eq.owner_manual')
        .not('therapist_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(300),
    ]);
    if (latestRes.error) throw latestRes.error;
    if (shopsRes.error) throw shopsRes.error;
    const shops = (shopsRes.data || []).map(({ prefecture, city, area, address, ...row }) => {
      const raw_data = {};
      for (const [k, v] of Object.entries({ prefecture, city, area, address })) {
        if (v != null) raw_data[k] = v;
      }
      return { ...row, raw_data };
    });

    // ⚠️ 支店レコードをそのまま並べると、同じブランドが何度も出る
    //    （実測: AROMA EMERALD は中身が完全に同じ4レコード）。
    //    セラピストは店舗ではなくブランドに属するので、一覧もブランド単位にする。
    // ⚠️ この県のルームだけが渡るので、地名もこの県ぶんになる（エリアページとして正しい）。
    // 🚩 ルーム数は**全店**で数える（2026-09-16）。
    //    この画面はその県の店だけを引くので、ここで数えると県をまたぐブランドが
    //    「1ルーム」になり、本命URLが店舗URLになる。ところが301の判定は全体のルーム数で
    //    見るので、**押した瞬間に301でブランドページへ飛ぶリンク**ができる
    //    （THE HALF に横浜ルームを足して実際に出た）。
    //    （全店のルーム数は上で県の店と同時に取っている＝ fetchAllRooms）
    const roomCountMap = countRoomsByBrand(allRooms);
    // ⚠️ propsはJSONにされるので Map は渡せない。素のオブジェクトにする。
    const initialRoomCounts = Object.fromEntries(roomCountMap);

    const shopList = buildBrands(shops || []).map((b) => ({
      id: b.primaryShopId || b.id,
      // 🚩 group_id を落とさないこと。落とすと画面側で組み直したとき全部が単独店になり、
      //    本命URLが店舗URLに倒れる（＝押すと301する）。
      group_id: b.id,
      name: b.name,
      // 🚩 リンク先はここで決める（2026-09-16）。下のクロール経路は以前 `/shops/${s.id}` を
      //    **直書き**していて `brandCanonicalPath` を通っていなかった。
      //    D-014以降、複数ルームのブランドの店舗URLは**301でブランドページへ飛ぶ**ので、
      //    孤立ページ解消のために作ったクロール経路が**リダイレクトを指していた**。
      //    ⚠️ ルーム数は全店で数えた表から取る（この県の店だけでは県をまたぐブランドが1になる）。
      href: brandCanonicalPath(
        { id: b.id, primaryShopId: b.primaryShopId || b.id, roomCount: b.roomCount },
        roomCountMap,
      ),
      // 全ルームの地名。「渋谷にもあるブランド」が渋谷で見つかるために要る。
      city: (b.areaLabels || []).join('・') || b.city || '',
    }));
    const shopCount = shopList.length;

    const areaCount = {};
    // 1ブランドが複数エリアに出るので、エリアごとに数える（連結文字列のままだと数えられない）
    for (const s of shopList) {
      for (const a of (s.city ? s.city.split('・') : ['その他'])) {
        areaCount[a] = (areaCount[a] || 0) + 1;
      }
    }
    const topAreas = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([a]) => a);

    // 口コミのリンク先は、その人の正規URL（同じ人の別ルームのURLを指さない・src/utils/reviewedPeople.js）。
    const toCanonical = canonicalPathMap(people);
    const canonicalOf = (path) => toCanonical.get(path) || path;

    const prefRoomIds = new Set(shops.map((s) => s.id));
    const roomNameById = Object.fromEntries(shops.map((s) => [s.id, s.name]));
    const brandNameById = Object.fromEntries(buildBrands(shops).flatMap((b) => (b.shopIds || [b.primaryShopId || b.id]).map((id) => [id, b.name])));
    const latestReviews = (latestRes.data || [])
      .filter((r) => prefRoomIds.has(r.shop_id))
      .slice(0, 6)
      .map((r) => ({
        path: canonicalOf(`/shops/${r.shop_id}/threads/${r.therapist_id}`),
        therapistName: r.therapist_name || '',
        shopName: brandNameById[r.shop_id] || roomNameById[r.shop_id] || '', rating: r.rating || null,
        snippet: (r.content || '').replace(/\s+/g, '').slice(0, 60),
      }));

    // 🚩 この県で口コミがある人の**全員**（2026-10-10）。口コミページへの本文からのリンクが
    //    平均1.8本しかなく、「最新の口コミ」の6件の枠は次の口コミが入ると押し出される。
    //    ここは消えない。⚠️ 上限は200人（それを超えたら下に「ほかN人」と出す＝黙って切らない）。
    const prefPeople = peopleInPrefecture(people, prefName);
    const reviewedPeople = prefPeople.slice(0, 200).map(personLinkProps);
    const reviewedPeopleTotal = prefPeople.length;

    // 複数ルームのブランドのルーム数（全店で数えたもの）。最初のHTMLのリンク先を決めるため
    // _app → DataProvider に渡す（server/roomCounts.js と同じ形＝2ルーム以上だけ）。
    const ssrRoomCounts = Object.fromEntries([...roomCountMap].filter(([, n]) => n > 1));

    return {
      props: {
        ssr: { prefName, pref, shopCount, topAreas, shopList: shopList.slice(0, 60), latestReviews, reviewedPeople, reviewedPeopleTotal, initialRoomCounts },
        ssrRoomCounts,
      },
    };
  } catch (e) {
    console.error('[SSR Area]', e.message);
    // DB障害を「店舗0件」の正常ページとしてキャッシュしない。実在ページは保持し、
    // クローラーとCDNへ一時障害であることを明示する。
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '120');
    return { props: { ssr: null } };
  }
}

export default function AreaSSRPage({ ssr }) {
  const SITE = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';
  if (!ssr) return <PrefecturePage />;

  const { prefName, pref, shopCount, topAreas, shopList, latestReviews, reviewedPeople = [], reviewedPeopleTotal = 0, initialRoomCounts = {} } = ssr;
  const canonical = `${SITE}/area/${pref}`;
  const title = `${prefName}のメンズエステ${shopCount}店舗・口コミ | メンエスマップ`;
  const description = `${prefName}のメンズエステ${shopCount}店舗（${topAreas.slice(0, 3).join('・')}など）を掲載。セラピスト情報・口コミ・料金・出勤スケジュールをチェック。`;

  const itemListLd = shopList.length ? {
    '@context': 'https://schema.org', '@type': 'ItemList',
    // ⚠️ s.href＝D-014 の本命URL。`/shops/${s.id}` は複数ルームのブランドだと301する。
    itemListElement: shopList.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.name, url: `${SITE}${s.href || `/shops/${s.id}`}` })),
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

      <PrefecturePage
        initialPrefName={prefName}
        initialShops={shopList}
        initialRoomCounts={initialRoomCounts}
        initialShopCount={shopCount}
        renderSeo={false}
      />

      {/* 店舗ページへのクロール経路（SSR・最重要）
          ⚠️ これまで1,098の店舗ページには内部リンクが1本も無く、サイトマップだけが
             発見経路だった（＝孤立ページ化）。GSCの「クロール済み-インデックス未登録346件」
             の正体。JSON-LDのItemListは同じURLを持っているのにHTMLのリンクが0本、という
             状態を解消する。PrefecturePage側の店舗グリッドはクライアント描画なので
             Googlebotには見えない＝ここをSSRで出すことに意味がある。 */}
      {shopList.length > 0 && (
        <section className={`max-w-5xl mx-auto px-4 -mt-4 ${latestReviews.length > 0 || reviewedPeople.length > 0 ? 'pb-6' : 'pb-28'}`}>
          <div className="rounded-sm border border-white/10 bg-slate-900 p-4">
            <h2 className="text-base font-black text-white mb-3">{prefName}の掲載店舗</h2>
            <ul className="flex flex-wrap gap-2">
              {shopList.slice(0, 30).map((s) => (
                <li key={s.id}>
                  <a
                    href={s.href || `/shops/${s.id}`}
                    className="inline-block text-xs text-slate-300 hover:text-pink-300 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-full px-3 py-1.5 transition"
                  >
                    {getDisplayName(s.name, s)}
                    {s.city ? <span className="text-slate-500 ml-1">({s.city})</span> : null}
                  </a>
                </li>
              ))}
            </ul>
            {shopCount > 30 && (
              <p className="text-[11px] text-slate-500 mt-3">
                ほか{shopCount - 30}店舗を掲載中
              </p>
            )}
          </div>
        </section>
      )}

      {/* Tier 2-1: エリアの最新の本物口コミ（SSR・エリアページに一次コンテンツ＋口コミページへの内部リンク） */}
      {latestReviews.length > 0 && (
        <section className={`max-w-5xl mx-auto px-4 -mt-4 ${reviewedPeople.length > 0 ? 'pb-6' : 'pb-28'}`}>
          <div className="rounded-sm border border-white/10 bg-slate-900 p-4">
            <h2 className="text-base font-black text-white mb-3">{prefName}の最新の口コミ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {latestReviews.map((r, i) => (
                <a
                  key={i}
                  href={r.path}
                  className="block rounded-sm border border-white/10 bg-slate-800 hover:border-pink-500/40 transition p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white truncate">{r.therapistName}</span>
                    {r.rating != null && <span className="font-numeral text-lg text-slate-50 shrink-0 ml-2">{Number(r.rating).toFixed(1)}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1 truncate">{r.shopName}</div>
                  <p className="text-xs text-slate-400 line-clamp-2">{r.snippet}…</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 🚩 この県で口コミがある人の全員（2026-10-10・SSR）。口コミページへの消えない本文リンク。 */}
      {reviewedPeople.length > 0 && (
        <section aria-labelledby="area-reviewed-heading" className="max-w-5xl mx-auto px-4 pb-28 -mt-4">
          <div className="rounded-sm border border-white/10 bg-slate-900 p-4">
            <h2 id="area-reviewed-heading" className="text-base font-black text-white mb-3">
              {prefName}で口コミがあるセラピスト<span className="ml-2 text-xs font-normal text-slate-500">全{reviewedPeopleTotal}人</span>
            </h2>
            <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviewedPeople.map((p) => (
                <li key={p.path} className="border-b border-slate-800">
                  <a href={p.path} className="flex min-h-11 items-center gap-2 text-sm text-slate-200 transition hover:text-pink-300">
                    <span className="min-w-0 truncate">
                      {p.name}
                      <span className="ml-2 text-xs text-slate-500">{[p.shopName, p.area].filter(Boolean).join('・')}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {reviewedPeopleTotal > reviewedPeople.length && (
              <p className="text-[11px] text-slate-500 mt-3">ほか{reviewedPeopleTotal - reviewedPeople.length}人</p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
