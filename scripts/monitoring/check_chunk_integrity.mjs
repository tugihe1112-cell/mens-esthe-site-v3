/**
 * check_chunk_integrity.mjs — 本番HTMLが指すJSチャンクが実在するかを外形監視する
 *
 * 背景（lessons.md「SSR HTMLに長いstale-while-revalidateを付けたら個別ページが真っ黒に」）:
 *   Next.jsはデプロイ毎にビルドIDが変わり、旧チャンクは消える。
 *   CDNが古いHTMLを配信すると、そのHTMLが指す `/_next/static/<旧buildId>/...js` が404になり、
 *   Reactが起動せずページが真っ黒になる。ユーザーもGooglebotも踏む＝インデックスが崩落する。
 *   2026年7月上旬の6日間の事故で表示が230→53に崩落した（＝-92%の真因）。
 *
 * このスクリプトがやること:
 *   1. 本番の主要ページのHTMLを取得
 *   2. HTML中の <script src="/_next/static/..."> を全部抜き出す
 *   3. 各URLを実際に取りに行き、200 かつ JSのMIME(application/javascript 等)であることを検証
 *      （404時にCDNがHTMLやtext/plainを返すのが事故のシグネチャ）
 *   4. 1つでも失敗したら exit 1（＝GitHub Actionsが落ちて通知が飛ぶ）
 *
 * 使い方:
 *   node scripts/monitoring/check_chunk_integrity.mjs
 *   BASE_URL=https://... node scripts/monitoring/check_chunk_integrity.mjs
 */

import { fetchWithRetry } from '../lib/monitorFetch.mjs';

const BASE = (process.env.BASE_URL || 'https://www.mens-esthe-map.jp').replace(/\/$/, '');

// 事故が起きると致命的なページ（SSR＝CDNの古いHTML配信リスクがある経路）を選ぶ
const PAGES = [
  '/',
  '/shops/kanagawa_sagamihara_unison_spa',
  '/shops/osaka_umeda_kokoronoyurikago',
  '/shops/hiroshima_hiroshima_hitozuma_san',
  '/area/tokyo',
];

const JS_MIME = /^(application|text)\/(javascript|ecmascript)/i;
const TIMEOUT_MS = 20000;

async function get(url, method = 'GET') {
  // 普通の閲覧者と同じキャッシュ経路を見る。no-cacheを付けると、利用者だけが踏む
  // stale HTML → 消えたchunkの組合せを監視自身が回避してしまう。
  return fetchWithRetry(url, {
    method,
    redirect: 'follow',
    headers: { 'User-Agent': 'chunk-integrity-monitor/1.0' },
  }, { timeoutMs: TIMEOUT_MS });
}

/** HTMLから /_next/static/ を指すJS URLを抜き出す（script src と modulepreload の両方） */
function extractChunkUrls(html) {
  const urls = new Set();
  const patterns = [
    /<script[^>]+src=["']([^"']*\/_next\/static\/[^"']+\.js)["']/gi,
    /<link[^>]+href=["']([^"']*\/_next\/static\/[^"']+\.js)["'][^>]*rel=["']?(?:modulepreload|preload)/gi,
    /<link[^>]+rel=["']?(?:modulepreload|preload)["']?[^>]+href=["']([^"']*\/_next\/static\/[^"']+\.js)["']/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      urls.add(m[1].startsWith('http') ? m[1] : BASE + m[1]);
    }
  }
  return [...urls];
}

const failures = [];
const chunksByUrl = new Map();

for (const path of PAGES) {
  const pageUrl = BASE + path;
  let html;
  try {
    const res = await get(pageUrl);
    if (!res.ok) {
      failures.push(`[HTML] ${pageUrl} → HTTP ${res.status}`);
      continue;
    }
    html = await res.text();
  } catch (e) {
    failures.push(`[HTML] ${pageUrl} → 取得失敗: ${e.message}`);
    continue;
  }

  const chunks = extractChunkUrls(html);
  if (chunks.length === 0) {
    // Nextのページなら必ずチャンクを指している。0件＝HTMLが壊れている or 別物が返っている
    failures.push(`[HTML] ${pageUrl} → /_next/static/ のscriptが0件（HTMLが想定外）`);
    continue;
  }

  // 真っ黒事故の直接シグネチャ：HTMLにReactのマウント先が無い
  if (!html.includes('__NEXT_DATA__')) {
    failures.push(`[HTML] ${pageUrl} → __NEXT_DATA__ が無い（Nextのページとして壊れている）`);
  }

  for (const url of chunks) {
    if (!chunksByUrl.has(url)) chunksByUrl.set(url, new Set());
    chunksByUrl.get(url).add(path);
  }
}

// 共通chunkは一度だけ取得し、異常時には影響ページをすべて併記する。
for (const [url, sourcePages] of chunksByUrl) {
  const provenance = [...sourcePages].join(', ');
  try {
    // デプロイ境界の瞬間的な404も同じURLを3回確認する。恒久404は必ず失敗する。
    const res = await fetchWithRetry(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'chunk-integrity-monitor/1.0' },
    }, { timeoutMs: TIMEOUT_MS, retryStatuses: [404] });
    const ct = res.headers.get('content-type') || '(none)';
    if (!res.ok) {
      failures.push(`[CHUNK] ${url} → HTTP ${res.status}（${provenance} が指すチャンクが消えている＝真っ黒事故）`);
    } else if (!JS_MIME.test(ct)) {
      // 404時にCDNがHTML/text-plainを返すパターン。ブラウザは
      // "Refused to execute script ... MIME type ('text/plain')" で拒否する
      failures.push(`[CHUNK] ${url} → MIMEがJSでない: ${ct}（${provenance}）`);
    }
  } catch (e) {
    failures.push(`[CHUNK] ${url} → 取得失敗: ${e.message}（${provenance}）`);
  }
}

console.log(`検査: ${PAGES.length}ページ / ${chunksByUrl.size}固有チャンク @ ${BASE}`);

if (failures.length > 0) {
  console.error(`\n❌ チャンク整合性チェック失敗（${failures.length}件）`);
  for (const f of failures) console.error('  - ' + f);
  console.error(`
対処:
  1. Vercelで最新デプロイをRedeployするか、CDNキャッシュをパージする
  2. pages/配下のCache-Controlに長い stale-while-revalidate が入っていないか確認
     （SSRのSWRは300秒以下。lessons.md参照）
  3. 復旧後はGSCのカバレッジを必ず確認し、主要ページのインデックス登録をリクエストする`);
  process.exit(1);
}

console.log('✅ 全チャンクが200かつJS MIME。真っ黒事故の兆候なし。');
