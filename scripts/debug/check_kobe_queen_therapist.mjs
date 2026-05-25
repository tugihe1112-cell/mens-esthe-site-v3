import * as cheerio from 'cheerio';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const res = await fetch('https://kobe-queen.net/therapist.html', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

// img一覧
console.log('=== img一覧 (先頭30件) ===');
let count = 0;
$('img').each((_, el) => {
  if (count++ >= 30) return;
  const src = $(el).attr('src') || $(el).attr('data-src') || '';
  const alt = $(el).attr('alt') || '';
  console.log(`  [${alt}] ${src}`);
});

// 名前+画像のブロック構造を探す
console.log('\n=== リスト/グリッド構造 ===');
['ul li', 'ol li', 'div.cast', 'div[class*="cast"]', 'div[class*="girl"]', 'div[class*="staff"]', 'div[class*="member"]', 'article'].forEach(sel => {
  const n = $(sel).length;
  if (n > 0) console.log(`  ${sel}: ${n}件`);
});
