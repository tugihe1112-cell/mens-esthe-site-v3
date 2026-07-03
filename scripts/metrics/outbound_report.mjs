/**
 * outbound_report.mjs — GA4の click_outbound（送客）を店舗別に集計（Tier 5：BtoB営業の弾込め）
 *   「どの店に何件送客したか」を月次で出す＝将来の店舗向け営業資料が自動で貯まる。
 *   fetch_metrics.mjs と同じ .gcp-metrics-key.json / GA4_PROPERTY_ID を流用。
 *
 * 実行: node scripts/metrics/outbound_report.mjs [--days=30]
 *
 * ※ 店舗別内訳には GA4 で shop_name / link_type を「カスタムディメンション」登録が必要。
 *   未登録なら総数のみ出る（スクリプトが自動フォールバック）。登録手順は実行時に案内。
 */
import fs from 'fs';
import { google } from 'googleapis';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const KEY_FILE = getEnv('GCP_METRICS_KEY') || '.gcp-metrics-key.json';
const GA4_PROPERTY_ID = getEnv('GA4_PROPERTY_ID');

const args = process.argv.slice(2);
const DAYS = Number((args.find((a) => a.startsWith('--days=')) || '').split('=')[1]) || 30;

if (!GA4_PROPERTY_ID) { console.error('❌ .env に GA4_PROPERTY_ID が無い'); process.exit(1); }
if (!fs.existsSync(KEY_FILE)) { console.error(`❌ 鍵ファイルが無い: ${KEY_FILE}`); process.exit(1); }

const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
const ga = google.analyticsdata({ version: 'v1beta', auth });

const START = new Date(Date.now() - DAYS * 864e5).toISOString().slice(0, 10);
const END = new Date().toISOString().slice(0, 10);
const property = `properties/${GA4_PROPERTY_ID}`;
const outboundFilter = { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'click_outbound' } } };

async function totalCount() {
  const r = await ga.properties.runReport({
    property,
    requestBody: { dateRanges: [{ startDate: START, endDate: END }], metrics: [{ name: 'eventCount' }], dimensionFilter: outboundFilter },
  });
  return Number(r.data.rows?.[0]?.metricValues?.[0]?.value || 0);
}

async function perShop() {
  const r = await ga.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate: START, endDate: END }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'customEvent:shop_name' }, { name: 'customEvent:link_type' }],
      dimensionFilter: outboundFilter,
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 500,
    },
  });
  return r.data.rows || [];
}

async function main() {
  console.log(`=== 送客レポート click_outbound（${START}〜${END} / ${DAYS}日）===`);
  const total = await totalCount();
  console.log(`総送客数: ${total} 件\n`);
  if (total === 0) { console.log('（まだ送客イベントの蓄積が少ない。トラフィックが増えるほど貯まる）'); return; }

  try {
    const rows = await perShop();
    const byShop = {};
    for (const row of rows) {
      const shop = row.dimensionValues?.[0]?.value || '(不明)';
      const link = row.dimensionValues?.[1]?.value || '-';
      const n = Number(row.metricValues?.[0]?.value || 0);
      (byShop[shop] ||= { total: 0, byLink: {} });
      byShop[shop].total += n;
      byShop[shop].byLink[link] = (byShop[shop].byLink[link] || 0) + n;
    }
    const sorted = Object.entries(byShop).sort((a, b) => b[1].total - a[1].total);
    console.log('店舗別送客数（多い順）:');
    console.log('  送客  内訳(link_type)         店舗名');
    for (const [shop, info] of sorted.slice(0, 50)) {
      const breakdown = Object.entries(info.byLink).map(([k, v]) => `${k}:${v}`).join(' ');
      console.log(`${String(info.total).padStart(6)}  ${breakdown.padEnd(22)} ${shop}`);
    }
  } catch (e) {
    console.log('⚠️ 店舗別内訳が取れなかった（総数のみ）:', e.message?.slice(0, 120));
    console.log('   → GA4で shop_name / link_type を「カスタムディメンション」に登録すると店舗別に出る。');
    console.log('   GA4 管理 → データの表示 → カスタム定義 → カスタムディメンションを作成');
    console.log('   （イベントスコープ・ディメンション名 shop_name / イベントパラメータ shop_name。link_typeも同様）');
  }
}
main().catch((e) => { console.error('❌ 取得失敗:', e.message); process.exit(1); });
