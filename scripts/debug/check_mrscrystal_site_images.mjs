/**
 * Mrs Crystal サイトの画像構造を詳しく調査
 * 実行: node scripts/debug/check_mrscrystal_site_images.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch('http://www.mrs-crystal.com/staff/', { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

console.log('=== さんの写真 パターン（現在使用中）===');
$('img[alt*="さんの写真"]').slice(0, 5).each((i, el) => {
  console.log(`  [${i}] alt="${$(el).attr('alt')}" | src="${$(el).attr('src')}"`);
});

console.log('\n=== 全img（先頭20件）===');
$('img').slice(0, 20).each((i, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  if (/logo|spacer|blank|icon|banner/i.test(src)) return;
  console.log(`  [${i}] alt="${alt}" | src="${src.slice(0, 80)}"`);
});

console.log('\n=== background-image の style属性 ===');
$('[style*="background"]').slice(0, 10).each((i, el) => {
  const style = $(el).attr('style') || '';
  if (style.includes('url')) {
    console.log(`  [${i}] ${style.slice(0, 100)}`);
  }
});

console.log('\n=== data-src / data-lazy / data-original ===');
$('[data-src], [data-lazy], [data-original]').slice(0, 10).each((i, el) => {
  console.log(`  [${i}] data-src="${$(el).attr('data-src')}" data-lazy="${$(el).attr('data-lazy')}"`);
});
