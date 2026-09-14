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
import { buildBrands } from '../utils/brandGroups.js';
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
  renderSeo = true,
}) {
  const { brandId } = useParams();
  const { shops, loading } = useShopData();

  // SSRで渡ってきたブランドを優先。クライアント単体で開かれたときだけ組み立てる。
  const brand = React.useMemo(() => {
    if (ssrBrand) return ssrBrand;
    if (!shops || shops.length === 0) return null;
    const rooms = shops.filter((s) => s.group_id === brandId || s.id === brandId);
    return rooms.length ? buildBrands(rooms)[0] : null;
  }, [ssrBrand, shops, brandId]);

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

        {/* ルームは「どこにあるか」が分かればよい。支店を主役にしない。 */}
        {rooms.length > 0 && (
          <section>
            <h2 className="text-base font-black text-white mb-3">ルーム</h2>
            <ul className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/shops/${r.id}`}
                    className="inline-block text-xs text-slate-300 hover:text-pink-300 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-full px-3 py-1.5 transition"
                  >
                    {r.area || r.city || r.prefecture || 'ルーム'}
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
