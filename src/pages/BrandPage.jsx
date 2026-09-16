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
import { buildBrands, buildBrandRoster, brandCanonicalPath } from '../utils/brandGroups.js';
import { ShopStatusChip } from '../components/ShopStatusBanner.jsx';

const fmtDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

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

  // 在籍セラピスト。SSRは先頭24名だけ焼いてある（420名規模のブランドがあるためHTMLを膨らませない）。
  // クライアントでは全ルームぶんを集めて**人単位**で重複除去する。
  // ⚠️ 咲さんは渋谷店にも代々木店にも行を持つ。素直に並べると同じ人が並ぶ。
  const roster = React.useMemo(() => {
    const ids = ssrBrand?.shopIds || brand?.shopIds || (brand?.rooms || []).map((r) => r.id);
    const fromContext = getTherapistsByShopId
      ? (ids || []).flatMap((id) => getTherapistsByShopId(id) || [])
      : [];
    // ⚠️ SSRで焼いた分を先に置く（初期表示と並びを変えない）。
    //    重複除去は buildBrandRoster に一本化する＝画面側で別の畳み方を書くと
    //    「咲さんが3ルームぶん3回出る」が片側だけ復活する。
    return buildBrandRoster([...(ssrRoster || []), ...fromContext], { limit: 24 }).roster;
  }, [ssrRoster, ssrBrand, brand, getTherapistsByShopId]);

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
            <h2 className="text-base font-black text-white mb-3">
              在籍セラピスト
              {ssrTherapistCount > 0 && <span className="ml-2 text-xs font-bold text-slate-500">{ssrTherapistCount}名</span>}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {roster.map((t) => (
                <Link
                  key={t.id}
                  to={`/shops/${t.shopId || reviewShopId}/threads/${t.id}`}
                  className="group bg-slate-900 rounded-xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-slate-800">
                    <LazyImage src={t.image_url} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[11px] text-slate-300 group-hover:text-pink-300 font-bold px-2 py-1.5 truncate">{t.name}</p>
                </Link>
              ))}
            </div>
            {/* ⚠️ ここに「写真を確認できるセラピストを表示しています」と書いてはいけない（2026-09-16）。
                名簿は写真の有無で絞っていない（buildBrandRoster）。書くと**画面が嘘をつく**。
                打ち切っている理由は写真ではなく**24人という上限**。理由のほうを書く。 */}
            {ssrRosterTruncated && roster.length <= (ssrRoster || []).length && (
              <p className="text-xs text-slate-500 mt-2">
                在籍セラピストの一部（{roster.length}名）を表示しています。
              </p>
            )}
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
