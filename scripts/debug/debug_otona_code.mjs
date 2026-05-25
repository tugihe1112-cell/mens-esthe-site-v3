import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const res = await fetch('https://code4030.com/cast/', { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}, img総数: ${$('img').length}`);

  console.log('\n=== img 先頭8件 ===');
  $('img').slice(0, 8).each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    const style = $(el).attr('style') || '';
    console.log(`  [${i}] src="${src.slice(0,70)}" alt="${alt.slice(0,30)}" style="${style.slice(0,50)}"`);
  });

  console.log('\n=== li/article:has(img) 先頭5件 ===');
  $('li:has(img), article:has(img), div[class*="cast"]:has(img), div[class*="girl"]:has(img)').slice(0, 5).each((i, el) => {
    const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
    const alt = $(el).find('img').first().attr('alt') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
    console.log(`  [${i}] img="${img.slice(0,60)}" alt="${alt}"`);
    console.log(`       text="${text}"`);
  });

  console.log('\n=== CMS判定 ===');
  const html = $.html();
  ['caskan', '3days', 'men-es.jp', 's3.amazonaws'].forEach(cms => {
    if (html.includes(cms)) console.log(`  ✅ ${cms}`);
  });

  console.log('\n=== ロゴ候補 ===');
  $('img[src*="logo"], header img, .logo img').slice(0, 3).each((_, el) => {
    console.log(`  ${$(el).attr('src') || ''}`);
  });
  const bgMatches = [...html.matchAll(/background(?:-image)?\s*:\s*url\(['"]?(https?:\/\/[^'"\)]+)['"]?\)/g)];
  bgMatches.slice(0, 2).forEach(m => console.log(`  [bg] ${m[1]}`));
}
run().catch(e => console.error('❌', e.message));
