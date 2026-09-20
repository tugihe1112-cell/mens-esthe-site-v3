/**
 * BrandPage — ブランドの本命ページ
 *
 * 【設計（2026-09-14 オーナー確認）】
 * 利用者が読みたいのは「アロマモアというブランドと、そこにいるセラピスト」の口コミ。
 * **セラピストは店舗に所属していない。ブランドに属している。**
 * 咲さんは渋谷店だろうが代々木店だろうが同じ咲さんで、口コミもその人のもの。
 *
 * ⚠️ したがって、このページで**支店を主役にしない**。
 *    以前は系列店を大きなカードで並べ、店名を「◯◯ Group」と作り、
 *    さらに固定の「★ New」（F06-Bで他画面から消した表示）と
 *    英語UI（Official Group / VIEW SHOP）が残っていた。全部やめた。
 *    ルームは「どこにあるか」が分かればよいので1行にまとめる。
 *
 * ⚠️ 地名は全ルームぶん出す。「渋谷で検索した人に引っかかる」ために支店レコードが
 *    存在するので、ブランド1枚になっても地名を落としてはいけない。
 */
import React from 'react';
import { useParams, Link } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import Header from '../components/Header.jsx';
import LazyImage from '../components/LazyImage.jsx';
import SeoHead from '../components/SeoHead.jsx';
import LocationLabel from '../components/LocationLabel.jsx';
import { buildBrands, buildBrandRoster, brandCanonicalPath, brandCommonValue } from '../utils/brandGroups.js';
import { getTherapistDisplayName } from '../utils/shopHelpers.js';
import { buildTherapistReviewIndex, reviewsForTherapist, summarizeReviews, normalizeTherapistName } from '../utils/reviewIdentity.js';
import { TAG_CATEGORIES as TAG_SOURCE } from '../data/constants';
import { TagFilterSidebar, TagFilterButton } from '../components/TagFilterSidebar.jsx';
import { authHeaders } from '../utils/supabaseRest';
import { ShopStatusChip } from '../components/ShopStatusBanner.jsx';

const fmtDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

const ROSTER_PAGE = 24;
const TAG_CATEGORIES = TAG_SOURCE.map((c) => ({ id: c.id, title: c.titleEn, tags: c.tags }));

export default function BrandPage({
  ssrBrand = null,
  ssrTherapistCount = 0,
  ssrReviewedTherapists = [],
  ssrReviews = [],
  ssrReviewCount = 0,
  ssrAvgRating = null,
  ssrRoster = [],
  ssrRosterTruncated = false,
  ssrNearbyBrands = [],
  ssrNearbyScope = 'prefecture',
  ssrArea = null,
  ssrPrefecture = null,
  renderSeo = true,
}) {
  const { brandId } = useParams();
  const { shops, loading, getTherapistsByShopId } = useShopData();

  // SSRで渡ってきたブランドを優先。クライアント単体で開かれたときだけ組み立てる。
  const brand = React.useMemo(() => {
    if (ssrBrand) return ssrBrand;
    if (!shops || shops.length === 0) return null;
    const rooms = shops.filter((s) => s.group_id === brandId || s.id === brandId);
    return rooms.length ? buildBrands(rooms)[0] : null;
  }, [ssrBrand, shops, brandId]);

  // 🚩 在籍セラピストを**このページ自身で取りに行く**（2026-09-19）。
  //    SSRが焼くのは先頭24名だけ（420名規模のブランドがありHTMLを膨らませない）。
  //    以前は残りを DataContext の getTherapistsByShopId から拾うつもりだったが、
  //    **DataContext の therapists は最初から空**で、`loadTherapistsForShop` を呼んだ店の分しか入らない。
  //    ブランドページはそれを呼んでいないので、**「もっと見る」を入れても24名のままだった**
  //    （2026-09-19、本番で確かめて発覚。手元のガードでは分からない種類の欠落）。
  //    ⚠️ DataContext 側の取得は `image_url` があるものだけを拾う作りなので、呼んでも写真なしの人は落ちる。
  //       「写真が無い人も出す」（2026-09-16の決定）と食い違うため、ここでは自前で取る。
  //    ⚠️ PostgRESTは1回に最大1000行。420名規模のブランドがあるのでページ送りする。
  const [cloudRoster, setCloudRoster] = React.useState(null);
  const [therapistReviewCounts, setTherapistReviewCounts] = React.useState({});
  const [reviewTagMap, setReviewTagMap] = React.useState({});
  React.useEffect(() => {
    const ids = ssrBrand?.shopIds || brand?.shopIds || (brand?.rooms || []).map((r) => r.id);
    if (!ids || !ids.length) return undefined;
    let alive = true;
    (async () => {
      try {
        const base = process.env.VITE_SUPABASE_URL;
        const headers = await authHeaders();
        const inList = ids.map((v) => `"${v}"`).join(',');
        const rows = [];
        for (let from = 0; ; from += 1000) {
          const res = await fetch(
            `${base}/rest/v1/therapists?select=id,name,image_url,shop_id,is_active&shop_id=in.(${inList})`,
            { headers: { ...headers, Range: `${from}-${from + 999}` }, cache: 'no-store' },
          );
          if (!res.ok) break;
          const page = await res.json();
          if (!Array.isArray(page) || !page.length) break;
          rows.push(...page);
          if (page.length < 1000) break;
        }
        if (alive && rows.length) setCloudRoster(rows);

        // 🚩 タグと口コミ順に要る「人物ごとの口コミ件数・タグ」を作る。
        //    ⚠️ キーは therapist_id。名前キーは系列店の**同名の別人**を1人に束ねる（F04）。
        //    ⚠️ 本文は要らないので列を絞る（名簿と違いここは件数とタグだけ）。
        const cRes = await fetch(
          `${base}/rest/v1/reviews?shop_id=in.(${inList})&select=therapist_id,shop_id,therapist_name,tags`,
          { headers, cache: 'no-store' },
        );
        if (cRes.ok) {
          const cData = await cRes.json();
          if (alive && Array.isArray(cData)) {
            const list = (rows.length ? rows : []).map((t) => ({ id: t.id, shop_id: t.shop_id, name: t.name }));
            const index = buildTherapistReviewIndex(cData, list);
            const counts = {};
            const tagMap = {};
            for (const t of list) {
              const summary = summarizeReviews(reviewsForTherapist(index, t.id));
              counts[t.id] = summary.count;
              tagMap[t.id] = summary.tags;
            }
            setTherapistReviewCounts(counts);
            setReviewTagMap(tagMap);
          }
        }
      } catch {
        // 取れなくてもSSRの24名は出ている。ここで画面を壊さない。
      }
    })();
    return () => { alive = false; };
  }, [ssrBrand, brand]);

  // 在籍セラピスト。SSRは先頭24名だけ焼いてある（420名規模のブランドがあるためHTMLを膨らませない）。
  // クライアントでは全ルームぶんを集めて**人単位**で重複除去する。
  // ⚠️ 咲さんは渋谷店にも代々木店にも行を持つ。素直に並べると同じ人が並ぶ。
  const roster = React.useMemo(() => {
    const ids = ssrBrand?.shopIds || brand?.shopIds || (brand?.rooms || []).map((r) => r.id);
    // 自前で取れていればそれを使う。まだなら DataContext にあるぶんで間に合わせる。
    const fromContext = cloudRoster && cloudRoster.length
      ? cloudRoster
      : (getTherapistsByShopId ? (ids || []).flatMap((id) => getTherapistsByShopId(id) || []) : []);
    // ⚠️ SSRで焼いた分を先に置く（初期表示と並びを変えない）。
    //    重複除去は buildBrandRoster に一本化する＝画面側で別の畳み方を書くと
    //    「咲さんが3ルームぶん3回出る」が片側だけ復活する。
    // 🚩 打ち切らずに全員を作る（2026-09-19）。
    //    以前はここで24名に切っており、**126名いても24名しか見られなかった**。
    //    D-014で店舗ページをここへ301した結果、店舗ページにあった「もっと見る」が
    //    多ルームのブランド（1,095店中370店）で丸ごと失われていた。
    //    ⚠️ SSRが焼くのは先頭24名のまま（420名規模のブランドがあるためHTMLを膨らませない）。
    //       画面側は displayCount で伸ばす。初期値を24にしてあるので初期表示は変わらない。
    return buildBrandRoster([...(ssrRoster || []), ...fromContext], { limit: Number.MAX_SAFE_INTEGER }).roster;
  }, [ssrRoster, ssrBrand, brand, getTherapistsByShopId, cloudRoster]);

  // ── 名簿の絞り込みと並び替え（店舗ページから移植）─────────────────
  // ⚠️ 人物名の正規化は reviewIdentity に一本化する。独自に書くと
  //    「ｱｲ」と「アイ」が別人になる（店舗ページと同じ約束）。
  const [displayCount, setDisplayCount] = React.useState(ROSTER_PAGE);
  const [castNameFilter, setCastNameFilter] = React.useState('');
  const [castSortOrder, setCastSortOrder] = React.useState('default');
  const [selectedTags, setSelectedTags] = React.useState([]);
  // スマホでタグの列を開くシート（PCでは常に左に出ている）
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  // 付いているタグの件数。0件のタグも出す（店舗ページと同じ＝選べる幅を隠さない）。
  const tagCounts = React.useMemo(() => {
    const counts = {};
    TAG_CATEGORIES.forEach((cat) => cat.tags.forEach((t) => { counts[t] = 0; }));
    for (const t of roster) {
      const tags = reviewTagMap[t.id] || new Set();
      for (const tag of tags) if (counts[tag] !== undefined) counts[tag] += 1;
    }
    return counts;
  }, [roster, reviewTagMap]);

  const sortedRoster = React.useMemo(() => {
    let list = [...roster];
    if (selectedTags.length > 0) {
      list = list.filter((t) => {
        const tags = reviewTagMap[t.id] || new Set();
        return selectedTags.every((sel) => tags.has(sel));
      });
    }
    if (castNameFilter.trim()) {
      const f = normalizeTherapistName(castNameFilter);
      list = list.filter((t) => normalizeTherapistName(t.name).includes(f));
    }
    if (castSortOrder === 'aiueo') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
    } else if (castSortOrder === 'reviews') {
      list.sort((a, b) => (therapistReviewCounts[b.id] || 0) - (therapistReviewCounts[a.id] || 0));
    }
    // ⚠️ 既定（標準）は並べ替えない。buildBrandRoster が写真ありを先に並べた順を保つ
    //    （崩すとプレースホルダばかりが先頭に来る）。
    return list;
  }, [roster, castNameFilter, castSortOrder, selectedTags, reviewTagMap, therapistReviewCounts]);

  const visibleRoster = sortedRoster.slice(0, displayCount);
  const hasMoreRoster = displayCount < sortedRoster.length;

  if (!brand && loading) {
    return (<><SeoHead title="店舗ブランド" noindex /><div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">読み込み中...</div></>);
  }
  if (!brand) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans">
        <SeoHead title="ブランドが見つかりません" noindex />
        <Header />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-black mb-3">ブランドが見つかりません</h1>
          <p className="text-slate-400 text-sm mb-6">このページは削除されたか、URLが変わった可能性があります。</p>
          <Link to="/search" className="inline-block bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 py-3 rounded-xl transition">セラピストを探す</Link>
        </div>
      </div>
    );
  }

  const rooms = brand.rooms || [];

  // 店舗情報。**揃っていれば1つ、割れていれば「ルームにより異なります」**（2026-09-19 オーナー決定）。
  // ⚠️ 判定は brandCommonValue に一本化する。ここで別の比較を書くと、
  //    測定ツール（inspect_brand_room_consistency）と食い違って「画面と数字が合わない」になる。
  // ⚠️ 表記ゆれ（末尾スラッシュ・波ダッシュ）は衝突に数えない。実測でそれが大半だった。
  const shopInfo = (() => {
    const out = [];
    const add = (label, get, asLink) => {
      const r = brandCommonValue(rooms, get);
      if (r.status === 'none') return;
      if (r.status === 'varies') { out.push({ label, varies: true }); return; }
      out.push({ label, varies: false, text: r.value, href: asLink ? r.value : null });
    };
    add('営業時間', (r) => r.businessHours);
    add('料金', (r) => r.priceSystem);
    add('公式サイト', (r) => r.websiteUrl, true);
    add('出勤', (r) => r.scheduleUrl, true);
    return out;
  })();
  const areaLabels = brand.areaLabels || [];
  // 口コミ投稿の宛先は実在の店舗ID。ブランドIDを渡すと投稿画面が店舗を引けない。
  const reviewShopId = brand.primaryShopId || rooms[0]?.id || brand.id;
  // ⚠️ 見出しは実際に使った集合に合わせる（F06-C）。同県へ広げたのに地域名で書かない。
  const nearbyHeading = ssrNearbyScope === 'area' && ssrArea
    ? `${ssrArea}の他のブランド`
    : (ssrPrefecture ? `${ssrPrefecture}の他のブランド` : '他のブランド');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-24">
      {renderSeo && (
        <SeoHead
          title={brand.name}
          description={`${brand.name}の在籍セラピスト・口コミ・体験談。`}
          path={`/brands/${brand.id}`}
        />
      )}
      <Header />

      <div className="relative">
        {brand.image_url && (
          <div className="absolute inset-0 overflow-hidden">
            <LazyImage src={brand.image_url} alt="" className="w-full h-full object-cover opacity-20 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 to-slate-950"></div>
          </div>
        )}
        <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-8">
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">{brand.name}</h1>
          <ShopStatusChip shop={brand} className="mb-3" />
          {/* 全ルームの地名。ここを落とすと「代々木で検索しても出ない」になる。 */}
          <LocationLabel as="p" className="text-slate-300 text-sm mb-4" parts={areaLabels} />
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {rooms.length > 1 && (
              <span className="bg-slate-800 border border-white/10 rounded-full px-3 py-1.5 text-slate-300">{rooms.length}ルーム</span>
            )}
            {ssrTherapistCount > 0 && (
              <span className="bg-slate-800 border border-white/10 rounded-full px-3 py-1.5 text-slate-300">セラピスト{ssrTherapistCount}名</span>
            )}
            {/* ⚠️ 口コミが0件のときに件数も★も出さない。根拠のない数字を作らない（D-010の考え方）。 */}
            {ssrReviewCount > 0 && (
              <span className="bg-pink-600/20 border border-pink-500/30 rounded-full px-3 py-1.5 text-pink-200">
                口コミ{ssrReviewCount}件{ssrAvgRating ? ` ★${ssrAvgRating}` : ''}
              </span>
            )}
          </div>
          {/* ⚠️ 口コミ投稿の導線は必ず残す。店舗ページには「口コミを書く」があり、
              ここに無いまま店舗ページを畳むとサイトの一次コンテンツの入口が消える。 */}
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              to={`/shops/${reviewShopId}/review`}
              className="inline-block bg-pink-600 hover:bg-pink-500 text-white font-black text-sm px-5 py-3 rounded-xl transition"
            >
              ✍️ 口コミを書く
            </Link>
          </div>
          {brand.website_url && (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-5 bg-white text-slate-900 hover:bg-slate-200 font-black text-sm px-5 py-3 rounded-xl transition"
            >
              公式サイトで最新情報を見る
            </a>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 space-y-10">
        {ssrReviewedTherapists.length > 0 && (
          <section>
            <h2 className="text-base font-black text-white mb-3">口コミがあるセラピスト</h2>
            <ul className="flex flex-wrap gap-2">
              {ssrReviewedTherapists.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/shops/${t.shopId}/threads/${t.id}`}
                    className="inline-block text-xs text-slate-200 hover:text-pink-300 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-full px-3 py-1.5 transition"
                  >
                    {t.name}{t.rating ? <span className="text-yellow-400 ml-1">★{t.rating}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {ssrReviews.length > 0 && (
          <section>
            <h2 className="text-base font-black text-white mb-3">口コミ</h2>
            <div className="space-y-3">
              {ssrReviews.map((r) => (
                <article key={r.id} className="bg-slate-900 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    {r.therapist_name && <span className="font-bold text-slate-200">{r.therapist_name}</span>}
                    {r.rating > 0 && <span className="text-yellow-400 font-bold">★{r.rating}</span>}
                    <span className="ml-auto">{fmtDate(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed line-clamp-5">{r.content}</p>
                  {r.therapist_id && (
                    <Link to={`/shops/${r.shop_id}/threads/${r.therapist_id}`} className="inline-block mt-2 text-xs font-bold text-pink-300 hover:text-pink-200">
                      この口コミの全文を読む
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 在籍セラピスト＝このページの本体。
            ⚠️ セラピストは店舗ではなくブランドに属する。全ルームぶんを1つの名簿として出す。
            ⚠️ SSR分だけでも初期HTMLに名前とリンクが載る（D-013: JS実行前に本文と内部リンク）。 */}
        {roster.length > 0 && (
          <section>
            {/* 🚩 左にタグの列・真ん中にキャスト一覧（D-001・オーナー確定デザイン）。
                D-014でここへ301した以上、店舗ページと**同じ見え方**でなければ畳んだ意味がない。
                ⚠️ 2026-09-19の「移植」では機能だけ移して形を移しておらず、
                   370店（34%）がこの列を失っていた。二度とやらないため**同じ部品**を描く。
                ⚠️ 条件で出し分けない（タグ0件でも名簿が何人でも常に出す）。 */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
            <TagFilterSidebar
              tagCounts={tagCounts}
              selectedTags={selectedTags}
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              onToggle={(tag) => {
                setDisplayCount(ROSTER_PAGE);
                setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
              }}
              onClear={() => { setSelectedTags([]); setDisplayCount(ROSTER_PAGE); }}
            />

            <div className="min-w-0">
            <TagFilterButton selectedCount={selectedTags.length} onOpen={() => setIsFilterOpen(true)} />
            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className="text-base font-black text-white">
                在籍セラピスト
                {ssrTherapistCount > 0 && <span className="ml-2 text-xs font-bold text-slate-500">{ssrTherapistCount}名</span>}
              </h2>
              {/* ⚠️ 絞り込み中は「N / 全M人」。店舗ページと同じ出し方に揃える。 */}
              <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-slate-300 shrink-0">
                {(castNameFilter || selectedTags.length > 0) ? `${sortedRoster.length} / ` : ''}全{roster.length}人
              </span>
            </div>

            {/* 名前で絞り込み＋並び替え（店舗ページから移植・2026-09-19）。
                D-014で店舗ページをここへ301した結果、多ルームのブランドでは
                この操作が丸ごと失われていた。 */}
            {/* ⚠️ 条件で出し分けない（D-001）。人数が少ない店だけ別レイアウトにしない。 */}
            {true && (
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="search"
                  value={castNameFilter}
                  onChange={(e) => { setCastNameFilter(e.target.value); setDisplayCount(ROSTER_PAGE); }}
                  placeholder="セラピスト名で絞り込み"
                  className="flex-1 min-w-0 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50"
                />
                <div className="flex gap-1 shrink-0">
                  {[{ v: 'default', label: '標準' }, { v: 'aiueo', label: '五十音' }, { v: 'reviews', label: '💬 口コミ' }].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setCastSortOrder(o.v)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${castSortOrder === o.v ? 'bg-pink-600 text-white border-pink-500' : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/30'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {visibleRoster.map((t) => (
                <Link
                  key={t.id}
                  to={`/shops/${t.shopId || reviewShopId}/threads/${t.id}`}
                  className="group bg-slate-900 rounded-xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-slate-800">
                    <LazyImage src={t.image_url} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  {/* ⚠️ ブランド名は外して出す（店舗ページと同じ。人名が読みにくくなるため） */}
                  <p className="text-[11px] text-slate-300 group-hover:text-pink-300 font-bold px-2 py-1.5 truncate">{getTherapistDisplayName(t.name, brand?.name)}</p>
                </Link>
              ))}
            </div>
            {/* ⚠️ ここに「写真を確認できるセラピストを表示しています」と書いてはいけない（2026-09-16）。
                名簿は写真の有無で絞っていない（buildBrandRoster）。書くと**画面が嘘をつく**。
                ⚠️ 「一部を表示しています」も、もっと見るで全員見られる今は不正確。
                   残りが何人かを出して、押せば見られることを示す。 */}
            {hasMoreRoster && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setDisplayCount((n) => n + ROSTER_PAGE)}
                  className="px-6 py-2.5 rounded-full bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 hover:text-white transition border border-white/5"
                >
                  もっと見る (+{sortedRoster.length - displayCount})
                </button>
              </div>
            )}
            {(castNameFilter || selectedTags.length > 0) && sortedRoster.length === 0 && (
              <p className="text-xs text-slate-500 mt-3">条件に一致するセラピストはいません。</p>
            )}
            </div>
            </div>
          </section>
        )}

        {/* 店舗情報（店舗ページから移植・2026-09-19）。
            【方針】**揃っていれば1つ出す。割れていれば「ルームにより異なります」と出す。**
            ⚠️ 割れているのに1つだけ選んで出すのは、根拠のない値を画面に出すのと同じ（D-010）。
            ⚠️ 住所はここに出さない。実測で**71%のブランドがルームごとに違う**＝共通にできない。
               住所は下の「ルーム」欄に各ルームで添える。 */}
        {shopInfo.length > 0 && (
          <section>
            <h2 className="text-base font-black text-white mb-3">店舗情報</h2>
            <dl className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
              {shopInfo.map((row) => (
                <div key={row.label} className="grid grid-cols-[84px_1fr] items-baseline gap-2">
                  <dt className="text-[11px] font-black text-slate-500 tracking-widest">{row.label}</dt>
                  <dd className="text-sm text-white whitespace-pre-wrap break-words">
                    {row.varies
                      ? <span className="text-slate-400">ルームにより異なります（公式サイトでご確認ください）</span>
                      : (row.href
                          ? <a href={row.href} target="_blank" rel="noopener noreferrer nofollow" className="text-pink-300 hover:text-pink-200 underline break-all">{row.text}</a>
                          : row.text)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* ルームは「どこにあるか」が分かればよい。支店を主役にしない。 */}
        {rooms.length > 0 && (
          <section>
            <h2 className="text-base font-black text-white mb-3">ルーム</h2>
            {/* ⚠️ ルームはリンクにしない（D-014）。
                複数ルームの店舗ページはこのページへ301するので、リンクにすると
                「押す → 301 → 同じページに戻る」という往復になる。
                ここで見せたいのは「どこにルームがあるか」であって支店ページではない。 */}
            <ul className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <li
                  key={r.id}
                  className="inline-block text-xs text-slate-300 bg-slate-900 border border-white/10 rounded-full px-3 py-1.5"
                >
                  {r.area || r.city || r.prefecture || 'ルーム'}
                  {/* ⚠️ 住所はルームごと（実測で71%が違う）。ここでしか出せない。 */}
                  {r.address && <span className="ml-1.5 text-slate-500">{r.address}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 同エリア他ブランド＝回遊とクロールの経路。
            ⚠️ 店舗ページの「他の店舗」に相当する。ここを持たないまま店舗ページを畳むと
               エリアページ→店舗の内部リンクで索引を戻した経緯（D-001 補足）を細らせる。
            ⚠️ 送り先は店舗ではなくブランド。店舗へ送ると同じブランドの支店が並ぶ。 */}
        {ssrNearbyBrands.length > 0 && (
          <section>
            <h2 className="text-base font-black text-white mb-3">{nearbyHeading}</h2>
            <ul className="flex flex-wrap gap-2">
              {ssrNearbyBrands.map((b) => (
                <li key={b.id}>
                  <Link
                    to={brandCanonicalPath(b)}
                    className="inline-block text-xs text-slate-300 hover:text-pink-300 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-full px-3 py-1.5 transition"
                  >
                    {b.name}
                    {b.areaLabel && <span className="text-slate-500 ml-1">{b.areaLabel}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
