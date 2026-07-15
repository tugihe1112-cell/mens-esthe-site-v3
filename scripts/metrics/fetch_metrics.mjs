/**
 * fetch_metrics.mjs — GA4 Data API + GSC API から数値を取得し playbook/metrics-log.md に1行追記
 *
 * 前提（初回のみ）:
 *   1. npm install googleapis
 *   2. Google Cloudでサービスアカウント作成→JSON鍵を `.gcp-metrics-key.json` としてリポジトリ直下に置く（.gitignore済）
 *   3. .env に GA4_PROPERTY_ID と（任意で）GSC_SITE_URL を追加
 *   4. GA4プロパティ と GSCプロパティ に、そのサービスアカウントのメールを閲覧者として追加
 *
 * 実行: node scripts/metrics/fetch_metrics.mjs
 */
import fs from 'fs';
import { google } from 'googleapis';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const KEY_FILE = getEnv('GCP_METRICS_KEY') || '.gcp-metrics-key.json';
const GA4_PROPERTY_ID = getEnv('GA4_PROPERTY_ID'); // 数字のみ（例 480123456）
const SITE = getEnv('GSC_SITE_URL') || 'https://www.mens-esthe-map.jp/';
const MD = 'playbook/metrics-log.md';

const TARGETS = {
  'unison相模原': '/shops/kanagawa_sagamihara_unison_spa',
  'こころ大阪': '/shops/osaka_umeda_kokoronoyurikago',
  '広島人妻': '/shops/hiroshima_hiroshima_hitozuma_san',
};

if (!GA4_PROPERTY_ID) { console.error('❌ .env に GA4_PROPERTY_ID が無い'); process.exit(1); }
if (!fs.existsSync(KEY_FILE)) { console.error(`❌ 鍵ファイルが無い: ${KEY_FILE}`); process.exit(1); }

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
});

// GSCはデータ2〜3日遅れ → 直近28日（終端は2日前）で揃える
const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const END = d(2), START = d(30);

const sc = google.searchconsole({ version: 'v1', auth });
const ga = google.analyticsdata({ version: 'v1beta', auth });

async function gscByPage() {
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: START, endDate: END, dimensions: ['page'], rowLimit: 1000 } });
  return r.data.rows || [];
}
async function gscTotal() {
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: START, endDate: END } });
  return (r.data.rows || [])[0] || { clicks: 0, impressions: 0, position: 0 };
}
// サニティチェック用：GSCが実際にデータを返した「日数」を数える。
// 28日窓なのに数日分しか返らない＝GSCの集計遅延 or API部分レスポンス＝impressions総計が過少になる。
// これを検知しないと、今回のような「1140→374(19日分欠け)」を"実勢の急落"と誤認する（偽アラート）。
async function gscDailyDays() {
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: START, endDate: END, dimensions: ['date'], rowLimit: 1000 } });
  return (r.data.rows || []).length;
}
async function ga4ActiveUsers() {
  // ⚠️ bot/海外クローラー（US/Germany/India等・エンゲージ0%）を除外するため日本のみに絞る
  const r = await ga.properties.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    requestBody: {
      dateRanges: [{ startDate: START, endDate: END }],
      metrics: [{ name: 'activeUsers' }, { name: 'engagementRate' }],
      dimensionFilter: { filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: 'Japan' } } },
    },
  });
  const m = r.data.rows?.[0]?.metricValues || [];
  return { users: m[0]?.value ?? '-', engRate: m[1]?.value ? (Number(m[1].value) * 100).toFixed(0) + '%' : '-' };
}

async function main() {
  const [pages, total, g, daysReturned] = await Promise.all([gscByPage(), gscTotal(), ga4ActiveUsers(), gscDailyDays()]);
  const cell = (path) => {
    const row = pages.find((r) => (r.keys?.[0] || '').includes(path));
    return row ? `${row.clicks}/${row.impressions}/${row.position.toFixed(1)}` : '0/0/-';
  };
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(5, 10); // JST(UTC+9) MM-DD

  // サニティチェック：GSC返却日数が期待窓を4日以上下回ったら「部分データ」＝impressions過少として警告。
  const expectedDays = Math.round((Date.parse(END) - Date.parse(START)) / 864e5) + 1;
  const dataOk = daysReturned >= expectedDays - 4;
  const sanity = dataOk
    ? ''
    : `⚠️GSC部分データ(返却${daysReturned}日/期待${expectedDays}日)=impressions過少・実勢として使わない。 `;
  if (!dataOk) {
    console.warn(`⚠️ GSCが${daysReturned}日分しか返していません(期待${expectedDays}日)。集計遅延かAPI部分レスポンス＝この日のimpressions総計は当てになりません。数日後に同一窓が上方修正される可能性大。`);
  }

  const newRow = `| ${today} | ${total.clicks} | ${total.impressions} | ${total.position.toFixed(1)} | ${g.users} | ${cell(TARGETS['unison相模原'])} | ${cell(TARGETS['こころ大阪'])} | ${cell(TARGETS['広島人妻'])} | ${sanity}自動取得(GSC ${START}〜${END}/返却${daysReturned}日/GA4=日本のみ eng${g.engRate})。施策/所感は毎朝タスクが追記 |`;

  let md = fs.readFileSync(MD, 'utf-8');
  if (md.includes(`| ${today} |`)) { console.log(`既に ${today} の行あり → スキップ:`, newRow); }
  else {
    // 最後の表データ行のすぐ下に挿入（空行を作らず表を連続させる）
    const lines = md.split('\n');
    let lastRow = -1;
    for (let i = 0; i < lines.length; i++) if (lines[i].startsWith('| ')) lastRow = i;
    lines.splice(lastRow + 1, 0, newRow);
    fs.writeFileSync(MD, lines.join('\n'));
    console.log('✅ 追記:', newRow);
  }
}
main().catch((e) => { console.error('❌ 取得失敗:', e.message); process.exit(1); });
