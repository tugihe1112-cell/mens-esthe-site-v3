import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const BASE = 'https://golden-rose.jp';
const res = await fetch(BASE, { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);
console.log('og:image:', $('meta[property="og:image"]').attr('content'));
console.log('og:image:secure:', $('meta[property="og:image:secure_url"]').attr('content'));
// ロゴっぽい画像
$('img').each((_,el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  if (/logo|Logo|LOGO|header|brand/i.test(src+alt)) console.log(`logo候補: alt=[${alt}] src=${src}`);
});
// 全imgの先頭
$('img').slice(0,8).each((_,el) => console.log(`  [${$(el).attr('alt')}] ${$(el).attr('src')}`));
