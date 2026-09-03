/**
 * index_coverage_probe.mjs — 「なぜインデックスされないのか」をGSCのURL検査APIで実測する
 *
 * 【なぜ必要か（2026-08-19）】
 * GSCは「クロール済み - インデックス未登録 360件」と報告している。これは
 * **Googleが見に来たうえで、載せる価値がないと判断した**という意味であり、
 * 被リンク（ドメイン評価）を増やせば解決するとは限らない。
 * 打ち手が正反対になるので、先に理由を確定させる。
 *
 *   A. 「まだ発見されていない / クロールされていない」 → 発見経路とドメイン評価の問題
 *   B. 「クロール済みだがインデックスしない」         → ページの中身が薄いという判断
 *   C. 「重複。Googleが別URLを正規と判断」            → 系列店どうしの近似コンテンツ問題
 *
 * 【実行】（Mac側。サンドボックスはGoogle APIへ疎通できない）
 *   node scripts/metrics/index_coverage_probe.mjs
 *   node scripts/metrics/index_coverage_probe.mjs --limit=40   # 店舗ページのサンプル数
 *
 * 【前提】
 *   - .env の GCP_METRICS_KEY（既定 .gcp-metrics-key.json）と GSC_SITE_URL を流用
 *   - ⚠️ URL検査APIは Search Analytics と違い、サービスアカウントが
 *     **GSCプロパティの「オーナー」または「フルユーザー」**である必要がある。
 *     403 が返る場合は GSC → 設定 → ユーザーと権限 で権限を上げること。
 *   - 割り当ては 1日2,000件・1分600件。本スクリプトは既定30件程度に抑えている。
 */
import fs from 'fs';
import { google } from 'googleapis';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const KEY_FILE = getEnv('GCP_METRICS_KEY') || '.gcp-metrics-key.json';
const SITE = getEnv('GSC_SITE_URL') || 'https://www.mens-esthe-map.jp/';
const ORIGIN = SITE.replace(/\/$/, '');

const args = process.argv.slice(2);
const SHOP_LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || 20;

if (!fs.existsSync(KEY_FILE)) { console.error(`❌ 鍵ファイルが無い: ${KEY_FILE}`); process.exit(1); }

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const sc = google.searchconsole({ version: 'v1', auth });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * サイトマップからURLを集める（Googleに送っている実物と同じ集合を見る）
 *
 * ⚠️ 2026-09-02 追加: 以前は**店舗ページしか検査していなかった**。
 *    これは測定の穴だった。実測すると
 *      店舗ページ     … 本文 約1,000字・**口コミ本文がSSRに入っていない**（70字の抜粋のみ）
 *      セラピストページ … 本文 1,300〜1,700字・**口コミ本文がSSRに入っている**
 *    ＝口コミという独自コンテンツが載っているのはセラピストページ側。
 *    「中身が薄いから登録されない」という仮説を検証するには、
 *    **厚いほうのページが登録されるか**を見なければ判定できない。
 */
async function sampleSitemapUrls(n) {
  const res = await fetch(`${ORIGIN}/api/sitemap.xml`);
  const xml = await res.text();
  const all = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const shops = all.filter((u) => /\/shops\/[^/]+$/.test(u));
  const threads = all.filter((u) => /\/threads\//.test(u));
  // 端に寄らないよう等間隔で抜く（先頭だけ見ると登録順のバイアスが乗る）
  const pick = (arr, k) => {
    const step = Math.max(1, Math.floor(arr.length / k));
    return arr.filter((_, i) => i % step === 0).slice(0, k);
  };
  return {
    total: shops.length,
    sample: pick(shops, n),
    threadTotal: threads.length,
    threadSample: pick(threads, Math.min(n, 6)),
  };
}

async function inspect(url) {
  try {
    const r = await sc.urlInspection.index.inspect({
      requestBody: { inspectionUrl: url, siteUrl: SITE },
    });
    const i = r.data.inspectionResult?.indexStatusResult || {};
    return {
      url,
      verdict: i.verdict || '-',                    // PASS / PARTIAL / FAIL / NEUTRAL
      coverage: i.coverageState || '-',             // ここが本題
      robots: i.robotsTxtState || '-',
      indexing: i.indexingState || '-',             // INDEXING_ALLOWED / BLOCKED_BY_META_TAG 等
      fetch: i.pageFetchState || '-',
      lastCrawl: i.lastCrawlTime ? i.lastCrawlTime.slice(0, 10) : '-',
      googleCanonical: i.googleCanonical || '-',
      userCanonical: i.userCanonical || '-',
    };
  } catch (e) {
    const msg = e?.errors?.[0]?.message || e.message || String(e);
    return { url, error: msg.slice(0, 120) };
  }
}

async function main() {
  console.log(`\n=== GSC URL検査 / ${SITE} ===\n`);

  const { total, sample, threadTotal, threadSample } = await sampleSitemapUrls(SHOP_LIMIT);
  // 比較のため、性質の違うURLを混ぜる。
  // 「口コミがあるページ」と「無いページ」で判定が割れるかが最大の関心事。
  const targets = [
    { label: 'トップ', url: `${ORIGIN}/` },
    { label: '統計', url: `${ORIGIN}/stats` },
    { label: 'エリア(東京)', url: `${ORIGIN}/area/tokyo` },
    { label: 'エリア(群馬)', url: `${ORIGIN}/area/gunma` },
    { label: '★口コミ有(相模原)', url: `${ORIGIN}/shops/kanagawa_sagamihara_unison_spa` },
    { label: '★口コミ有(こころ大阪)', url: `${ORIGIN}/shops/osaka_umeda_kokoronoyurikago` },
    { label: '★口コミ有(広島人妻)', url: `${ORIGIN}/shops/hiroshima_hiroshima_hitozuma_san` },
    ...sample.map((u, i) => ({ label: `店舗サンプル${i + 1}`, url: u })),
    // ⚠️ ここが判定の要。セラピストページは**口コミ本文がSSRに入っている厚いページ**。
    //    店舗ページ(薄い)が全滅でも、こちらが登録されるなら
    //    「薄いから登録されない」＝コンテンツの問題 と読める。
    //    こちらも全滅なら、コンテンツ量ではなくドメイン評価側の問題を疑う。
    ...threadSample.map((u, i) => ({ label: `◆セラピスト(口コミ有)${i + 1}`, url: u })),
  ];

  console.log(`サイトマップ: 店舗${total}件（サンプル${sample.length}）／セラピスト${threadTotal}件（サンプル${threadSample.length}）`);
  console.log(`検査対象 合計 ${targets.length}件\n`);

  const rows = [];
  for (const t of targets) {
    const r = await inspect(t.url);
    rows.push({ label: t.label, ...r });
    if (r.error) {
      console.log(`❌ ${t.label.padEnd(20)} ${r.error}`);
      if (/permission|forbidden|403/i.test(r.error)) {
        console.error('\n⚠️ URL検査APIは「オーナー」または「フルユーザー」権限が必要です。');
        console.error('   GSC → 設定 → ユーザーと権限 で、サービスアカウントの権限を上げてください。');
        console.error(`   サービスアカウント: ${JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8')).client_email}`);
        process.exit(1);
      }
    } else {
      const dup = r.googleCanonical !== '-' && r.userCanonical !== '-' && r.googleCanonical !== r.userCanonical;
      console.log(`${r.coverage === 'Submitted and indexed' ? '✅' : '⚠️ '} ${t.label.padEnd(20)} ${r.coverage.padEnd(42)} 最終クロール ${r.lastCrawl}${dup ? '  🔁別URLを正規と判断' : ''}`);
    }
    await sleep(400); // 1分600件の制限に余裕を持たせる
  }

  // ── 集計 ───────────────────────────────────────────────
  const ok = rows.filter((r) => !r.error);
  const byCoverage = {};
  for (const r of ok) byCoverage[r.coverage] = (byCoverage[r.coverage] || 0) + 1;

  console.log('\n=== 判定の内訳 ===');
  for (const [k, v] of Object.entries(byCoverage).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(v).padStart(3)}件  ${k}`);
  }

  // ── ページ種別ごとの登録率（ここが仮説の分かれ目）─────────────────
  // 「薄いから登録されない」なら、厚いセラピストページの登録率が高くなるはず。
  // 両方とも0なら、コンテンツ量ではなくドメイン評価側を疑う。
  const isIndexed = (r) => /Submitted and indexed|Indexed, not submitted/i.test(r.coverage);
  const groups = [
    ['店舗ページ（本文約1,000字・口コミ本文なし）', ok.filter((r) => /\/shops\/[^/]+$/.test(r.url))],
    ['セラピストページ（本文1,300〜1,700字・口コミ本文あり）', ok.filter((r) => /\/threads\//.test(r.url))],
    ['その他（トップ・エリア・統計）', ok.filter((r) => !/\/shops\//.test(r.url))],
  ];
  console.log('\n=== ページ種別ごとの登録率 ===');
  for (const [name, list] of groups) {
    if (!list.length) continue;
    const n = list.filter(isIndexed).length;
    console.log(`  ${String(n).padStart(2)} / ${String(list.length).padEnd(2)} 登録  ${name}`);
  }

  const dupCount = ok.filter((r) => r.googleCanonical !== '-' && r.userCanonical !== '-' && r.googleCanonical !== r.userCanonical).length;
  const neverCrawled = ok.filter((r) => r.lastCrawl === '-').length;
  const crawledNotIndexed = ok.filter((r) => /Crawled - currently not indexed/i.test(r.coverage)).length;
  const discovered = ok.filter((r) => /Discovered - currently not indexed/i.test(r.coverage)).length;
  const unknown = ok.filter((r) => /URL is unknown to Google/i.test(r.coverage)).length;

  console.log(`
── 読み方 ──────────────────────────────────────────────
「Crawled - currently not indexed」が多い  → **中身が薄いという判断**。
   被リンクを増やしても解決しない可能性が高い。ページの独自性を上げるか、
   価値の低いページを noindex にして数を絞るのが筋。          今回: ${crawledNotIndexed}件

「Discovered - currently not indexed」が多い → クロール予算が足りない。
   ＝ドメイン評価と内部リンクの問題。被リンクが効く側。        今回: ${discovered}件

「URL is unknown to Google」が多い          → そもそも発見されていない。
   サイトマップ／内部リンクの経路の問題。                      今回: ${unknown}件

「別URLを正規と判断」                        → 系列店どうしの近似コンテンツ。
   group_id で在籍を共有している店舗ページの重複。            今回: ${dupCount}件

一度もクロールされていない                                     今回: ${neverCrawled}件
────────────────────────────────────────────────────`);
}

const TRANSIENT = /ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|invalid_grant|Invalid JWT|503|502|429/i;
const DELAYS = [15e3, 30e3, 60e3];
(async () => {
  for (let i = 0; ; i++) {
    try { await main(); return; }
    catch (e) {
      const msg = e?.message || String(e);
      if (!TRANSIENT.test(msg) || i >= DELAYS.length) {
        console.error('❌', msg);
        if (/Invalid JWT|invalid_grant/i.test(msg)) {
          console.error('\nヒント: Macの時計ずれの可能性。`sudo sntp -sS time.apple.com` の後に再試行してください。');
        }
        process.exit(1);
      }
      console.warn(`⏳ 一過性エラー(${i + 1}/${DELAYS.length}) → ${DELAYS[i] / 1000}秒後に再試行`);
      await sleep(DELAYS[i]);
    }
  }
})();
