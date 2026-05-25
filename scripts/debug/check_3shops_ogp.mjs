import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

const shops = [
  { name: 'MRS.TENOR', base: 'https://esute-tenor.net' },
  { name: 'Mrs.melty', base: 'https://melty-salon.com' },
  { name: 'lemonade',  base: 'https://kobe-es.net' },
];

for (const s of shops) {
  console.log(`\n=== ${s.name} ===`);
  try {
    const res = await fetch(s.base, { headers: ua, signal: AbortSignal.timeout(12000) });
    console.log(`  HTTP: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const ogImg = $('meta[property="og:image"]').attr('content');
    console.log(`  og:image: ${ogImg}`);
    // ロゴ候補
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (/logo|header/i.test(src)) console.log(`  logo候補: ${src}`);
    });
    // 全img先頭5件
    $('img').slice(0, 5).each((_, el) => {
      console.log(`  img: [${$(el).attr('alt')}] ${$(el).attr('src')}`);
    });
  } catch(e) {
    console.log(`  エラー: ${e.message}`);
  }
}
