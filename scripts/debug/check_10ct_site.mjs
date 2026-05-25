import * as cheerio from 'cheerio';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const res = await fetch('https://10ct-resort.com/', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

// キャスト系リンクを探す
console.log('=== キャスト関連リンク ===');
$('a[href]').each((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim();
  if (/cast|girl|lady|staff|セラピスト|在籍|member|photo|girl/i.test(href + text)) {
    console.log(`  [${text}] ${href}`);
  }
});

// 全ナビリンク
console.log('\n=== ナビゲーションリンク ===');
$('nav a, header a, .nav a, .menu a, #menu a, .gnav a').each((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim();
  if (text) console.log(`  [${text}] ${href}`);
});

// img alt一覧
console.log('\n=== img alt一覧 (先頭20件) ===');
let count = 0;
$('img').each((_, el) => {
  if (count++ > 20) return;
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  console.log(`  [${alt}] ${src.slice(0, 80)}`);
});

// CMS検出
console.log('\n=== CMS ===');
console.log('caskan:', html.includes('caskan'));
console.log('3days:', html.includes('3days'));
console.log('men-es:', html.includes('men-es.jp'));
console.log('wp-content:', html.includes('wp-content'));
console.log('wcms:', html.includes('wcms'));
