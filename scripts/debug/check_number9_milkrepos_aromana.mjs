import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

async function checkPage(label, url, base) {
  console.log(`\n=== ${label} ===`);
  try {
    const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log(`.item.clearfix: ${$('.item.clearfix').length}`);
    console.log(`images_staff img: ${$('img[src*="images_staff"]').length}`);
    console.log(`img[src*="cast"]: ${$('img[src*="cast"]').length}`);
    console.log(`img[src*="staff"]: ${$('img[src*="staff"]').length}`);
    console.log(`img[src*="photo"]: ${$('img[src*="photo"]').length}`);
    console.log(`img[alt*="さん"]: ${$('img[alt*="さん"]').length}`);

    console.log('\n全img (先頭8件):');
    $('img').slice(0, 8).each((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      const dataSrc = $(el).attr('data-src') || '';
      console.log(`  [${i}] src=${src.slice(0, 70)} alt="${alt.slice(0, 30)}" ${dataSrc ? 'data-src=' + dataSrc.slice(0, 50) : ''}`);
    });

    console.log('\nテキストブロック (先頭5件):');
    $('li, .cast, .girl, .member, .therapist, article, .item, .card, .staff').slice(0, 5).each((i, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ').slice(0, 100);
      if (text) console.log(`  [${i}] ${text}`);
    });

    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    console.log(`og:image: ${ogImg || '(なし)'}`);
  } catch(e) { console.log(`❌ ${e.message}`); }
}

await checkPage('Number9 /cast_list/', 'https://nagoya-number9.com/cast_list/', 'https://nagoya-number9.com');
await checkPage('milk repos /staff.php', 'https://milkrepos.com/staff.php', 'https://milkrepos.com');
await checkPage('Aromana /staff.php', 'https://aromana-sakae.com/staff.php', 'https://aromana-sakae.com');
