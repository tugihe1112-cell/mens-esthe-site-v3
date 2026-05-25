/**
 * hakatahitozuma.com の構造を詳しく調査
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const BASE = 'https://hakatahitozuma.com';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 1. スタッフページのHTML確認
console.log('=== /staff/ ページ ===');
const res = await fetch(`${BASE}/staff/`, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);
console.log(`img総数: ${$('img').length}`);
console.log(`script総数: ${$('script').length}`);

// Next.js の __NEXT_DATA__ を探す
const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (nextData) {
  console.log('\n✅ __NEXT_DATA__ 発見！');
  try {
    const data = JSON.parse(nextData[1]);
    console.log('props keys:', Object.keys(data?.props?.pageProps || {}));
    const pageProps = data?.props?.pageProps;
    // セラピスト情報を探す
    const str = JSON.stringify(pageProps);
    const therapistMatch = str.match(/"name":"([^"]+)"/g);
    if (therapistMatch) console.log('name候補:', therapistMatch.slice(0, 10));
    console.log('\npageProps（先頭500字）:', str.slice(0, 500));
  } catch(e) { console.log('パースエラー:', e.message); }
} else {
  console.log('\n__NEXT_DATA__ なし');
}

// 2. Next.js API routeを試す
console.log('\n=== API エンドポイント試行 ===');
const apiPaths = [
  '/api/staff',
  '/api/therapists',
  '/api/cast',
  '/api/members',
  '/_next/data/staff.json',
];
for (const path of apiPaths) {
  try {
    const r = await fetch(`${BASE}${path}`, { headers: ua, signal: AbortSignal.timeout(5000) });
    console.log(`  ${path}: HTTP ${r.status} (${r.headers.get('content-type')})`);
    if (r.status === 200) {
      const text = await r.text();
      console.log(`  → ${text.slice(0, 100)}`);
    }
  } catch { console.log(`  ${path}: 失敗`); }
  await sleep(200);
}
