import * as cheerio from 'cheerio';

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const res = await fetch('https://kobe-queen.net/therapist.html', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

// div[class*="staff"] の最初の5件の構造を確認
console.log('=== div[class*="staff"] 先頭5件 ===');
$('div[class*="staff"]').slice(0, 5).each((i, el) => {
  const $el = $(el);
  console.log(`\n[${i}] class="${$el.attr('class')}"`);
  console.log('  HTML:', $el.html()?.slice(0, 300));
});

// data-src, data-img などの属性を確認
console.log('\n=== data-src/data-img 属性 ===');
$('[data-src],[data-img],[data-image],[data-url],[data-photo]').each((_, el) => {
  const $el = $(el);
  console.log(`  tag=${el.tagName} data-src=${$el.attr('data-src')} data-img=${$el.attr('data-img')}`);
});

// script タグ内にデータが埋め込まれているか確認
console.log('\n=== script内データ (セラピスト名を含む) ===');
$('script').each((_, el) => {
  const content = $(el).html() || '';
  if (/かよ|ののか|りず|セラピスト|therapist|cast|girl/i.test(content)) {
    console.log('スクリプト内にデータあり (先頭500文字):');
    console.log(content.slice(0, 500));
  }
});

// JSON/APIエンドポイントを探す
console.log('\n=== API/JSONリンク ===');
$('script[src]').each((_, el) => {
  const src = $(el).attr('src') || '';
  console.log(' ', src);
});

// ページ末尾のHTMLを確認
console.log('\n=== HTML末尾 (最後1000文字) ===');
console.log(html.slice(-1000));
