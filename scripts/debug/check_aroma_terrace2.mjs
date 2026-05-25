import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const BASE = 'https://aroma-terrace.men-este.com';

// トップページ og:image
const top = await fetch(BASE, { headers: ua, signal: AbortSignal.timeout(12000) });
const topHtml = await top.text();
const $t = cheerio.load(topHtml);
console.log(`og:image: ${$t('meta[property="og:image"]').attr('content') || '(なし)'}`);
console.log(`logo候補: ${$t('img[src*="logo"]').first().attr('src') || '(なし)'}`);
console.log(`最初のimg: ${$t('img').first().attr('src') || '(なし)'}`);

// /therapist.html 構造確認
console.log('\n=== /therapist.html ===');
const res = await fetch(`${BASE}/therapist.html`, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

console.log(`.item.clearfix: ${$('.item.clearfix').length}`);
console.log(`images_staff img: ${$('img[src*="images_staff"]').length}`);
console.log(`img[src*="cast"]: ${$('img[src*="cast"]').length}`);
console.log(`img[src*="therapist"]: ${$('img[src*="therapist"]').length}`);
console.log(`img[src*="staff"]: ${$('img[src*="staff"]').length}`);
console.log(`img[src*="photo"]: ${$('img[src*="photo"]').length}`);
console.log(`img[alt*="さん"]: ${$('img[alt*="さん"]').length}`);

console.log('\n全img (先頭10件):');
$('img').slice(0, 10).each((i, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  const dataSrc = $(el).attr('data-src') || '';
  console.log(`  [${i}] src=${src.slice(0, 70)} alt="${alt}" ${dataSrc ? 'data-src=' + dataSrc.slice(0, 50) : ''}`);
});

console.log('\nテキストブロック (先頭5件):');
$('li, .cast, .girl, .member, .therapist, article, .item, .card').slice(0, 5).each((i, el) => {
  const text = $(el).text().trim().replace(/\s+/g, ' ').slice(0, 100);
  if (text) console.log(`  [${i}] ${text}`);
});
