/**
 * index_request_queue.mjs — Search Console の「インデックス登録をリクエスト」を1日10件ずつ進めるための
 *                           順番・記録・結果の確認（データベースには書かない）
 *
 * 【なぜ必要か（2026-10-07）】
 * 10/06 の測定で、Google に登録されているのはトップページ1枚だけ（店 0/18・セラピスト 0/6）。
 * 口コミのあるページを Google に読みに来てもらうため、Search Console の画面から
 * 「インデックス登録をリクエスト」を1日10件（Google の上限）ずつ出す。画面の操作は
 * 定期タスク（~/.claude/scheduled-tasks/daily-index-requests/SKILL.md）がアプリ内のブラウザで行い、
 * このスクリプトは「次にどれを出すか」「何を出したか」「その後どうなったか」だけを受け持つ。
 * ※ リクエストそのものに API は無い（Google の Indexing API は求人・ライブ配信のページ専用）。
 *
 * 【使い方】（Mac 側。サンドボックスは Google API へ疎通できない）
 *   node scripts/metrics/index_request_queue.mjs next [--n=10]
 *       → サイトマップ（今 Google に出しているページ）から、まだリクエストしていないページを
 *         口コミの多い順に n 件。店・ブランドのページが先、セラピストのページが後。
 *         outputs/index-requests/next.json にも書く。
 *   node scripts/metrics/index_request_queue.mjs mark <URL> <リクエスト前の状態> <結果>
 *       → 結果は requested（リクエスト済み）/ already_indexed（既に登録済みで出さなかった）/
 *         quota（上限で出せなかった＝次回もう一度）/ error（画面の不具合など）
 *   node scripts/metrics/index_request_queue.mjs status
 *       → これまでにリクエストしたページを URL検査API で調べ、登録済みの数・前回からの変化・
 *         リクエスト後に Google が読みに来たかを出す。outputs/index-requests/status-<日付>.json に保存。
 *   node scripts/metrics/index_request_queue.mjs last
 *       → 最後に「requested」を記録した時刻と、そこから何時間たったか（上限の待ちの判断用）
 *
 * 【前提】URL検査API は .env の GCP_METRICS_KEY（既定 .gcp-metrics-key.json）と GSC_SITE_URL を使う
 *         （index_coverage_probe.mjs と同じ）。口コミの件数は読み取りだけ（service role・書かない）。
 */
import fs from 'node:fs';
import path from 'node:path';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SITE = getEnv('GSC_SITE_URL') || 'https://www.mens-esthe-map.jp/';
const ORIGIN = SITE.replace(/\/$/, '');
const DIR = 'outputs/index-requests';
const PROGRESS = path.join(DIR, 'progress.json');

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name, def) => {
  const hit = rest.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : def;
};
const KNOWN = new Set(['next', 'mark', 'status', 'last']);
if (!KNOWN.has(cmd)) {
  console.error('使い方: next [--n=10] | mark <URL> <リクエスト前の状態> <結果> | status | last');
  process.exit(1);
}

fs.mkdirSync(DIR, { recursive: true });
const loadProgress = () => (fs.existsSync(PROGRESS) ? JSON.parse(fs.readFileSync(PROGRESS, 'utf8')) : { requests: [] });
const saveProgress = (p) => fs.writeFileSync(PROGRESS, JSON.stringify(p, null, 1));
// 同じページを「%エンコードあり／なし」で二重に数えない
const norm = (u) => { try { return decodeURIComponent(u).replace(/\/$/, ''); } catch { return u.replace(/\/$/, ''); } };
const label = (u) => norm(u).replace(ORIGIN, '');
const jstDate = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);

async function sitemapPages() {
  const res = await fetch(`${ORIGIN}/api/sitemap.xml`, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error(`サイトマップを取れない: HTTP ${res.status}`);
  const all = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!all.length) throw new Error('サイトマップが空（読み違いの可能性。空を「出すもの無し」と読まない）');
  return {
    shops: all.filter((u) => /\/(shops|brands)\/[^/]+$/.test(u)),
    threads: all.filter((u) => /\/threads\/[^/]+$/.test(u)),
  };
}

async function reviewCounts() {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const { data: revs, error } = await sb.from('reviews').select('shop_id,therapist_id,content').or('is_public.eq.true,user_id.eq.owner_manual');
  if (error) throw error;
  const shops = [];
  for (let from = 0; ; from += 1000) { // PostgREST は1回1000行まで
    const { data, error: e } = await sb.from('shops').select('id,group_id').order('id').range(from, from + 999);
    if (e) throw e;
    shops.push(...data);
    if (data.length < 1000) break;
  }
  return { revs, groupOf: Object.fromEntries(shops.map((s) => [s.id, s.group_id])) };
}

if (cmd === 'next') {
  const n = Number(flag('n', '10')) || 10;
  const done = new Set(loadProgress().requests.filter((r) => r.result !== 'quota' && r.result !== 'error').map((r) => norm(r.url)));
  const { shops, threads } = await sitemapPages();
  const { revs, groupOf } = await reviewCounts();
  const rows = [];
  for (const u of shops) {
    const key = norm(u).split('/').pop();
    const rs = revs.filter((r) => (u.includes('/brands/') ? groupOf[r.shop_id] === key : r.shop_id === key));
    rows.push({ url: u, kind: '店', n: rs.length, chars: rs.reduce((a, r) => a + (r.content?.length || 0), 0) });
  }
  for (const u of threads) {
    const tid = norm(u).split('/threads/')[1];
    const rs = revs.filter((r) => r.therapist_id === tid);
    rows.push({ url: u, kind: '人', n: rs.length, chars: rs.reduce((a, r) => a + (r.content?.length || 0), 0) });
  }
  rows.sort((a, b) => (a.kind === b.kind ? b.n - a.n || b.chars - a.chars : a.kind === '店' ? -1 : 1));
  const todo = rows.filter((r) => !done.has(norm(r.url)));
  const pick = todo.slice(0, n);
  fs.writeFileSync(path.join(DIR, 'next.json'), JSON.stringify(pick, null, 1));
  console.log(`サイトマップの店・ブランド ${shops.length}・セラピスト ${threads.length}／リクエスト済み ${done.size}／まだ ${todo.length}`);
  pick.forEach((r, i) => console.log(`${i + 1}\t${r.kind}\t口コミ${r.n}件\t${r.url}\t${label(r.url)}`));
  if (!pick.length) console.log('（まだリクエストしていないページは無い）');
}

if (cmd === 'mark') {
  const [url, before = '', result = 'requested'] = rest.filter((a) => !a.startsWith('--'));
  if (!url || !url.startsWith(`${ORIGIN}/`)) { console.error(`このサイトの URL（${ORIGIN}/…）を渡す`); process.exit(1); }
  if (!['requested', 'already_indexed', 'quota', 'error'].includes(result)) {
    console.error(`結果は requested / already_indexed / quota / error のどれか（受け取った値: ${result}）`);
    process.exit(1);
  }
  const p = loadProgress();
  p.requests.push({ url, before, result, requested_at: new Date().toISOString() });
  saveProgress(p);
  console.log(`記録: ${result}\t${label(url)}\t（リクエスト前: ${before}）`);
}

if (cmd === 'last') {
  const req = loadProgress().requests.filter((r) => r.result === 'requested');
  if (!req.length) { console.log('まだ1件もリクエストしていない'); process.exit(0); }
  const last = req.map((r) => r.requested_at).sort().pop();
  const hours = (Date.now() - new Date(last).getTime()) / 3600e3;
  console.log(`最後のリクエスト ${last}（${hours.toFixed(1)} 時間前）／これまでのリクエスト ${new Set(req.map((r) => norm(r.url))).size} 件`);
}

if (cmd === 'status') {
  const { google } = await import('googleapis');
  const KEY_FILE = getEnv('GCP_METRICS_KEY') || '.gcp-metrics-key.json';
  if (!fs.existsSync(KEY_FILE)) { console.error(`❌ 鍵ファイルが無い: ${KEY_FILE}`); process.exit(1); }
  const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const sc = google.searchconsole({ version: 'v1', auth });

  const p = loadProgress();
  const firstReq = new Map();
  for (const r of p.requests.filter((x) => x.result === 'requested' || x.result === 'already_indexed')) {
    const k = norm(r.url);
    if (!firstReq.has(k)) firstReq.set(k, r);
  }
  const prevFile = fs.readdirSync(DIR).filter((f) => /^status-\d{4}-\d{2}-\d{2}\.json$/.test(f) && f !== `status-${jstDate()}.json`).sort().pop();
  const prev = prevFile ? Object.fromEntries(JSON.parse(fs.readFileSync(path.join(DIR, prevFile), 'utf8')).map((r) => [norm(r.url), r])) : {};

  const out = [];
  for (const [k, r] of firstReq) {
    let row;
    try {
      const res = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: r.url, siteUrl: SITE } });
      const i = res.data.inspectionResult?.indexStatusResult || {};
      row = { url: r.url, coverage: i.coverageState || '-', verdict: i.verdict || '-', lastCrawl: i.lastCrawlTime || null };
    } catch (e) {
      row = { url: r.url, coverage: `取得失敗: ${e.message}`, verdict: '-', lastCrawl: null };
    }
    row.requested_at = r.requested_at;
    row.crawledAfterRequest = !!(row.lastCrawl && row.lastCrawl > r.requested_at);
    row.indexed = row.verdict === 'PASS';
    row.prevCoverage = prev[k]?.coverage ?? null;
    out.push(row);
    await new Promise((s) => setTimeout(s, 250)); // 1分600件の上限に余裕を持たせる
  }
  fs.writeFileSync(path.join(DIR, `status-${jstDate()}.json`), JSON.stringify(out, null, 1));

  const failed = out.filter((r) => r.coverage.startsWith('取得失敗'));
  console.log(`リクエスト済み ${out.length} 件のうち 登録済み ${out.filter((r) => r.indexed).length}／リクエスト後に Google が読みに来た ${out.filter((r) => r.crawledAfterRequest).length}${failed.length ? `／調べられなかった ${failed.length}` : ''}`);
  console.log(`前回の記録: ${prevFile || '（なし＝今回が初回）'}`);
  const changed = out.filter((r) => r.prevCoverage !== null && r.prevCoverage !== r.coverage);
  console.log(`前回から状態が変わったページ: ${changed.length}`);
  changed.forEach((r) => console.log(`  ${label(r.url)}\t${r.prevCoverage} → ${r.coverage}`));
  console.log('--- 全件 ---');
  out.forEach((r) => console.log(`${r.indexed ? '✅' : '・'}\t${label(r.url)}\t${r.coverage}\t最終クロール ${r.lastCrawl ? r.lastCrawl.slice(0, 10) : '-'}${r.crawledAfterRequest ? '（リクエスト後に来た）' : ''}`));
}
