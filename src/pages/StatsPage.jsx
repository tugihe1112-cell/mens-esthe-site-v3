import React, { useState } from 'react';
import { Link } from '../compat/router';
import SeoHead from '../components/SeoHead';
import Header from '../components/Header.jsx';
import stats from '../data/stats-latest.json';

// 被リンク資産ページ「日本のメンズエステ統計 2026」
// - src/data/stats-latest.json（build_stats.mjsが生成）を静的import＝DBアクセス不要・落ちない
// - グラフはCSSバー＋SVGで自前描画（依存追加なし）
// - 引用コピーボタン／末尾に表（table）＝引用・スクレイプされやすい形
// - 誇張禁止・掲載N店舗を必ず併記（景表法＋信頼）

const SITE_URL = process.env.VITE_PUBLIC_SITE_URL || 'https://www.mens-esthe-map.jp';
const CITE_URL = `${SITE_URL}/stats`;

const yen = (n) => (n == null ? '—' : '¥' + Number(n).toLocaleString());
const num = (n) => (n == null ? '—' : Number(n).toLocaleString());

function BarRow({ rank, label, sub, value, pct, valueLabel }) {
  return (
    <div className="flex items-center gap-3">
      {rank != null && (
        <span className={`w-6 shrink-0 text-center text-xs font-black ${rank <= 3 ? 'text-pink-400' : 'text-slate-500'}`}>{rank}</span>
      )}
      <div className="w-24 sm:w-32 shrink-0 truncate text-xs sm:text-sm text-slate-200 font-bold">
        {label}
        {sub && <span className="block text-[10px] text-slate-500 font-normal truncate">{sub}</span>}
      </div>
      <div className="flex-1 h-5 sm:h-6 bg-slate-800/70 rounded-md overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-md transition-all"
          style={{ width: `${Math.max(3, pct)}%` }}
        />
      </div>
      <div className="w-16 shrink-0 text-right text-xs sm:text-sm font-black text-white tabular-nums">
        {valueLabel != null ? valueLabel : num(value)}
      </div>
    </div>
  );
}

function Section({ id, title, note, children, copyText, copiedKey, onCopy }) {
  return (
    <section id={id} className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 sm:p-7">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white leading-tight">{title}</h2>
          {note && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{note}</p>}
        </div>
        {copyText && (
          <button
            onClick={() => onCopy(copyText, id)}
            className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border border-pink-500/40 text-pink-300 hover:bg-pink-500/10 transition whitespace-nowrap"
          >
            {copiedKey === id ? '✓ コピー' : '📋 この数字を引用'}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export default function StatsPage() {
  const [copiedKey, setCopiedKey] = useState(null);
  const {
    coverage = {}, prefectureShopCounts = [], areaDensity = [],
    nationalPrice = {}, priceByPrefecture = [], therapistStats = {}, asOf, generatedAt,
  } = stats || {};

  const hasData = (coverage.totalShops || 0) > 0;
  const citeSuffix = `（出典: メンエスマップ調べ｜${asOf}時点・掲載${num(coverage.totalShops)}店舗のデータより｜${CITE_URL}）`;

  const handleCopy = (text, key) => {
    const full = `${text}\n${citeSuffix}`;
    try {
      navigator.clipboard.writeText(full);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch (_) { /* noop */ }
  };

  const headlineSub = nationalPrice.median60
    ? `掲載${num(coverage.totalShops)}店舗を集計｜60分の中央値${yen(nationalPrice.median60)}`
    : `掲載${num(coverage.totalShops)}店舗・${num(coverage.totalTherapists)}人を集計`;
  const ogImage = `${SITE_URL}/api/og?shop=${encodeURIComponent('メンズエステ統計 2026')}&sub=${encodeURIComponent(headlineSub)}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '日本のメンズエステ料金相場・店舗統計 2026',
    description: `料金を公開している${num(coverage.priceSampleShops)}店舗から算出した60分・90分コースの料金中央値を中心に、エリア別の店舗密度、在籍セラピスト数を集計した統計データ。メンエスマップ調べ（${asOf}時点・掲載${num(coverage.totalShops)}店舗）。都道府県別の掲載店舗数は当サイトの収集状況を反映したものであり、各都道府県の実際の店舗総数ではありません。`,
    url: CITE_URL,
    creator: { '@type': 'Organization', name: 'メンエスマップ', url: SITE_URL },
    dateModified: generatedAt,
    temporalCoverage: '2026',
    keywords: ['メンズエステ', '料金相場', '中央値', '店舗数', 'セラピスト', '統計'],
    isAccessibleForFree: true,
  };

  // ⚠️ 料金サンプルの東京偏重を数値で開示する（2026-08-17）
  //    n60=291のうち東京216（74%）、n90=388のうち東京304（78%）。
  //    その結果「全国中央値」と「東京都の中央値」が完全に一致してしまっており、
  //    ページ内の2つの表を見比べれば誰でも気づく。黙って「全国」と名乗るのは誠実でないうえ、
  //    他社記事の相場（90分14,000〜16,000円）と食い違う理由の説明にもなる。
  const tokyoPrice = priceByPrefecture.find((r) => r.prefecture === '東京都');
  const tokyoShare = (() => {
    const t = (tokyoPrice?.n60 || 0) + (tokyoPrice?.n90 || 0);
    const all = (nationalPrice.n60 || 0) + (nationalPrice.n90 || 0);
    return all > 0 ? Math.round((t / all) * 100) : null;
  })();

  const prefMax = prefectureShopCounts[0]?.count || 1;
  const areaMax = areaDensity[0]?.count || 1;
  const therMax = therapistStats.topShops?.[0]?.count || 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Header />
      <SeoHead
        title="【2026年版】メンズエステの料金相場｜60分・90分の中央値と激戦区ランキング"
        description={`料金を公開している${num(coverage.priceSampleShops)}店舗から算出した60分・90分の料金中央値、エリア別の掲載店舗数TOP20、在籍セラピスト統計。推計を含まない実測データ。メンエスマップ調べ（${asOf}時点）。`}
        path="/stats"
        image={ogImage}
      />
      {/* JSON-LD Dataset（静的プリレンダHTMLに含める＝引用/検索向け） */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-3xl mx-auto px-4 pt-20 pb-24 space-y-6">
        {/* パンくず */}
        <nav className="text-xs text-slate-500">
          <Link to="/" className="hover:text-pink-400">ホーム</Link>
          <span className="mx-1.5">›</span>
          <span className="text-slate-300">メンズエステ統計 2026</span>
        </nav>

        {/* ヘッダー */}
        <header className="space-y-3">
          <span className="inline-block text-[11px] font-black tracking-widest text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full">DATA / 2026</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            日本のメンズエステ統計 <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">2026</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            料金を公開している <b className="text-white">{num(coverage.priceSampleShops)}店舗</b> の料金中央値を中心に、掲載 <b className="text-white">{num(coverage.totalShops)}店舗</b>・在籍 <b className="text-white">{num(coverage.totalTherapists)}人</b> のデータを機械集計した統計です。数字はすべて掲載データからの実測で、推計は含みません。
          </p>
          <p className="text-[11px] text-slate-500">
            メンエスマップ調べ／{asOf}時点／最終更新 {generatedAt}
          </p>
          {/* ⚠️ 収集カバレッジの明示（2026-08-17 追加）
              都道府県別の掲載店舗数は「その県の実際の店舗総数」ではなく「当サイトが収集できた数」。
              東京506店に対し兵庫9店・福岡6店は市場規模の差ではなく収集状況の差であり、
              これを黙って並べると業界を知る読み手に一目で見抜かれ、ページ全体の信頼を失う。
              引用される資産にするには、限界を先に自分から書くことが必須。 */}
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5">
            <p className="text-[11px] text-amber-200/90 font-bold mb-1">データの範囲について（先にお読みください）</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              本ページの数字は<b className="text-slate-300">当サイトが掲載している店舗</b>の実測値です。収集の進み具合は地域によって異なり、東京・関東圏は網羅的に収集していますが、その他の地域は主要店舗を中心に収集しています。
              そのため<b className="text-slate-300">都道府県別・エリア別の掲載店舗数は、その地域の実際の店舗総数ではありません</b>（例：兵庫県・福岡県は主要店舗のみのため実態より少なく出ます）。地域どうしの多寡を比較する用途には使えません。
              <br />
              一方、<b className="text-slate-300">料金相場（60分・90分の中央値）は、サンプル数を併記した実測値</b>です。本ページで最も信頼できるのはこの数字ですが、料金を公開している店舗の約{tokyoShare != null ? `${tokyoShare}%` : '4分の3'}が東京都であるため、<b className="text-slate-300">全体の中央値は首都圏の水準に近くなります</b>。地域別の水準は料金セクションの表をご参照ください。
            </p>
          </div>
        </header>

        {!hasData && (
          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-8 text-center text-slate-400 text-sm">
            集計データを準備中です。<br />（<code className="text-slate-300">node scripts/metrics/build_stats.mjs</code> を実行すると数値が入ります）
          </div>
        )}

        {hasData && (
          <>
            {/* サマリKPI */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { k: '掲載店舗数', v: num(coverage.totalShops) },
                { k: '在籍セラピスト', v: num(coverage.totalTherapists) },
                { k: '料金調査店舗', v: num(coverage.priceSampleShops) },
              ].map((x) => (
                <div key={x.k} className="rounded-xl bg-slate-900/60 border border-white/5 p-3 text-center">
                  <div className="text-lg sm:text-2xl font-black text-white tabular-nums">{x.v}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{x.k}</div>
                </div>
              ))}
            </div>

            {/* 1. 料金相場 ＝ このページの主役
                ⚠️ 順序を変えた理由（2026-08-17）: 以前は「都道府県別 店舗数」が先頭だったが、
                その数字は市場規模ではなく当サイトの収集状況（東京506店 vs 兵庫9店）を映すだけで、
                業界を知る読み手には一目で見抜かれる。他社が出していない一次データは料金中央値なので、
                引用の入口をここに変更した。 */}
            <Section
              id="price"
              title="料金相場（60分・90分の中央値）"
              note={`料金を掲載している${num(coverage.priceSampleShops)}店舗から抽出。中央値を採用（外れ値の影響を抑えるため）。都道府県別はサンプル10店以上の帯のみ掲載`}
              copyText={nationalPrice.median60 || nationalPrice.median90
                ? `メンズエステの料金中央値は 60分${yen(nationalPrice.median60)}・90分${yen(nationalPrice.median90)}（掲載${num(coverage.priceSampleShops)}店舗の実測。サンプルの約${tokyoShare}%が東京都のため首都圏寄りの水準）。地域別では大阪90分${yen(priceByPrefecture.find((r) => r.prefecture === '大阪府')?.median90)}・神奈川90分${yen(priceByPrefecture.find((r) => r.prefecture === '神奈川県')?.median90)}`
                : `メンズエステの料金相場を都道府県別に集計`}
              copiedKey={copiedKey} onCopy={handleCopy}
            >
              {/* 掲載全店の中央値をSVGバーで自前描画（「全国」とは名乗らない＝東京77%のため） */}
              <div className="rounded-xl bg-slate-950/60 border border-white/5 p-4 mb-4">
                <div className="text-[11px] text-slate-400 mb-2 font-bold">掲載{num(coverage.priceSampleShops)}店舗の中央値</div>
                <svg viewBox="0 0 300 70" className="w-full" role="img" aria-label="掲載店舗の料金中央値（60分・90分）">
                  {(() => {
                    const max = Math.max(nationalPrice.median60 || 0, nationalPrice.median90 || 0, 1);
                    const bars = [
                      { label: '60分', v: nationalPrice.median60, y: 8, color: '#ec4899' },
                      { label: '90分', v: nationalPrice.median90, y: 40, color: '#a855f7' },
                    ];
                    return bars.map((b) => (
                      <g key={b.label}>
                        <text x="0" y={b.y + 15} fill="#cbd5e1" fontSize="11" fontWeight="700">{b.label}</text>
                        <rect x="42" y={b.y} width={b.v ? (b.v / max) * 200 : 0} height="20" rx="4" fill={b.color} />
                        <text x={b.v ? 42 + (b.v / max) * 200 + 6 : 48} y={b.y + 15} fill="#ffffff" fontSize="12" fontWeight="900">{b.v ? yen(b.v) : 'N<10'}</text>
                      </g>
                    ));
                  })()}
                </svg>
                <p className="text-[10px] text-slate-500 mt-1">60分帯 n={num(nationalPrice.n60)}／90分帯 n={num(nationalPrice.n90)}</p>
              </div>

              {/* サンプルの地域偏りを明示。これを書かないと「全国」を名乗る数字が東京の数字と一致していることの説明がつかない */}
              {tokyoShare != null && tokyoShare >= 50 && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3.5 mb-4">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <b className="text-amber-200/90">この数字は「全国平均」ではありません。</b>
                    料金を公開している店舗のうち約<b className="text-slate-300">{tokyoShare}%が東京都</b>のため（60分 {num(tokyoPrice?.n60)}/{num(nationalPrice.n60)}店・90分 {num(tokyoPrice?.n90)}/{num(nationalPrice.n90)}店）、上の中央値は実質的に<b className="text-slate-300">首都圏の水準</b>です。
                    実際、東京都の中央値（60分{yen(tokyoPrice?.median60)}・90分{yen(tokyoPrice?.median90)}）と一致します。
                    地域ごとの水準は下の表をご覧ください（大阪府は90分{yen(priceByPrefecture.find((r) => r.prefecture === '大阪府')?.median90)}と、東京より低く出ます）。
                  </p>
                </div>
              )}

              {priceByPrefecture.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="text-slate-400 border-b border-white/10">
                        <th className="text-left py-2 font-bold">都道府県</th>
                        <th className="text-right py-2 font-bold">60分</th>
                        <th className="text-right py-2 font-bold">90分</th>
                        <th className="text-right py-2 font-bold text-slate-500">調査店舗</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceByPrefecture.map((r) => (
                        <tr key={r.prefecture} className="border-b border-white/5">
                          <td className="py-2 text-slate-200 font-bold">{r.prefecture}</td>
                          <td className="py-2 text-right text-white tabular-nums">{r.median60 ? yen(r.median60) : '—'}</td>
                          <td className="py-2 text-right text-white tabular-nums">{r.median90 ? yen(r.median90) : '—'}</td>
                          <td className="py-2 text-right text-slate-500 tabular-nums">{r.median60 ? `${r.n60}店` : `${r.n90}店`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500">都道府県別はサンプル10店以上の帯が揃い次第掲載します。</p>
              )}
            </Section>

            {/* 2. エリア別 店舗密度 */}
            <Section
              id="area"
              title="エリア別 掲載店舗数TOP20（メンエス激戦区）"
              note="市区・駅エリア単位の掲載店舗数。掲載数が多いほど選択肢の多いエリア。※収集の進み具合が地域で異なるため、離れた地域どうしの比較には向きません"
              copyText={`メンズエステの掲載店舗数が多いエリアTOP3は ${areaDensity.slice(0, 3).map((a, i) => `${i + 1}位${a.area}(${a.prefecture}・${a.count}店)`).join('・')}`}
              copiedKey={copiedKey} onCopy={handleCopy}
            >
              <div className="space-y-2">
                {areaDensity.slice(0, 12).map((a, i) => (
                  <BarRow key={`${a.prefecture}-${a.area}`} rank={i + 1} label={a.area} sub={a.prefecture} value={a.count} pct={(a.count / areaMax) * 100} valueLabel={`${a.count}店`} />
                ))}
              </div>
              {areaDensity.length > 12 && <p className="text-[11px] text-slate-500 mt-3">13〜20位は下部の表を参照</p>}
            </Section>

            {/* 3. 都道府県別 掲載店舗数
                ⚠️「ランキング」と呼ばないこと。これは市場規模の順位ではなく収集状況の一覧。
                   タイトル・note・copyText のいずれからも順位表現を外してある。 */}
            <Section
              id="pref"
              title="都道府県別 掲載店舗数"
              note={`当サイトが掲載している${num(coverage.totalShops)}店舗の内訳（上位10件）。各都道府県の実際の店舗総数ではありません`}
              copyText={`メンエスマップの掲載店舗数の内訳は ${prefectureShopCounts.slice(0, 3).map((p) => `${p.prefecture}${p.count}店`).join('・')}（各都道府県の実際の店舗総数ではなく、当サイトの掲載数）`}
              copiedKey={copiedKey} onCopy={handleCopy}
            >
              <div className="space-y-2">
                {prefectureShopCounts.slice(0, 10).map((p, i) => (
                  <BarRow key={p.prefecture} rank={i + 1} label={p.prefecture} value={p.count} pct={(p.count / prefMax) * 100} valueLabel={`${p.count}店`} />
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                東京・関東圏は網羅的に収集しているため多く、その他の地域は主要店舗を中心に収集しているため少なく出ます。都道府県間の多寡の比較にはご利用いただけません。
              </p>
            </Section>

            {/* 4. 在籍セラピスト統計 */}
            <Section
              id="therapists"
              title="在籍セラピスト数の統計"
              note={`在籍総数と、1店舗あたりの在籍数（中央値）・在籍数の多い店舗TOP10`}
              copyText={`メンズエステの在籍セラピストは総計${num(therapistStats.total)}人、1店舗あたりの中央値は${num(therapistStats.medianPerShop)}人`}
              copiedKey={copiedKey} onCopy={handleCopy}
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-slate-950/60 border border-white/5 p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{num(therapistStats.total)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">在籍総数</div>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-white/5 p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{num(therapistStats.medianPerShop)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">1店舗あたり中央値</div>
                </div>
              </div>
              <div className="space-y-2">
                {(therapistStats.topShops || []).map((s, i) => (
                  <BarRow key={s.shopId} rank={i + 1} label={s.name} sub={s.prefecture} value={s.count} pct={(s.count / therMax) * 100} valueLabel={`${s.count}人`} />
                ))}
              </div>
            </Section>

            {/* コピペ・引用しやすい表（全データ） */}
            <details className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 sm:p-7">
              <summary className="cursor-pointer text-sm font-black text-white">全データ表（都道府県別 掲載店舗数・エリア別 掲載店舗数）</summary>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="overflow-x-auto">
                  <h3 className="text-xs font-bold text-slate-400 mb-2">都道府県別 掲載店舗数（全{prefectureShopCounts.length}件・実際の店舗総数ではありません）</h3>
                  <table className="w-full text-xs">
                    <thead><tr className="text-slate-500 border-b border-white/10"><th className="text-left py-1.5">順位</th><th className="text-left py-1.5">都道府県</th><th className="text-right py-1.5">店舗数</th></tr></thead>
                    <tbody>
                      {prefectureShopCounts.map((p, i) => (
                        <tr key={p.prefecture} className="border-b border-white/5"><td className="py-1.5 text-slate-500">{i + 1}</td><td className="py-1.5 text-slate-200">{p.prefecture}</td><td className="py-1.5 text-right text-white tabular-nums">{p.count}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <h3 className="text-xs font-bold text-slate-400 mb-2">エリア別 掲載店舗数 TOP20</h3>
                  <table className="w-full text-xs">
                    <thead><tr className="text-slate-500 border-b border-white/10"><th className="text-left py-1.5">順位</th><th className="text-left py-1.5">エリア</th><th className="text-left py-1.5">都道府県</th><th className="text-right py-1.5">店舗数</th></tr></thead>
                    <tbody>
                      {areaDensity.map((a, i) => (
                        <tr key={`${a.prefecture}-${a.area}`} className="border-b border-white/5"><td className="py-1.5 text-slate-500">{i + 1}</td><td className="py-1.5 text-slate-200">{a.area}</td><td className="py-1.5 text-slate-400">{a.prefecture}</td><td className="py-1.5 text-right text-white tabular-nums">{a.count}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>

            {/* 出典・使い方 */}
            <div className="rounded-2xl bg-slate-900/40 border border-white/5 p-5 text-xs text-slate-400 leading-relaxed space-y-2">
              <p className="font-bold text-slate-300">この統計の引用について</p>
              <p>本ページの数字は自由に引用いただけます。引用の際は出典として「メンエスマップ調べ」および本ページURL（<span className="text-slate-300">{CITE_URL}</span>）の明記をお願いします。各セクションの「引用」ボタンで出典付きテキストをコピーできます。</p>
              <p className="text-slate-500">※ 数字は当サイト掲載データからの実測値です（{asOf}時点・掲載{num(coverage.totalShops)}店舗）。料金はデータを掲載している{num(coverage.priceSampleShops)}店舗のみを対象に集計しており、実際の店舗料金とは異なる場合があります。推計値は含みません。</p>
              <p className="text-slate-500">※ 都道府県別・エリア別の掲載店舗数は<b className="text-slate-400">当サイトの収集状況</b>を反映した数字であり、その地域の実際の店舗総数ではありません。東京・関東圏は網羅的に、その他の地域は主要店舗を中心に収集しています。地域間の多寡を比較する統計としては使えません。</p>
              <p className="text-slate-500">※ 掲載内容の誤り・削除のご依頼は<Link to="/contact" className="text-pink-400 hover:underline">お問い合わせ</Link>からお願いします。</p>
            </div>

            {/* 回遊導線（内部リンク＝PageRankを本命ページへ） */}
            <div className="flex flex-wrap gap-2">
              <Link to="/shops" className="text-xs font-bold px-4 py-2 rounded-full bg-slate-900 border border-white/10 text-slate-200 hover:border-pink-500/40 transition">店舗一覧を見る →</Link>
              <Link to="/popular-reviews" className="text-xs font-bold px-4 py-2 rounded-full bg-slate-900 border border-white/10 text-slate-200 hover:border-pink-500/40 transition">みんなの口コミ →</Link>
              <Link to="/ranking" className="text-xs font-bold px-4 py-2 rounded-full bg-slate-900 border border-white/10 text-slate-200 hover:border-pink-500/40 transition">ランキング →</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
