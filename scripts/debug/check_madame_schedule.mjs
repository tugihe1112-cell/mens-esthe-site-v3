import * as cheerio from 'cheerio';
const BASE = 'https://madame-seiko.com/';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch(BASE, { headers: ua, signal: AbortSignal.timeout(10000) });
const html = await res.text();
const $ = cheerio.load(html);

// 全リンクをスキャン
console.log('=== 全リンク ===');
$('a[href]').each((_, el) => {
  const href = $(el).attr('href') || '';
  const text = $(el).text().trim().slice(0, 30);
  if (href && !href.startsWith('#') && !href.startsWith('mailto') && !href.startsWith('tel')) {
    console.log(`  [${text}] → ${href}`);
  }
});

// schedule候補パスを直接試す
const paths = ['/schedule/', '/schedule.php', '/timetable/', '/attendance/', '/shift/', '/cast/', '/girls/', '/staff/', '/shukkin/', '/shukkin.php', '/working/'];
console.log('\n=== パス試行 ===');
for (const p of paths) {
  const url = new URL(p, BASE).href;
  try {
    const r = await fetch(url, { headers: ua, method: 'HEAD', signal: AbortSignal.timeout(5000) });
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.status} ${url}`);
  } catch (e) {
    console.log(`  ⚠️ error ${url}`);
  }
}
