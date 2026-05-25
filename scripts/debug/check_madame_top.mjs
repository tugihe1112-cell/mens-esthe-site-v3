import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

// /top を取得してリンクを確認
const res = await fetch('https://madame-seiko.com/top', { headers: ua, signal: AbortSignal.timeout(10000) });
const html = await res.text();
const $ = cheerio.load(html);

console.log('=== /top のリンク ===');
$('a[href]').each((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim().slice(0, 40);
  if (href && !href.startsWith('#') && !href.startsWith('mailto') && !href.startsWith('tel')) {
    console.log(`  [${text}] → ${href}`);
  }
});

// qzin URL確認
console.log('\n=== qzin URL確認 ===');
const qzin = 'https://tokai.qzin.jp/madame759/?v=official';
const r2 = await fetch(qzin, { headers: ua, method: 'HEAD', signal: AbortSignal.timeout(5000) });
console.log(`  ${r2.ok ? '✅' : '❌'} ${r2.status} ${qzin}`);
