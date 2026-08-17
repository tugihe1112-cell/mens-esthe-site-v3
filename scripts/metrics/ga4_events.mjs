/**
 * ga4_events.mjs — GA4の「キーイベントが急上昇」の中身を特定する
 *
 * 【なぜ必要か（2026-08-17）】
 * GA4のインサイトが「2026-08-14 にキーイベントが2件（予測0〜2を上回る）」と通知してきたが、
 * インサイトカードは**どのイベントか**を教えてくれない。
 * 現在キーイベント（コンバージョン）に指定しているのは `click_outbound`
 * （店舗の公式サイト・出勤表・電話へのクリック＝送客）なので、
 * もし本当に click_outbound なら **サイト初の送客**であり、極めて重要な出来事になる。
 * 逆に自分たちの検証アクセスが混じっているだけの可能性もあるため、実データで確認する。
 *
 * 出すもの:
 *   1. 日別×イベント名の発生数（直近N日）
 *   2. キーイベントだけの日別内訳
 *   3. click_outbound の内訳（shop_name / link_type のカスタムディメンションがあれば）
 *   4. 国別の内訳（自分の検証アクセスかを見分ける材料）
 *
 * 実行: node scripts/metrics/ga4_events.mjs [--days=14]
 */
import fs from 'fs';
import { google } from 'googleapis';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const KEY_FILE = getEnv('GCP_METRICS_KEY') || '.gcp-metrics-key.json';
const PROP = getEnv('GA4_PROPERTY_ID');

const args = process.argv.slice(2);
const DAYS = Number((args.find((a) => a.startsWith('--days=')) || '').split('=')[1]) || 14;

if (!fs.existsSync(KEY_FILE)) { console.error(`❌ 鍵ファイルが無い: ${KEY_FILE}`); process.exit(1); }
if (!PROP) { console.error('❌ .env に GA4_PROPERTY_ID がありません'); process.exit(1); }

const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });
const ga = google.analyticsdata({ version: 'v1beta', auth });
const d = (n) => new Date(Date.now() + 9 * 3600 * 1000 - n * 864e5).toISOString().slice(0, 10);
const START = d(DAYS), END = d(0);

const run = async (body) => {
  const r = await ga.properties.runReport({ property: `properties/${PROP}`, requestBody: { dateRanges: [{ startDate: START, endDate: END }], ...body } });
  return r.data.rows || [];
};
const v = (row, i) => row.dimensionValues?.[i]?.value ?? '';
const m = (row, i) => row.metricValues?.[i]?.value ?? '0';

async function main() {
  console.log(`\n=== GA4 ${START} 〜 ${END}（${DAYS}日）===\n`);

  // ① 日別 × イベント名
  const rows1 = await run({
    dimensions: [{ name: 'date' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: true }],
    limit: 500,
  });
  console.log('=== ① 日別×イベント（発生数 / ユーザー数）===');
  let curDate = null;
  for (const r of rows1) {
    const date = v(r, 0);
    if (date !== curDate) { console.log(`\n  [${date.slice(4, 6)}-${date.slice(6, 8)}]`); curDate = date; }
    console.log(`    ${v(r, 1).padEnd(26)} ${String(m(r, 0)).padStart(4)} 回 / ${m(r, 1)} 人`);
  }

  // ② キーイベントのみ
  const rows2 = await run({
    dimensions: [{ name: 'date' }, { name: 'eventName' }],
    metrics: [{ name: 'keyEvents' }],
    limit: 500,
  });
  const key = rows2.filter((r) => Number(m(r, 0)) > 0);
  console.log('\n=== ② キーイベント（コンバージョン）だけ ===');
  if (!key.length) console.log('  （該当なし）');
  for (const r of key) console.log(`  ${v(r, 0).slice(4, 6)}-${v(r, 0).slice(6, 8)}  ${v(r, 1).padEnd(26)} ${m(r, 0)} 件`);

  // ③ click_outbound の内訳（カスタムディメンション未登録なら空になる）
  console.log('\n=== ③ click_outbound の内訳（店舗名・リンク種別）===');
  try {
    const rows3 = await run({
      dimensions: [{ name: 'customEvent:shop_name' }, { name: 'customEvent:link_type' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'click_outbound' } } },
      limit: 50,
    });
    if (!rows3.length) console.log('  （click_outbound の発生なし、またはカスタムディメンション未登録）');
    for (const r of rows3) console.log(`  ${v(r, 0) || '(不明)'} / ${v(r, 1) || '(不明)'} … ${m(r, 0)} 回`);
  } catch (e) {
    console.log('  （取得不可: ' + e.message.slice(0, 80) + '）');
  }

  // ④ 国別（自分の検証アクセスか、実ユーザーかの判別材料）
  const rows4 = await run({
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }, { name: 'eventCount' }],
    limit: 20,
  });
  console.log('\n=== ④ 国別（bot・自分の検証を見分ける）===');
  for (const r of rows4) console.log(`  ${v(r, 0).padEnd(16)} ${m(r, 0)} 人 / ${m(r, 1)} イベント`);

  console.log(`
── 読み方 ──────────────────────────────────────────────
② に click_outbound が出ていれば **サイト初の送客**（店舗の公式サイト・電話へ遷移）。
   これは口コミより手前の「サイトが役に立った」最初の証拠になる。
   ③で店舗名が出れば、どの店へ送ったかまで分かる。
② が begin_review / complete_review なら投稿ファネルが動いた証拠。
④ が日本以外に偏っていれば、bot か自分の検証アクセスの可能性が高い。
────────────────────────────────────────────────────`);
}

// 一過性エラー（クロックずれ・DNS）へのリトライ
const TRANSIENT = /ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|invalid_grant|Invalid JWT|reasonable timeframe|503|502|429/i;
const DELAYS = [15e3, 30e3, 60e3];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  for (let i = 0; ; i++) {
    try { await main(); return; }
    catch (e) {
      const msg = e?.message || String(e);
      if (!TRANSIENT.test(msg) || i >= DELAYS.length) {
        console.error('❌', msg);
        if (/Invalid JWT|invalid_grant/i.test(msg)) {
          console.error('\nヒント: Macの時計がずれている可能性があります。次を実行してから再試行してください:');
          console.error('  sudo sntp -sS time.apple.com');
        }
        process.exit(1);
      }
      console.warn(`⏳ 一過性エラー(${i + 1}/${DELAYS.length}) → ${DELAYS[i] / 1000}秒後に再試行`);
      await sleep(DELAYS[i]);
    }
  }
})();
