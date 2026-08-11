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

  // サニティチェック：GSC返却日数が26日未満なら「部分データ」＝impressions過少として警告。
  // 窓は29日（END=2日前・START=30日前）。GSCの集計遅延やAPIの部分レスポンスで
  // 日数が欠けると総計が過少になり、これを見逃すと「実勢の急落」と誤認する。
  // 実例: 07-14の1140→07-15の374は19日分の欠落で、実勢崩壊ではなかった。
  // 行頭に⚠️を立てて metrics-log に残す＝後から表を読み返す人が必ず気づく。
  const MIN_DAYS = 26;
  const expectedDays = Math.round((Date.parse(END) - Date.parse(START)) / 864e5) + 1;
  const dataOk = daysReturned >= MIN_DAYS;
  const sanity = dataOk
    ? ''
    : `⚠️GSC部分データ(返却${daysReturned}日/期待${expectedDays}日・閾値${MIN_DAYS}日)=impressions過少・実勢として使わない。 `;
  if (!dataOk) {
    console.warn(`⚠️ GSCが${daysReturned}日分しか返していません(期待${expectedDays}日/閾値${MIN_DAYS}日)。集計遅延かAPI部分レスポンス＝この日のimpressions総計は当てになりません。数日後に同一窓が上方修正される可能性大。`);
  }

  // 行頭に⚠️を出す（表の1列目より前にマーカーを置くと崩れるため、日付セルの先頭に付ける）
  const dateCell = dataOk ? today : `⚠️ ${today}`;
  const newRow = `| ${dateCell} | ${total.clicks} | ${total.impressions} | ${total.position.toFixed(1)} | ${g.users} | ${cell(TARGETS['unison相模原'])} | ${cell(TARGETS['こころ大阪'])} | ${cell(TARGETS['広島人妻'])} | ${sanity}自動取得(GSC ${START}〜${END}/返却${daysReturned}日/GA4=日本のみ eng${g.engRate})。施策/所感は毎朝タスクが追記 |`;

  let md = fs.readFileSync(MD, 'utf-8');
  const lines = md.split('\n');
  // 重複判定は⚠️プレフィックスを許容する（付いた日の翌日以降に二重追記されるのを防ぐ）
  const todayRe = new RegExp(`^\\|\\s*(?:⚠️\\s*)?${today}\\s*\\|`);
  const idx = lines.findIndex((l) => todayRe.test(l));

  // 数値セルが「未記入」かどうか（—／－／-／空／? を未記入とみなす）
  const isBlank = (s) => /^\s*(?:[—－\-–]|\?|)\s*$/.test(s || '');

  if (idx === -1) {
    // ── 今日の行がまだ無い → 末尾に追記（通常ルート）
    let lastRow = -1;
    for (let i = 0; i < lines.length; i++) if (lines[i].startsWith('| ')) lastRow = i;
    lines.splice(lastRow + 1, 0, newRow);
    fs.writeFileSync(MD, lines.join('\n'));
    console.log('✅ 追記:', newRow);
    return;
  }

  // ── 今日の行が既にある場合 ──
  // ⚠️ 2026-08-11の事故対策:
  //    毎朝9時の日次ダイジェストタスクが、数値の取得前に「| 08-11 | — | — | … |」という
  //    プレースホルダ行を先に書くことがある（launchdが8:55で失敗した日など）。
  //    従来はここで無条件にスキップしていたため、**その後いくら実行しても
  //    「既に今日の行あり」と判定され、本物の数値が永久に入らなかった**。
  //    ＝欠測を恐れて空行を先に書く運用が、逆に本物のデータを締め出していた。
  //    そこで「行はあるが数値が未記入」なら数値セルだけを埋める（所感列は消さない）。
  const cells = lines[idx].split('|');
  // cells = ['', 日付, click, 表示, 順位, GA4U, unison, こころ, 広島, 所感, '']
  const numericBlank = [2, 3, 4, 5].every((i) => isBlank(cells[i]));

  if (!numericBlank) {
    console.log(`既に ${today} の行あり（数値も記入済み）→ スキップ:`, newRow);
    return;
  }

  const newCells = newRow.split('|');
  const oldNote = (cells[9] || '').trim();
  for (let i = 1; i <= 8; i++) cells[i] = newCells[i]; // 日付〜本命3ページを差し替え
  cells[9] = ` ${newCells[9].trim()}`
    + (oldNote
      ? ` ⚠️**数値は後から補填**（この行は数値が無い時点で作られた）。補填前の記述: ${oldNote}`
      : '');
  lines[idx] = cells.join('|');
  fs.writeFileSync(MD, lines.join('\n'));
  console.log(`🔧 ${today} の空行に数値を補填しました:`, lines[idx].slice(0, 120) + '…');
}
// ── 起動直後の一過性エラーに対するリトライ ────────────────────────────
// launchd が Mac のスリープ復帰直後に起動すると、まだ以下が整っていないことがある:
//   ・DNS/ネットワーク未確立 → `getaddrinfo ENOTFOUND oauth2.googleapis.com`（2026-07-06の失敗）
//   ・システムクロックが未同期 → `invalid_grant: Invalid JWT ... iat and exp`（2026-08-04の失敗）
// どちらも数分待てば自然に解消する一過性の障害なので、そこで諦めず指数バックオフで粘る。
// （2026-08-04はこれが無かったため1回の失敗でその日の記録が丸ごと欠けた）
const TRANSIENT = /ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|ENETUNREACH|socket hang up|invalid_grant|Invalid JWT|reasonable timeframe|503|502|429/i;
const RETRY_DELAYS_MS = [30e3, 60e3, 120e3, 240e3, 480e3]; // 30s,1m,2m,4m,8m ＝最大約15分粘る

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runWithRetry() {
  for (let attempt = 0; ; attempt++) {
    try {
      await main();
      return;
    } catch (e) {
      const msg = e?.message || String(e);
      const retriable = TRANSIENT.test(msg) && attempt < RETRY_DELAYS_MS.length;
      if (!retriable) {
        console.error('❌ 取得失敗:', msg);
        process.exit(1);
      }
      const wait = RETRY_DELAYS_MS[attempt];
      console.warn(`⏳ 一過性エラー(${attempt + 1}/${RETRY_DELAYS_MS.length}) → ${wait / 1000}秒後に再試行: ${msg}`);
      await sleep(wait);
    }
  }
}

runWithRetry();
