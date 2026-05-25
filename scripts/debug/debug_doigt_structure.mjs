/**
 * doigt de fee リストページ全構造調査
 * 実行: node scripts/debug/debug_doigt_structure.mjs
 */
import * as cheerio from 'cheerio';

const SITE = 'https://exe-fee.com';
const LADY_URL = `${SITE}/lady/`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const res = await fetch(LADY_URL, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  // ── A. imgsrv.jp 画像の総数と周辺構造 ──────────────────────
  const imgsrvImgs = $('img[src*="imgsrv.jp"][src*="/lady/"]');
  console.log(`\n=== imgsrv lady 画像 総数: ${imgsrvImgs.length} ===`);

  imgsrvImgs.slice(0, 5).each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    // 親ノード chain
    const p1 = $(el).parent();
    const p2 = p1.parent();
    const p3 = p2.parent();
    const p1tag = p1[0]?.tagName || '';
    const p2tag = p2[0]?.tagName || '';
    const p3tag = p3[0]?.tagName || '';
    const p1cls = (p1.attr('class') || '').slice(0, 40);
    const p2cls = (p2.attr('class') || '').slice(0, 40);
    const p3cls = (p3.attr('class') || '').slice(0, 40);
    const p3text = p3.text().replace(/\s+/g, ' ').trim().slice(0, 100);
    console.log(`[${i}]`);
    console.log(`  src="${src.slice(0, 70)}" alt="${alt.slice(0, 40)}"`);
    console.log(`  親: ${p1tag}.${p1cls} > ${p2tag}.${p2cls} > ${p3tag}.${p3cls}`);
    console.log(`  p3text: "${p3text}"`);
  });

  // ── B. /lady/ID/ リンクの親構造 ──────────────────────────────
  const ladyLinks = $('a[href*="/lady/"]').filter((_, el) => /\/lady\/\d+\/?$/.test($(el).attr('href') || ''));
  console.log(`\n=== /lady/ID/ リンク 総数: ${ladyLinks.length} ===`);

  ladyLinks.slice(0, 5).each((i, el) => {
    const href = $(el).attr('href') || '';
    const p1 = $(el).parent();
    const p2 = p1.parent();
    const p1tag = p1[0]?.tagName || '';
    const p2tag = p2[0]?.tagName || '';
    const p1cls = (p1.attr('class') || '').slice(0, 40);
    const p2cls = (p2.attr('class') || '').slice(0, 40);
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 60);
    const hasImg = $(el).find('img').length > 0;
    console.log(`[${i}] href="${href}" hasImg=${hasImg}`);
    console.log(`  ${p1tag}.${p1cls} > ${p2tag}.${p2cls}`);
    console.log(`  text="${text}"`);
  });

  // ── C. 【川崎】テキストを含む要素の親タグ ────────────────────
  console.log('\n=== 【川崎】を含む要素 ===');
  let kawCount = 0;
  $('*').each((_, el) => {
    const text = $(el).children().length === 0 ? $(el).text().trim() : '';
    if (text.includes('【川崎】') || text.includes('【川崎店】')) {
      const tagName = el.tagName;
      const cls = ($(el).attr('class') || '').slice(0, 40);
      kawCount++;
      if (kawCount <= 8) console.log(`  <${tagName} class="${cls}"> "${text.slice(0, 80)}"`);
    }
  });
  console.log(`  合計: ${kawCount}件`);

  // ── D. div:has(imgsrv img) の構造 ────────────────────────────
  console.log('\n=== div:has(imgsrv-lady-img) 先頭5 ===');
  $('div:has(img[src*="imgsrv.jp"][src*="/lady/"])').slice(0, 5).each((i, el) => {
    const cls = ($(el).attr('class') || '').slice(0, 50);
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
    const imgs = $(el).find('img[src*="imgsrv"][src*="/lady/"]').length;
    console.log(`[${i}] div.${cls} imgs=${imgs} text="${text}"`);
  });

  // ── E. 個別 lady ページ (非キャンペーン) で名前確認 ──────────
  // lady/5980/ はキャンペーンだったので、別のIDを試す
  console.log('\n=== 別のladyページで名前確認 ===');
  // リンクから最初の数件を試す（5980以外）
  const ids = [];
  ladyLinks.each((_, el) => {
    const m = ($(el).attr('href') || '').match(/\/lady\/(\d+)/);
    if (m && m[1] !== '5980') ids.push(m[1]);
  });
  const testId = ids[0] || '10419';
  console.log(`テストID: ${testId}`);
  await new Promise(r => setTimeout(r, 500));
  const pRes = await fetch(`${SITE}/lady/${testId}/`, { headers: ua });
  const p$ = cheerio.load(await pRes.text());
  console.log(`HTTP: ${pRes.status}`);
  console.log(`title: "${p$('title').text().trim().slice(0, 80)}"`);
  p$('h1,h2,h3').each((i, el) => {
    const t = p$(el).text().trim().slice(0, 60);
    if (t) console.log(`  ${el.tagName}: "${t}"`);
  });
  // img alt
  p$('img[src*="imgsrv"][src*="/lady/"]').slice(0, 3).each((i, el) => {
    console.log(`  img alt="${(p$(el).attr('alt') || '').slice(0, 40)}" src="${(p$(el).attr('src') || '').slice(0, 60)}"`);
  });
  // .name 系
  p$('[class*="name"],[class*="cast"]').each((i, el) => {
    const cls = (p$(el).attr('class') || '').slice(0, 40);
    const t = p$(el).text().replace(/\s+/g, ' ').trim().slice(0, 60);
    if (t && !t.includes('店') && i < 6) console.log(`  .${cls}: "${t}"`);
  });
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
