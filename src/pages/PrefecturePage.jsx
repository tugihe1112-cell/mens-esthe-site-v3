import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShopData } from '../contexts/DataContext.jsx';
import Header from '../components/Header.jsx';
import SeoHead from '../components/SeoHead.jsx';
import { Helmet } from 'react-helmet-async';
import LazyImage from '../components/LazyImage.jsx';
import { getDisplayName } from '../utils/shopHelpers';

// URL slug → 都道府県名
const PREF_MAP = {
  'tokyo':     '東京都',
  'osaka':     '大阪府',
  'aichi':     '愛知県',
  'kanagawa':  '神奈川県',
  'saitama':   '埼玉県',
  'chiba':     '千葉県',
  'hyogo':     '兵庫県',
  'kyoto':     '京都府',
  'fukuoka':   '福岡県',
  'miyagi':    '宮城県',
  'shizuoka':  '静岡県',
  'shiga':     '滋賀県',
  'hiroshima': '広島県',
  'hokkaido':  '北海道',
};

// データ閾値: これ未満の店舗数はnoindex
const MIN_SHOPS_FOR_INDEX = 5;

export default function PrefecturePage() {
  const { pref } = useParams();
  const { shops, loading } = useShopData();

  const prefName = PREF_MAP[pref];

  // 該当都道府県の店舗を絞り込み
  const prefShops = useMemo(() => {
    if (!shops || !prefName) return [];
    return shops.filter(s => {
      const p = s.prefecture || s.raw_data?.prefecture || '';
      return p === prefName || p.includes(prefName.replace(/[都道府県]$/, ''));
    });
  }, [shops, prefName]);

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

  const isIndexable = prefShops.length >= MIN_SHOPS_FOR_INDEX;
  const title = prefName ? `${prefName}のメンズエステ | 店舗・口コミ検索` : 'エリア別メンズエステ';
  const description = prefName
    ? `${prefName}のメンズエステ${prefShops.length}店舗を掲載。セラピスト情報・口コミ・料金・出勤スケジュールを検索できます。`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!prefName) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <p className="text-slate-400">このエリアページは存在しません。</p>
        <Link to="/" className="text-pink-400 underline">トップへ戻る</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32 text-slate-200 font-sans">
      <SeoHead title={title} description={description} path={`/area/${pref}`} />
      {/* noindex: データが少ないページはGoogleにインデックスさせない */}
      {!isIndexable && (
        <Helmet>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
      )}
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
          {prefShops.length}店舗掲載 · セラピスト情報・口コミ・料金を検索
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
                    to={`/search?shop=${encodeURIComponent(shop.name)}`}
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
