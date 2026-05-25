import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

const shops = [
  { name: 'MRS.TENOR', base: 'https://esute-tenor.net', uid: '1190' },
  { name: 'Mrs.melty', base: 'https://melty-salon.com', uid: '1036' },
  { name: 'lemonade',  base: 'https://kobe-es.net',    uid: '1055' },
];

for (const s of shops) {
  const url = `${s.base}/gals/profile?uid=${s.uid}`;
  console.log(`\n=== ${s.name} uid=${s.uid} ===`);
  const res = await fetch(url, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('h2:', $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 3));
  console.log('img[src*=wcms]:');
  $('img[src*="wcms"]').each((_, el) => console.log(' ', $(el).attr('src')));
  console.log('img一覧 (先頭5件):');
  $('img').slice(0, 5).each((_, el) => console.log(`  alt="${$(el).attr('alt')}" src="${$(el).attr('src')}"`));
}
