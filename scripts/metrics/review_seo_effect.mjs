/**
 * review_seo_effect.mjs — 「口コミを入れたページは検索に出ているのか」を実測する
 *
 * 【なぜ必要か（2026-08-13）】
 * これまで `top_clicked_pages.mjs` で「クリックされている店」を探したが、
 * サイト全体のクリック26件が**すべてホームページ**で、店舗ページは0だった。
 * ＝ クリックから逆算する作戦は前提が崩れている。
 *
 * そこで見る指標を**クリックから表示回数（impressions）に下げる**。
 * クリック0でも表示があれば「検索結果には出ている＝インデックスされ、順位が低いだけ」、
 * 表示すら0なら「そもそもインデックスされていない or 需要が無い」と切り分けられる。
 *
 * さらに重要なのは、**口コミを既に入れた店と、入れていない店を並べて比べる**こと。
 * 口コミ6件のSilkに表示があり、口コミ0の店に無いなら「口コミは効く」。
 * Silkにも表示が無いなら、ボトルネックは口コミの量ではなく**ドメイン評価/インデックス**。
 * この判定を、新しく7件書く前に無料で得るのが目的。
 *
 * 実行: node scripts/metrics/review_seo_effect.mjs [--days=28]
 *   認証は fetch_metrics.mjs と同じ .gcp-metrics-key.json を流用。
 */
import fs from 'fs';
import { google } from 'googleapis';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const KEY_FILE = getEnv('GCP_METRICS_KEY') || '.gcp-metrics-key.json';
const SITE = getEnv('GSC_SITE_URL') || 'https://www.mens-esthe-map.jp/';

const args = process.argv.slice(2);
const DAYS = Number((args.find((a) => a.startsWith('--days=')) || '').split('=')[1]) || 28;

if (!fs.existsSync(KEY_FILE)) { console.error(`❌ 鍵ファイルが無い: ${KEY_FILE}`); process.exit(1); }

const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
const sc = google.searchconsole({ version: 'v1', auth });
const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const END = d(2), START = d(2 + DAYS);

// 口コミを入れた店（CLAUDE.mdの記録より）。件数は「公開されている想定」の数。
const SEEDED = {
  tokyo_shibuya_silk: 6,
  kanagawa_sagamihara_unison_spa: 3,
  osaka_umeda_kokoronoyurikago: 3,
  hiroshima_hiroshima_hitozuma_san: 2,
};

const shopIdFromUrl = (u) => { const m = u.match(/\/shops\/([^/?#]+)/); return m ? decodeURIComponent(m[1]) : null; };
const isThread = (u) => u.includes('/threads/');

async function main() {
  const res = await sc.searchanalytics.query({
    siteUrl: SITE,
    requestBody: { startDate: START, endDate: END, dimensions: ['page'], rowLimit: 25000 },
  });
  const rows = res.data.rows || [];

  console.log(`\n=== GSC ${START} 〜 ${END}（${DAYS}日）===`);
  console.log(`表示回数が1以上あったページ: ${rows.length} 件\n`);

  // ── ① 口コミを入れた店の成績 ────────────────────────────────
  console.log('=== ① 口コミを入れた店は検索に出ているか ===');
  console.log('  口コミ  表示   click  順位   shop_id');
  for (const [shopId, n] of Object.entries(SEEDED)) {
    const mine = rows.filter((r) => shopIdFromUrl(r.keys[0]) === shopId);
    const imp = mine.reduce((s, r) => s + r.impressions, 0);
    const clk = mine.reduce((s, r) => s + r.clicks, 0);
    const pos = mine.length ? Math.min(...mine.map((r) => r.position)).toFixed(1) : '-';
    console.log(`  ${String(n).padStart(4)}  ${String(imp).padStart(5)}  ${String(clk).padStart(5)}  ${String(pos).padStart(5)}   ${shopId}`);
  }

  // ── ② 口コミゼロの店で表示があるページ（比較対象）──────────
  const seededIds = new Set(Object.keys(SEEDED));
  const others = rows
    .filter((r) => { const id = shopIdFromUrl(r.keys[0]); return id && !seededIds.has(id) && !isThread(r.keys[0]); })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);
  console.log('\n=== ② 口コミ0なのに表示がある店舗ページ TOP15 ===');
  if (!others.length) console.log('  （該当なし＝店舗ページは軒並み表示0）');
  for (const r of others) {
    console.log(`  表示${String(r.impressions).padStart(5)} click${String(r.clicks).padStart(4)} 順位${r.position.toFixed(1).padStart(5)}  ${shopIdFromUrl(r.keys[0])}`);
  }

  // ── ③ 種別ごとの合計（どこに検索需要があるか）──────────────
  const kind = (u) => isThread(u) ? 'セラピスト' : u.includes('/shops/') ? '店舗' : u.includes('/area/') ? 'エリア' : u.replace(/https?:\/\/[^/]+/, '') === '/' ? 'ホーム' : 'その他';
  const agg = {};
  for (const r of rows) {
    const k = kind(r.keys[0]);
    agg[k] ??= { imp: 0, clk: 0, pages: 0 };
    agg[k].imp += r.impressions; agg[k].clk += r.clicks; agg[k].pages++;
  }
  console.log('\n=== ③ 種別ごとの検索需要 ===');
  console.log('  種別          表示    click  ページ数');
  for (const [k, v] of Object.entries(agg).sort((a, b) => b[1].imp - a[1].imp)) {
    console.log(`  ${k.padEnd(12)}${String(v.imp).padStart(6)}  ${String(v.clk).padStart(6)}  ${String(v.pages).padStart(6)}`);
  }

  console.log(`
── 読み方 ──────────────────────────────────────────────
① Silk(口コミ6件)に表示がある → 口コミはインデックス・表示に効いている
                              → 本命3店に7件書く価値が高い
   Silkにも表示が無い         → ボトルネックは口コミの量ではなく
                              **ドメイン評価/インデックス**。
                              先に被リンク(/stats配布)を回すべき
② ①の裏取り。口コミ0でも表示がある店が多いなら、表示は口コミと無関係
③ 検索需要がホームに偏っているなら、店舗ページは戦えていない
────────────────────────────────────────────────────`);
}

// ── 一過性エラーへのリトライ（fetch_metrics.mjs と同じ思想）──────────
// ⚠️ `invalid_grant: Invalid JWT ... iat and exp` は **Macのシステムクロックのずれ**が原因。
//    スリープ復帰直後に多い。数十秒〜数分待てば時刻同期されて解消することが多いので粘る。
//    それでも直らない場合は手元で時計を同期する:  sudo sntp -sS time.apple.com
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
      console.warn(`⏳ 一過性エラー(${i + 1}/${DELAYS.length}) → ${DELAYS[i] / 1000}秒後に再試行: ${msg.slice(0, 80)}`);
      await sleep(DELAYS[i]);
    }
  }
})();
