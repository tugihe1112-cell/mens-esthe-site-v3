import React, { useMemo } from 'react';
import { useParams, Link } from '../compat/router';
import { useShopData } from '../contexts/DataContext.jsx';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';
import LazyImage from '../components/LazyImage.jsx';
import { getDisplayName } from '../utils/shopHelpers';
import { PREF_SLUG_MAP } from '../data/areaLinks';

// URL slug → 都道府県名（src/data/areaLinks.js に集約）
// ⚠️ 以前はここに独自のリストを持っていたため ibaraki / tochigi / gunma が抜け、
//    サイトマップが submit しているURLがHTTP200で「存在しません」を返す soft404 だった。
const PREF_MAP = PREF_SLUG_MAP;

export default function PrefecturePage({ initialPrefName = null, initialShops = [], initialShopCount = 0 }) {
  const { pref } = useParams();
  const { shops, loading } = useShopData();

  const prefName = initialPrefName || PREF_MAP[pref];

  // 該当都道府県の店舗を絞り込み
  const prefShops = useMemo(() => {
    if (!prefName) return [];
    if (!shops || shops.length === 0) return initialShops;
    return shops.filter(s => {
      const p = s.prefecture || s.raw_data?.prefecture || '';
      return p === prefName || p.includes(prefName.replace(/[都道府県]$/, ''));
    });
  }, [shops, prefName, initialShops]);

  const displayedShopCount = shops?.length > 0 ? prefShops.length : (initialShopCount || prefShops.length);

  // エリア（市区）ごとにグループ化
  const areaGroups = useMemo(() => {
    const groups = {};
    for (const shop of prefShops) {
      const area = shop.area || shop.city || 'その他';
      if (!groups[area]) groups[area] = [];
      groups[area].push(shop);
    }
    return Object.entries(groups).sort(([, a], [, b]) => b.length - a.length);
  }, [prefShops]);

  const title = prefName ? `${prefName}のメンズエステ${displayedShopCount}店舗・口コミ` : 'エリア別メンズエステ';
  const topAreaNames = areaGroups.slice(0, 3).map(([areaName]) => areaName).filter(Boolean);
  const areaSummary = topAreaNames.length ? `${topAreaNames.join('・')}など` : `${prefName || '全国'}各地`;
  const description = prefName
    ? `${prefName}のメンズエステ${displayedShopCount}店舗を掲載。${areaSummary}の店舗、在籍セラピスト、料金、出勤スケジュール、利用者の口コミ・体験談を比較できます。`
    : '';

  if (loading && initialShops.length === 0) {
    return (
      <><SeoHead title={title} description={description} path={`/area/${pref}`} /><div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div></>
    );
  }

  if (!prefName) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <SeoHead title="エリアが見つかりません" noindex />
        <p className="text-slate-400">このエリアページは存在しません。</p>
        <Link to="/" className="text-pink-400 underline">トップへ戻る</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead title={title} description={description} path={`/area/${pref}`} />
      {/* ⚠️ noindex はここ（クライアント）で出してはいけない。
          判定が DataContext の shops 配列に依存していたため、Supabase が一時的に
          落ちている最中に Googlebot が来ると prefShops=0 → 全エリアページに
          noindex が入る事故になる（2026-06-30 に Storage 超過で全API 402 の実績あり）。
          「データが取れなかった時は noindex しない」がフェイルセーフの正しい向きなので、
          店舗数によるnoindex判定はSSR側（pages/area/[pref].jsx の shopCount < 5）に一本化した。 */}
      <Header />

      {/* ページヘッダー */}
      <div className="pt-20 pb-10 px-4 max-w-5xl mx-auto">
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-pink-400 transition">トップ</Link>
          <span>›</span>
          <Link to="/area-search" className="hover:text-pink-400 transition">エリアから探す</Link>
          <span>›</span>
          <span className="text-slate-300">{prefName}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
          {prefName}のメンズエステ
        </h1>
        <p className="text-slate-400 text-sm">
          {displayedShopCount}店舗掲載 · セラピスト情報・口コミ・料金を検索
        </p>

        {/* 検索へのショートカット */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/search?shop=${encodeURIComponent(prefName)}`}
            className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:scale-105 active:scale-95"
          >
            {prefName}のキャストを検索
          </Link>
          <Link
            to="/post-review"
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all border border-white/10"
          >
            口コミを書く
          </Link>
        </div>
      </div>

      {/* エリア別店舗一覧 */}
      <div className="max-w-5xl mx-auto px-4 space-y-12">
        {areaGroups.length === 0 ? (
          <p className="text-slate-500 text-center py-20">このエリアの店舗情報は準備中です。</p>
        ) : (
          areaGroups.map(([areaName, areaShops]) => (
            <section key={areaName}>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-5 bg-pink-500 rounded-full" />
                <h2 className="text-lg font-black text-white">{areaName}</h2>
                <span className="text-xs text-slate-500">{areaShops.length}店舗</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {areaShops.map(shop => (
                  <Link
                    key={shop.id}
                    to={`/shops/${shop.id}`}
                    className="group bg-slate-900/60 border border-white/5 hover:border-pink-500/30 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                  >
                    {shop.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <LazyImage
                          src={shop.image_url}
                          alt={getDisplayName(shop.name)}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="text-white font-black text-sm truncate group-hover:text-pink-400 transition">
                        {getDisplayName(shop.name)}
                      </h3>
                      {shop.city && (
                        <p className="text-slate-500 text-[11px] mt-0.5 truncate">
                          {shop.city}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}

        {/* 他都道府県へのリンク（内部リンク強化） */}
        <section className="pt-8 border-t border-white/5">
          <h2 className="text-base font-black text-white mb-4">他のエリアを探す</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PREF_MAP)
              .filter(([slug]) => slug !== pref)
              .map(([slug, name]) => (
                <Link
                  key={slug}
                  to={`/area/${slug}`}
                  className="text-xs text-slate-400 hover:text-pink-400 bg-slate-900 border border-white/5 hover:border-pink-500/30 px-3 py-1.5 rounded-lg transition"
                >
                  {name}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
