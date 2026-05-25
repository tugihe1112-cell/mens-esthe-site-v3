/**
 * サイトの画像URL一覧確認
 * 実行: node scripts/debug/check_site_images.mjs <url>
 */
import * as cheerio from 'cheerio';

const URL_ARG = process.argv[2];
if (!URL_ARG) { console.log('使い方: node scripts/debug/check_site_images.mjs <url>'); process.exit(1); }

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
const res = await fetch(URL_ARG, { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

console.log('OGP:', $('meta[property="og:image"]').attr('content') || 'なし');
console.log('Twitter:', $('meta[name="twitter:image"]').attr('content') || 'なし');
console.log('\n画像一覧:');
$('img').each((i, el) => {
  const src = $(el).attr('src') || '';
  if (src && !/favicon/i.test(src)) console.log(`[${i}] ${src.slice(0, 100)}`);
});
