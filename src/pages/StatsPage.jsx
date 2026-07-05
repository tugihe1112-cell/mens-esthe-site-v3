import React, { useState } from 'react';
import { Link } from '../compat/router';
import SeoHead from '../components/SeoHead';
import stats from '../data/stats-2026-07.json';

// 被リンク資産ページ「日本のメンズエステ統計 2026」
// - src/data/stats-2026-07.json（build_stats.mjsが生成）を静的import＝DBアクセス不要・落ちない
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
    ? `全国${num(coverage.totalShops)}店舗を集計｜60分の相場${yen(nationalPrice.median60)}`
    : `全国${num(coverage.totalShops)}店舗・${num(coverage.totalTherapists)}人を集計`;
  const ogImage = `${SITE_URL}/api/og?shop=${encodeURIComponent('メンズエステ統計 2026')}&sub=${encodeURIComponent(headlineSub)}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '日本のメンズエステ統計 2026',
    description: `全国${num(coverage.totalShops)}店舗・在籍${num(coverage.totalTherapists)}人のデータをもとに、都道府県別の店舗数・料金相場（中央値）・エリア別店舗密度・在籍セラピスト数を集計した統計データ。メンエスマップ調べ（${asOf}時点）。`,
    url: CITE_URL,
    creator: { '@type': 'Organization', name: 'メンエスマップ', url: SITE_URL },
    dateModified: generatedAt,
    temporalCoverage: '2026',
    keywords: ['メンズエステ', '店舗数', '料金相場', 'セラピスト', '統計'],
    isAccessibleForFree: true,
  };

  const prefMax = prefectureShopCounts[0]?.count || 1;
  const areaMax = areaDensity[0]?.count || 1;
  const therMax = therapistStats.topShops?.[0]?.count || 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <SeoHead
        title="【2026年版】メンズエステ統計｜店舗数・料金相場・激戦区ランキング"
        description={`全国${num(coverage.totalShops)}店舗・在籍${num(coverage.totalTherapists)}人のデータで見る、都道府県別の店舗数・料金相場（60分/90分の中央値）・エリア別店舗密度ランキング。メンエスマップ調べ（${asOf}時点）。`}
        path="/stats"
        image={ogImage}
      />
      {/* JSON-LD Dataset（静的プリレンダHTMLに含める＝引用/検索向け） */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-3xl mx-auto px-4 pt-20 md:pt-12 pb-24 space-y-6">
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
            当サイト掲載の全国 <b className="text-white">{num(coverage.totalShops)}店舗</b>・在籍 <b className="text-white">{num(coverage.totalTherapists)}人</b> のデータを機械集計した、都道府県別の店舗数・料金相場・エリア別店舗密度の統計です。数字はすべて掲載データからの実測で、推計は含みません。
          </p>
          <p className="text-[11px] text-slate-500">
            メンエスマップ調べ／{asOf}時点／最終更新 {generatedAt}
          </p>
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

            {/* 1. 都道府県別 店舗数 */}
            <Section
              id="pref"
              title="都道府県別 店舗数ランキング"
              note={`掲載${num(coverage.totalShops)}店舗を都道府県別に集計（TOP10）`}
              copyText={`メンズエステ店舗数が多い都道府県TOP3は ${prefectureShopCounts.slice(0, 3).map((p, i) => `${i + 1}位${p.prefecture}(${p.count}店)`).join('・')}`}
              copiedKey={copiedKey} onCopy={handleCopy}
            >
              <div className="space-y-2">
                {prefectureShopCounts.slice(0, 10).map((p, i) => (
                  <BarRow key={p.prefecture} rank={i + 1} label={p.prefecture} value={p.count} pct={(p.count / prefMax) * 100} valueLabel={`${p.count}店`} />
                ))}
              </div>
            </Section>

            {/* 2. エリア別 店舗密度 */}
            <Section
              id="area"
              title="メンエス激戦区ランキング（エリア別 店舗密度TOP20）"
              note="市区・駅エリア単位の掲載店舗数。数が多いほど選択肢の多い激戦区"
              copyText={`メンズエステの激戦区（店舗密度）TOP3は ${areaDensity.slice(0, 3).map((a, i) => `${i + 1}位${a.area}(${a.prefecture}・${a.count}店)`).join('・')}`}
              copiedKey={copiedKey} onCopy={handleCopy}
            >
              <div className="space-y-2">
                {areaDensity.slice(0, 12).map((a, i) => (
                  <BarRow key={`${a.prefecture}-${a.area}`} rank={i + 1} label={a.area} sub={a.prefecture} value={a.count} pct={(a.count / areaMax) * 100} valueLabel={`${a.count}店`} />
                ))}
              </div>
              {areaDensity.length > 12 && <p className="text-[11px] text-slate-500 mt-3">13〜20位は下部の表を参照</p>}
            </Section>

            {/* 3. 料金相場 */}
            <Section
              id="price"
              title="料金相場（60分・90分の中央値）"
              note={`料金を掲載している${num(coverage.priceSampleShops)}店舗から抽出。中央値を採用（外れ値の影響を抑えるため）。都道府県別はサンプル10店以上の帯のみ掲載`}
              copyText={nationalPrice.median60 || nationalPrice.median90
                ? `メンズエステの料金相場（全国中央値）は 60分${yen(nationalPrice.median60)}・90分${yen(nationalPrice.median90)}`
                : `メンズエステの料金相場を都道府県別に集計`}
              copiedKey={copiedKey} onCopy={handleCopy}
            >
              {/* 全国中央値をSVGバーで自前描画 */}
              <div className="rounded-xl bg-slate-950/60 border border-white/5 p-4 mb-4">
                <div className="text-[11px] text-slate-400 mb-2 font-bold">全国中央値</div>
                <svg viewBox="0 0 300 70" className="w-full" role="img" aria-label="全国の料金中央値">
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
              <summary className="cursor-pointer text-sm font-black text-white">全データ表（都道府県別 店舗数・エリア密度）</summary>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="overflow-x-auto">
                  <h3 className="text-xs font-bold text-slate-400 mb-2">都道府県別 店舗数（全{prefectureShopCounts.length}件）</h3>
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
                  <h3 className="text-xs font-bold text-slate-400 mb-2">エリア別 店舗密度 TOP20</h3>
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
              <p className="text-slate-500">※ 数字は当サイト掲載データからの実測値です（{asOf}時点・掲載{num(coverage.totalShops)}店舗）。料金はデータを掲載している店舗のみを対象に集計しており、実際の店舗料金とは異なる場合があります。推計値は含みません。</p>
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
