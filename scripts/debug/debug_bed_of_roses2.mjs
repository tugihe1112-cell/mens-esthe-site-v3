import * as cheerio from 'cheerio';

const SITE = 'https://bed-of-roses.site';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const res = await fetch(`${SITE}/therapists.html`, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}, img総数: ${$('img').length}`);

  console.log('\n=== img 先頭15 ===');
  $('img').slice(0, 15).each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    console.log(`  [${i}] src="${src.slice(0, 80)}" alt="${alt.slice(0, 40)}"`);
  });

  console.log('\n=== li/article/div:has(img) 先頭8 ===');
  $('li:has(img), article:has(img), .therapist:has(img), [class*="cast"]:has(img), [class*="member"]:has(img)').slice(0, 8).each((i, el) => {
    const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
    const alt = $(el).find('img').first().attr('alt') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
    console.log(`  [${i}] tag=${el.tagName} img="${img.slice(0,60)}" alt="${alt}" text="${text}"`);
  });

  console.log('\n=== name/cast クラス ===');
  $('[class*="name"],[class*="cast"],[class*="therapist"],[class*="member"],[class*="profile"]').slice(0, 8).each((i, el) => {
    const cls = ($(el).attr('class') || '').slice(0, 50);
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 80);
    if (text) console.log(`  cls="${cls}" text="${text}"`);
  });

  console.log('\n=== 個別リンク ===');
  $('a[href*="therapist"], a[href*="cast"]').slice(0, 8).each((_, el) => {
    console.log(`  ${$(el).attr('href')}`);
  });
}

run().catch(e => console.error('❌', e.message));
