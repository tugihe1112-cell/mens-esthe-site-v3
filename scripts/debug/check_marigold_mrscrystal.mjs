import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

async function fetchHtml(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

// === Marigold ===
console.log('=== Marigold /girl ===');
try {
  const html = await fetchHtml('https://mari-gold.biz/girl');
  const $ = cheerio.load(html);
  console.log(`.item.clearfix: ${$('.item.clearfix').length}`);
  console.log(`images_staff img: ${$('img[src*="images_staff"]').length}`);
  console.log(`img[src*="cast"]: ${$('img[src*="cast"]').length}`);
  console.log(`img[src*="girl"]: ${$('img[src*="girl"]').length}`);
  console.log(`img[src*="staff"]: ${$('img[src*="staff"]').length}`);

  // 全imgの先頭10件
  console.log('\n全img (先頭10件):');
  $('img').slice(0, 10).each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    const dataSrc = $(el).attr('data-src') || '';
    console.log(`  [${i}] src=${src.slice(0,70)} alt="${alt}" ${dataSrc ? 'data-src='+dataSrc.slice(0,50) : ''}`);
  });

  // テキストブロック
  console.log('\nブロック (先頭5件):');
  $('li, .cast, .girl, .member, .staff, article').slice(0, 5).each((i, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ').slice(0, 100);
    if (text) console.log(`  [${i}] ${text}`);
  });

  const ogImg = $('meta[property="og:image"]').attr('content') || '';
  console.log(`\nog:image: ${ogImg || '(なし)'}`);
} catch(e) { console.log(`❌ ${e.message}`); }

console.log('\n=== Mrs Crystal /staff/ ===');
try {
  const html = await fetchHtml('http://www.mrs-crystal.com/staff/');
  const $ = cheerio.load(html);
  console.log(`.item.clearfix: ${$('.item.clearfix').length}`);
  console.log(`images_staff img: ${$('img[src*="images_staff"]').length}`);
  console.log(`img[src*="cast"]: ${$('img[src*="cast"]').length}`);
  console.log(`img[src*="staff"]: ${$('img[src*="staff"]').length}`);
  console.log(`img[src*="girl"]: ${$('img[src*="girl"]').length}`);

  console.log('\n全img (先頭10件):');
  $('img').slice(0, 10).each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    const dataSrc = $(el).attr('data-src') || '';
    console.log(`  [${i}] src=${src.slice(0,70)} alt="${alt}" ${dataSrc ? 'data-src='+dataSrc.slice(0,50) : ''}`);
  });

  console.log('\nブロック (先頭5件):');
  $('li, .cast, .girl, .member, .staff, article, div.item').slice(0, 5).each((i, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ').slice(0, 100);
    if (text) console.log(`  [${i}] ${text}`);
  });

  const ogImg = $('meta[property="og:image"]').attr('content') || '';
  console.log(`\nog:image: ${ogImg || '(なし)'}`);
} catch(e) { console.log(`❌ ${e.message}`); }
