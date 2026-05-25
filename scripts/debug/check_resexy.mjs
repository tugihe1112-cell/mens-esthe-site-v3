/**
 * RESEXY 構造確認
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const BASE = 'https://resexy.info';

// /staff.php 構造
console.log('=== /staff.php ===');
const res = await fetch(`${BASE}/staff.php`, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

// よくあるパターンを全部確認
console.log(`.item.clearfix: ${$('.item.clearfix').length}`);
console.log(`images_staff img: ${$('img[src*="images_staff"]').length}`);
console.log(`img[src*="staff"]: ${$('img[src*="staff"]').length}`);
console.log(`img[src*="cast"]: ${$('img[src*="cast"]').length}`);
console.log(`img[src*="girl"]: ${$('img[src*="girl"]').length}`);

// 全imgタグ（最初の10件）
console.log('\n全img (先頭10件):');
$('img').slice(0, 10).each((i, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  const dataSrc = $(el).attr('data-src') || '';
  console.log(`  [${i}] src=${src.slice(0, 70)} alt="${alt}" ${dataSrc ? 'data-src=' + dataSrc.slice(0,50) : ''}`);
});

// テキスト付きリンクブロック（名前候補）
console.log('\nテキストブロック (先頭5件):');
$('.item, .staff-item, .cast-item, li.clearfix, div.clearfix').slice(0, 5).each((i, el) => {
  const text = $(el).text().trim().replace(/\s+/g, ' ').slice(0, 100);
  console.log(`  [${i}] ${text}`);
});

// og:image
const ogImg = $('meta[property="og:image"]').attr('content') || '';
console.log(`\nog:image: ${ogImg || '(なし)'}`);
