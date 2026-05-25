import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch('https://milkrepos.com/staff.php', { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

console.log('=== images_staff 先頭15件 ===');
$('img[src*="images_staff"]').slice(0, 15).each((i, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  console.log(`  [${i}] alt="${alt}" | ${src.slice(0, 70)}`);
});
