import * as cheerio from 'cheerio';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const BASE = 'http://queenskyoto.com';
const res = await fetch(BASE, { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

console.log('=== キャスト関連リンク ===');
$('a[href]').each((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim();
  if (/cast|girl|lady|staff|セラピスト|在籍|member|photo|gallery/i.test(href + text)) {
    console.log(`  [${text}] ${href}`);
  }
});

console.log('\n=== ナビ全リンク ===');
$('nav a, header a, .nav a, #nav a, .menu a, #menu a').each((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim();
  if (text) console.log(`  [${text}] ${href}`);
});

console.log('\n=== img一覧 (先頭15件) ===');
$('img').slice(0, 15).each((_, el) => {
  console.log(`  [${$(el).attr('alt')}] ${$(el).attr('src')}`);
});

console.log('\n=== CMS ===');
['caskan','3days','men-es.jp','wp-content','wcms'].forEach(k => {
  if (html.includes(k)) console.log(`  ${k}: YES`);
});

console.log('\n=== og:image ===');
console.log($('meta[property="og:image"]').attr('content'));
