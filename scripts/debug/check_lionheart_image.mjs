import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch('http://lion-heart.pwchp.com/', { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

console.log('og:image:', $('meta[property="og:image"]').attr('content') ?? 'なし');
console.log('og:image:secure:', $('meta[property="og:image:secure_url"]').attr('content') ?? 'なし');
console.log('\n先頭img 8件:');
$('img').slice(0, 8).each((i, el) => {
  console.log(`  [${i}] src="${$(el).attr('src')}" alt="${$(el).attr('alt')}"`);
});
