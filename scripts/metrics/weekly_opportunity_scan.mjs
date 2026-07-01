/**
 * weekly_opportunity_scan.mjs — GSCから「次に本物口コミを書くべきページ TOP N」を機会スコア順に出す（Tier 1-1）
 *   機会スコア = 表示 × max(0, 目標CTR − 現CTR)   （目標CTR=5位相当の6%）
 *   fetch_metrics.mjs と同じ .gcp-metrics-key.json / GSC_SITE_URL を流用（追加設定不要）。
 *
 * 実行: node scripts/metrics/weekly_opportunity_scan.mjs [--top=10] [--all]
 *   既定は /shops/ 系（口コミ投入で直接効くページ）に絞る。--all で全ページ（エリア等含む）。
 *   出た shop_id を insert_owner_review.mjs のJSONに入れて投入する、が週次ルーチン。
 */
import fs from 'fs';
import { google } from 'googleapis';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const KEY_FILE = getEnv('GCP_METRICS_KEY') || '.gcp-metrics-key.json';
const SITE = getEnv('GSC_SITE_URL') || 'https://www.mens-esthe-map.jp/';

const args = process.argv.slice(2);
const TOP = Number((args.find(a => a.startsWith('--top=')) || '').split('=')[1]) || 10;
const ALL = args.includes('--all');
const TARGET_CTR = 0.06; // 5位相当の想定CTR

if (!fs.existsSync(KEY_FILE)) { console.error(`❌ 鍵ファイルが無い: ${KEY_FILE}（fetch_metrics.mjsと同じ鍵）`); process.exit(1); }

const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
const sc = google.searchconsole({ version: 'v1', auth });
const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const END = d(2), START = d(30); // GSCは2〜3日遅れ

const shopIdFromUrl = (u) => { const m = u.match(/\/shops\/([^/?#]+)/); return m ? decodeURIComponent(m[1]) : null; };
const kindOf = (u) => u.includes('/threads/') ? 'therapist' : u.includes('/shops/') ? 'shop' : u.includes('/area/') ? 'area' : 'other';

async function main() {
  const r = await sc.searchanalytics.query({
    siteUrl: SITE,
    requestBody: { startDate: START, endDate: END, dimensions: ['page'], rowLimit: 5000 },
  });
  const rows = r.data.rows || [];
  const scored = rows.map((row) => {
    const url = row.keys?.[0] || '';
    const imp = row.impressions || 0, ctr = row.ctr || 0, pos = row.position || 0;
    return { url, imp, ctr, pos, clicks: row.clicks || 0, score: imp * Math.max(0, TARGET_CTR - ctr), kind: kindOf(url), shopId: shopIdFromUrl(url) };
  }).filter((x) => x.imp > 0 && x.score > 0);

  const filtered = (ALL ? scored : scored.filter((x) => x.kind === 'shop' || x.kind === 'therapist'))
    .sort((a, b) => b.score - a.score);

  console.log(`=== 次に口コミを書くべきページ TOP${TOP}（GSC ${START}〜${END} / 機会スコア順）===`);
  console.log(`機会スコア = 表示 × (目標CTR6% − 現CTR)。対象: ${ALL ? '全ページ' : '/shops/系のみ'}\n`);
  console.log('  #   score   表示   順位    CTR   種別        shop_id / URL');
  filtered.slice(0, TOP).forEach((x, i) => {
    console.log(
      `${String(i + 1).padStart(3)} ${x.score.toFixed(1).padStart(7)} ${String(x.imp).padStart(6)} ${x.pos.toFixed(1).padStart(6)} ${(x.ctr * 100).toFixed(1).padStart(5)}%  ${x.kind.padEnd(10)} ${x.shopId || x.url}`
    );
  });
  if (!filtered.length) console.log('（機会スコア>0のページなし。表示自体がまだ少ない可能性）');
  console.log(`\n→ 上位の shop_id を insert_owner_review.mjs のJSONに入れて本物口コミを投入＝週次ルーチン。`);
}
main().catch((e) => { console.error('❌ 取得失敗:', e.message); process.exit(1); });
