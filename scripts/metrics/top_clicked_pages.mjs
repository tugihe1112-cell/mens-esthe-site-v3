/**
 * top_clicked_pages.mjs — 「実際にクリックされている店舗」から逆算するための実測レポート
 *
 * 出すもの:
 *   1. 店舗単位のclickランキング（shopページ＋配下threadsを合算）
 *   2. 各店舗の流入クエリTOP5（指名か発見かを判別する材料）
 *   3. click>0の全ページ一覧（エリア・ホーム含む）
 *
 * 狙い: 「口コミがあるからクリックされている」の逆因果を避け、
 *       サイト全体でクリック需要が実在する店舗を特定→そこに口コミを配分する。
 *
 * 実行: node scripts/metrics/top_clicked_pages.mjs [--days=28] [--top=20]
 *   認証は fetch_metrics.mjs / weekly_opportunity_scan.mjs と同じ .gcp-metrics-key.json を流用。
 */
import fs from 'fs';
import { google } from 'googleapis';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const KEY_FILE = getEnv('GCP_METRICS_KEY') || '.gcp-metrics-key.json';
const SITE = getEnv('GSC_SITE_URL') || 'https://www.mens-esthe-map.jp/';

const args = process.argv.slice(2);
const DAYS = Number((args.find(a => a.startsWith('--days=')) || '').split('=')[1]) || 28;
const TOP = Number((args.find(a => a.startsWith('--top=')) || '').split('=')[1]) || 20;

if (!fs.existsSync(KEY_FILE)) { console.error(`❌ 鍵ファイルが無い: ${KEY_FILE}`); process.exit(1); }

const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
const sc = google.searchconsole({ version: 'v1', auth });
const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const END = d(2), START = d(2 + DAYS); // GSCは2〜3日遅れ

const shopIdFromUrl = (u) => { const m = u.match(/\/shops\/([^/?#]+)/); return m ? decodeURIComponent(m[1]) : null; };
const kindOf = (u) => u.includes('/threads/') ? 'therapist' : u.includes('/shops/') ? 'shop' : u.includes('/area/') ? 'area' : u.replace(/https?:\/\/[^/]+/, '') === '/' ? 'home' : 'other';

async function main() {
  // 1) 全ページのclick/表示
  const r = await sc.searchanalytics.query({
    siteUrl: SITE,
    requestBody: { startDate: START, endDate: END, dimensions: ['page'], rowLimit: 5000 },
  });
  const rows = (r.data.rows || []).map((row) => ({
    url: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    imp: row.impressions || 0,
    ctr: row.ctr || 0,
    pos: row.position || 0,
  }));

  const clicked = rows.filter((x) => x.clicks > 0).sort((a, b) => b.clicks - a.clicks);

  // 2) 店舗単位に合算（shopページ + threads配下）
  const byShop = {};
  for (const x of rows) {
    const sid = shopIdFromUrl(x.url);
    if (!sid) continue;
    if (!byShop[sid]) byShop[sid] = { shopId: sid, clicks: 0, imp: 0, pages: 0, bestPos: 999 };
    byShop[sid].clicks += x.clicks;
    byShop[sid].imp += x.imp;
    byShop[sid].pages += 1;
    if (x.imp > 0 && x.pos < byShop[sid].bestPos) byShop[sid].bestPos = x.pos;
  }
  const shopsRanked = Object.values(byShop).sort((a, b) => b.clicks - a.clicks || b.imp - a.imp);

  console.log(`=== ① 店舗単位クリックランキング（GSC ${START}〜${END}・shop+threads合算）===`);
  console.log('  #  click   表示   最良順位  ページ数  shop_id');
  shopsRanked.slice(0, TOP).forEach((s, i) => {
    console.log(`${String(i + 1).padStart(3)} ${String(s.clicks).padStart(6)} ${String(s.imp).padStart(6)} ${s.bestPos === 999 ? '   —' : s.bestPos.toFixed(1).padStart(7)} ${String(s.pages).padStart(8)}  ${s.shopId}`);
  });

  // 3) click上位店舗の流入クエリTOP5（指名/発見の判別材料）
  console.log(`\n=== ② click上位店舗の流入クエリ（各TOP5）===`);
  for (const s of shopsRanked.slice(0, 8).filter((s) => s.clicks > 0)) {
    const q = await sc.searchanalytics.query({
      siteUrl: SITE,
      requestBody: {
        startDate: START, endDate: END, dimensions: ['query'], rowLimit: 5,
        dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: `/shops/${encodeURIComponent(s.shopId)}` }] }],
      },
    });
    console.log(`\n■ ${s.shopId}（click${s.clicks}）`);
    (q.data.rows || []).forEach((row) => {
      console.log(`   "${row.keys[0]}"  click${row.clicks}/表示${row.impressions}/順位${row.position.toFixed(1)}`);
    });
  }

  // 4) click>0 全ページ（エリア・ホーム含む全体像）
  console.log(`\n=== ③ click>0の全ページ（種別つき）===`);
  console.log('  #  click   表示   順位   種別       URL');
  clicked.slice(0, 40).forEach((x, i) => {
    console.log(`${String(i + 1).padStart(3)} ${String(x.clicks).padStart(6)} ${String(x.imp).padStart(6)} ${x.pos.toFixed(1).padStart(6)}  ${kindOf(x.url).padEnd(9)} ${x.url.replace(/https?:\/\/[^/]+/, '')}`);
  });

  const total = rows.reduce((a, x) => a + x.clicks, 0);
  const shopTotal = shopsRanked.reduce((a, s) => a + s.clicks, 0);
  console.log(`\n合計: サイト全体click ${total} / うち店舗系ページ ${shopTotal} / それ以外（ホーム・エリア・stats等） ${total - shopTotal}`);
  console.log(`\n→ 読み方: ①で「クリック需要が実在する店」を特定 → ②のクエリで指名（店名）か発見（エリア×口コミ等）かを確認 →`);
  console.log(`   既に口コミがある店は除外し、「click>0 かつ 口コミ0」の店が5件投入の第一候補。`);
}
main().catch((e) => { console.error('❌ 取得失敗:', e.message); process.exit(1); });
