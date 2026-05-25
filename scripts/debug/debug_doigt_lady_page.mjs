/**
 * doigt de fee 個別 lady ページ構造確認
 * 実行: node scripts/debug/debug_doigt_lady_page.mjs
 */
import * as cheerio from 'cheerio';

const SITE = 'https://exe-fee.com';
const LADY_URL = `${SITE}/lady/`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  // 1. list page からリンクを1件取得
  console.log('=== リストページ取得 ===');
  const listRes = await fetch(LADY_URL, { headers: ua });
  const $ = cheerio.load(await listRes.text());
  console.log(`HTTP: ${listRes.status}`);

  // 川崎フィルタ確認
  console.log('\n=== 店舗フィルタ確認 ===');
  const storeTexts = new Set();
  $('li, article').each((i, el) => {
    const text = $(el).text();
    const m = text.match(/【([^】]+)】/g);
    if (m) m.forEach(t => storeTexts.add(t));
  });
  console.log('【】テキスト一覧:', [...storeTexts].slice(0, 20).join(', '));

  // 川崎店のリンク取得
  const kawasaki = [];
  $('li:has(img), article:has(img)').each((i, el) => {
    const text = $(el).text();
    // 複数パターンを試す
    const isKawasaki = text.includes('【川崎】') || text.includes('【川崎店】');
    if (!isKawasaki) return;
    const link = $(el).find('a[href*="/lady/"]').first().attr('href') || '';
    const img = $(el).find('img[src*="imgsrv"]').first().attr('src') || '';
    if (link && img) kawasaki.push({ link, img });
  });
  console.log(`\n川崎エントリ数: ${kawasaki.length}`);
  console.log('先頭3件:', kawasaki.slice(0, 3));

  if (kawasaki.length === 0) {
    // もっと広いフィルタで確認
    console.log('\n=== 全li/article のテキスト先頭20 ===');
    $('li:has(img), article:has(img)').slice(0, 20).each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
      const img = $(el).find('img').first().attr('src') || '';
      console.log(`[${i}] img="${img.slice(0, 60)}" text="${text}"`);
    });
    return;
  }

  // 2. 個別ページ取得
  const testUrl = kawasaki[0].link.startsWith('http') ? kawasaki[0].link : `${SITE}${kawasaki[0].link}`;
  console.log(`\n=== 個別ページ取得: ${testUrl} ===`);
  await new Promise(r => setTimeout(r, 500));
  const pageRes = await fetch(testUrl, { headers: ua });
  const page$ = cheerio.load(await pageRes.text());
  console.log(`HTTP: ${pageRes.status}`);

  // タイトル
  console.log(`\ntitle: "${page$('title').text().trim()}"`);

  // h1/h2/h3
  ['h1', 'h2', 'h3'].forEach(tag => {
    page$(tag).each((i, el) => {
      const text = page$(el).text().trim();
      if (text) console.log(`${tag}[${i}]: "${text.slice(0, 60)}"`);
    });
  });

  // name/cast系クラス
  console.log('\n=== name/cast/lady クラス ===');
  page$('[class*="name"],[class*="cast"],[class*="lady"],[class*="profile"]').slice(0, 10).each((i, el) => {
    const cls = page$(el).attr('class') || '';
    const text = page$(el).text().replace(/\s+/g, ' ').trim().slice(0, 80);
    if (text) console.log(`  cls="${cls.slice(0, 40)}" "${text}"`);
  });

  // dt/dd (スペック系)
  console.log('\n=== dl/dt/dd ===');
  page$('dl, dt, dd').slice(0, 10).each((i, el) => {
    const text = page$(el).text().replace(/\s+/g, ' ').trim().slice(0, 60);
    if (text) console.log(`  ${el.tagName}: "${text}"`);
  });

  // img
  console.log('\n=== 画像URL ===');
  page$('img').slice(0, 8).each((i, el) => {
    const src = page$(el).attr('src') || '';
    const alt = page$(el).attr('alt') || '';
    if (src) console.log(`  src="${src.slice(0, 80)}" alt="${alt}"`);
  });
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
