/**
 * build_stats.mjs — 「メンズエステ統計 2026」の集計スクリプト（被リンク資産）
 *
 * DBから機械集計できる一次データだけを集計し src/data/stats-2026-07.json を生成する。
 * ページ(pages/stats.jsx)はこのJSONを静的importするだけ＝DBアクセス不要・落ちない・高速。
 *
 * 前提: .env に VITE_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY（RLSバイパスに必要・全件集計のため）
 * 実行:
 *   node scripts/metrics/build_stats.mjs --dry-run   # 集計内容とカバレッジだけ表示（書き込まない）
 *   node scripts/metrics/build_stats.mjs             # src/data/stats-2026-07.json に書き出し
 *
 * 方針（信頼が資産・誇張禁止）:
 *  - 料金はパースできた店舗のみ集計。**都道府県×コース帯でサンプル10店未満は非掲載**
 *  - 料金の中央値を採用（平均は外れ値に弱い）
 *  - 掲載N店舗を必ず併記。推計・水増しはしない
 *
 * 月1回再実行して鮮度維持（ページに generatedAt を表示）。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_PATH = path.join(ROOT, 'src/data/stats-2026-07.json');
const AS_OF = '2026年7月';

const DRY = process.argv.includes('--dry-run');

const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が必要（全件集計のため service role 必須）');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── ユーティリティ ──
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

// service roleでも1000件上限があるので range でページング
async function fetchAll(table, columns) {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table} fetch失敗: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

// 料金テキスト/オブジェクトから {minutes, price}[] を抽出
// price_system の実データ2形態に対応:
//   (a) オブジェクト  {"70":14000,"90":18000}（JSON文字列含む）
//   (b) テキスト複数行 "70分(ディープリンパ込): 14,000円\n90分...: 18,000円 ⇨ 16,000円 (HP割引)"
//       → 割引後(⇨以降)ではなく通常料金(行内の最初の金額)を採用
function parsePriceSystem(ps) {
  if (ps == null) return [];
  let obj = ps;
  if (typeof obj === 'string') {
    const t = obj.trim();
    if (t.startsWith('{')) { try { obj = JSON.parse(t); } catch { /* テキスト扱い */ } }
  }
  const out = [];
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const min = parseInt(String(k).replace(/[^0-9]/g, ''), 10);
      const price = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
      if (Number.isFinite(min) && Number.isFinite(price)) out.push({ min, price });
    }
    return out.filter(plausible);
  }
  // テキスト行パース
  const str = typeof ps === 'string' ? ps : String(ps);
  for (const line of str.split(/\n+/)) {
    const mMin = line.match(/(\d{2,3})\s*分/);
    const mYen = line.match(/([\d,]{3,})\s*円/); // 行内で最初に出る金額＝通常料金
    if (!mMin || !mYen) continue;
    const min = parseInt(mMin[1], 10);
    const price = parseInt(mYen[1].replace(/,/g, ''), 10);
    if (Number.isFinite(min) && Number.isFinite(price)) out.push({ min, price });
  }
  return out.filter(plausible);
}
// 妥当な範囲だけ（明らかな誤抽出を除外）
const plausible = ({ min, price }) => min >= 30 && min <= 240 && price >= 3000 && price <= 100000;

// コース分数を帯に割り当て（60分帯 / 90分帯）
function bandPrice(pairs, target, lo, hi) {
  const inBand = pairs.filter((p) => p.min >= lo && p.min <= hi);
  if (!inBand.length) return null;
  // 帯内で target に最も近いコースの料金を代表値に
  inBand.sort((a, b) => Math.abs(a.min - target) - Math.abs(b.min - target));
  return inBand[0].price;
}

const prefOf = (s) => s.prefecture || s.raw_data?.prefecture || null;
const areaOf = (s) => {
  const a = s.raw_data?.area;
  if (Array.isArray(a)) return a[0] || null;
  if (typeof a === 'string' && a.trim()) return a.trim();
  return null;
};

async function main() {
  console.log(`\n📊 統計集計 (${AS_OF})  ${DRY ? '[DRY-RUN]' : ''}\n`);

  const shops = await fetchAll('shops', 'id, name, prefecture, raw_data, price_system');
  const therapists = await fetchAll('therapists', 'id, shop_id');
  console.log(`  店舗: ${shops.length}件 / セラピスト: ${therapists.length}件\n`);

  // ── 1. 都道府県別 店舗数 ──
  const prefCount = {};
  for (const s of shops) { const p = prefOf(s); if (p) prefCount[p] = (prefCount[p] || 0) + 1; }
  const prefectureShopCounts = Object.entries(prefCount)
    .map(([prefecture, count]) => ({ prefecture, count }))
    .sort((a, b) => b.count - a.count);

  // ── 2. エリア別 店舗密度 TOP20 ──
  const areaMap = {};
  for (const s of shops) {
    const area = areaOf(s); const pref = prefOf(s);
    if (!area) continue;
    const key = `${pref}|${area}`;
    if (!areaMap[key]) areaMap[key] = { area, prefecture: pref, count: 0 };
    areaMap[key].count += 1;
  }
  const areaDensity = Object.values(areaMap).sort((a, b) => b.count - a.count).slice(0, 20);

  // ── 3. 料金相場（都道府県別・60/90分帯の中央値・N>=10のみ） ──
  const priceByPrefMap = {}; // pref -> { p60:[], p90:[] }
  let priceParsedShops = 0;
  for (const s of shops) {
    const pref = prefOf(s); if (!pref) continue;
    const pairs = parsePriceSystem(s.price_system);
    if (!pairs.length) continue;
    priceParsedShops += 1;
    if (!priceByPrefMap[pref]) priceByPrefMap[pref] = { p60: [], p90: [] };
    const b60 = bandPrice(pairs, 60, 55, 70);
    const b90 = bandPrice(pairs, 90, 80, 100);
    if (b60) priceByPrefMap[pref].p60.push(b60);
    if (b90) priceByPrefMap[pref].p90.push(b90);
  }
  const MIN_SAMPLE = 10;
  const priceByPrefecture = Object.entries(priceByPrefMap)
    .map(([prefecture, v]) => ({
      prefecture,
      n60: v.p60.length,
      n90: v.p90.length,
      median60: v.p60.length >= MIN_SAMPLE ? median(v.p60) : null,
      median90: v.p90.length >= MIN_SAMPLE ? median(v.p90) : null,
    }))
    .filter((r) => r.median60 != null || r.median90 != null)
    .sort((a, b) => (b.median60 || b.median90 || 0) - (a.median60 || a.median90 || 0));

  // 全国中央値（サンプルが十分にある帯のみ）
  const all60 = [], all90 = [];
  for (const v of Object.values(priceByPrefMap)) { all60.push(...v.p60); all90.push(...v.p90); }
  const nationalPrice = {
    n60: all60.length, n90: all90.length,
    median60: all60.length >= MIN_SAMPLE ? median(all60) : null,
    median90: all90.length >= MIN_SAMPLE ? median(all90) : null,
  };

  // ── 4. 在籍セラピスト統計 ──
  const perShop = {};
  for (const t of therapists) { if (t.shop_id) perShop[t.shop_id] = (perShop[t.shop_id] || 0) + 1; }
  const counts = Object.values(perShop);
  const shopById = Object.fromEntries(shops.map((s) => [s.id, s]));
  const topTherapistShops = Object.entries(perShop)
    .map(([shopId, count]) => ({
      shopId, count,
      name: shopById[shopId]?.name || shopId,
      prefecture: shopById[shopId] ? prefOf(shopById[shopId]) : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const therapistStats = {
    total: therapists.length,
    shopsWithTherapists: counts.length,
    medianPerShop: median(counts),
    topShops: topTherapistShops,
  };

  const stats = {
    generatedAt: new Date().toISOString().slice(0, 10),
    asOf: AS_OF,
    coverage: {
      totalShops: shops.length,
      totalTherapists: therapists.length,
      priceSampleShops: priceParsedShops,
    },
    prefectureShopCounts,
    areaDensity,
    nationalPrice,
    priceByPrefecture,
    therapistStats,
  };

  // ── カバレッジ表示（dry-run必読） ──
  console.log('── カバレッジ ──');
  console.log(`  料金パース成功: ${priceParsedShops}/${shops.length}店 (${(priceParsedShops / shops.length * 100).toFixed(1)}%)`);
  console.log(`  全国 60分帯サンプル: ${nationalPrice.n60}店 → 中央値 ${nationalPrice.median60 ? '¥' + nationalPrice.median60.toLocaleString() : '(N<10で非掲載)'}`);
  console.log(`  全国 90分帯サンプル: ${nationalPrice.n90}店 → 中央値 ${nationalPrice.median90 ? '¥' + nationalPrice.median90.toLocaleString() : '(N<10で非掲載)'}`);
  console.log(`  料金掲載都道府県: ${priceByPrefecture.length}件（各N>=${MIN_SAMPLE}の帯のみ）`);
  console.log('  都道府県別サンプル(60/90):');
  for (const r of priceByPrefecture) {
    console.log(`    ${r.prefecture}: 60分 n=${r.n60}${r.median60 ? '→¥' + r.median60.toLocaleString() : '(非掲載)'} / 90分 n=${r.n90}${r.median90 ? '→¥' + r.median90.toLocaleString() : '(非掲載)'}`);
  }
  console.log('\n── サマリ ──');
  console.log(`  都道府県数: ${prefectureShopCounts.length} / 店舗数トップ: ${prefectureShopCounts[0]?.prefecture} ${prefectureShopCounts[0]?.count}店`);
  console.log(`  激戦区トップ: ${areaDensity[0]?.area}(${areaDensity[0]?.prefecture}) ${areaDensity[0]?.count}店`);
  console.log(`  在籍総数: ${therapistStats.total} / 1店中央値: ${therapistStats.medianPerShop} / 最多: ${topTherapistShops[0]?.name} ${topTherapistShops[0]?.count}人\n`);

  if (DRY) { console.log('🟡 --dry-run: ファイルは書き込んでいません。\n'); return; }
  fs.writeFileSync(OUT_PATH, JSON.stringify(stats, null, 2) + '\n');
  console.log(`✅ 書き出し: ${path.relative(ROOT, OUT_PATH)}\n`);
}

main().catch((e) => { console.error('❌ 集計失敗:', e.message); process.exit(1); });
