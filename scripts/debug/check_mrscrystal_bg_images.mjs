/**
 * Mrs Crystal background-image と名前の対応を調査
 * 実行: node scripts/debug/check_mrscrystal_bg_images.mjs
 */
import * as cheerio from 'cheerio';

const BASE = 'http://www.mrs-crystal.com';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch(`${BASE}/staff/`, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

// background-image を持つ要素と、近くのalt="さんの写真"の対応を調べる
console.log('=== background-image 要素のHTML構造（先頭3件）===');
$('[style*="background-image"]').slice(0, 3).each((i, el) => {
  const style = $(el).attr('style') || '';
  const imgUrl = style.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || '';
  // 親・兄弟・子に名前があるか確認
  const parent = $(el).parent();
  const altInParent = parent.find('img[alt*="さんの写真"]').attr('alt') || '';
  const altInGrandParent = parent.parent().find('img[alt*="さんの写真"]').attr('alt') || '';
  console.log(`\n[${i}]`);
  console.log(`  background: ${imgUrl}`);
  console.log(`  親のalt: "${altInParent}"`);
  console.log(`  祖父のalt: "${altInGrandParent}"`);
  console.log(`  親タグ: <${$(el)[0].name} class="${$(el).attr('class')}">`);
  console.log(`  祖父タグ: <${parent[0]?.name} class="${parent.attr('class')}">`);
});

// 全体の件数確認
const bgCount = $('[style*="background-image"]').length;
const nameCount = $('img[alt*="さんの写真"]').length;
console.log(`\n=== 件数 ===`);
console.log(`background-image要素: ${bgCount}件`);
console.log(`さんの写真 img: ${nameCount}件`);

// 最上位の繰り返し構造を探す
console.log('\n=== 繰り返し構造の候補 ===');
const candidates = ['li', '.staff', '.cast', '.member', '.therapist', '[class*="staff"]', '[class*="cast"]', '[class*="member"]'];
for (const sel of candidates) {
  const count = $(sel).length;
  if (count > 5 && count < 200) console.log(`  ${sel}: ${count}件`);
}
