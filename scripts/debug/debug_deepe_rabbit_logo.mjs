/**
 * DEEP ESSENTIAL スケジュールURL追加確認 + ロゴ探索
 * 実行: node scripts/debug/debug_deepe_rabbit_logo.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

async function check(label, url) {
  try {
    const res = await fetch(url, { headers: ua });
    const $ = cheerio.load(await res.text());
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    console.log(`${label}: HTTP ${res.status} | title="${ogTitle.slice(0,50)}" ${ogImage ? '| OGP: ' + ogImage.slice(0,80) : ''}`);
  } catch(e) { console.log(`${label}: ❌ ${e.message}`); }
}

async function findLogo(label, url) {
  try {
    const res = await fetch(url, { headers: ua });
    const $ = cheerio.load(await res.text());
    console.log(`\n=== ${label} ロゴ探索 ===`);
    // ロゴ候補
    $('img').each((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      const cls = $(el).attr('class') || '';
      if (/logo|Logo/i.test(src + alt + cls)) {
        console.log(`  logo: src="${src.slice(0,100)}" alt="${alt.slice(0,40)}"`);
      }
    });
    // OGP
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    if (ogImage) console.log(`  OGP image: ${ogImage.slice(0,100)}`);
    // header内のimg
    console.log('  header imgs:');
    $('header img, #header img, .header img, .site-header img').each((i, el) => {
      const src = $(el).attr('src') || '';
      if (src) console.log(`    ${src.slice(0,100)}`);
    });
  } catch(e) { console.log(`${label}: ❌ ${e.message}`); }
}

(async () => {
  console.log('=== DEEP ESSENTIAL スケジュールURL候補 ===');
  await check('/web/suke',        'https://deep-e.com/web/suke');
  await check('/web/schedule_list','https://deep-e.com/web/schedule_list');
  await check('/web/today',       'https://deep-e.com/web/today');
  await check('/web/',            'https://deep-e.com/web/');
  await check('TOP /a/',          'https://deep-e.com/a/');
  await check('TOP /kawasaki_a/', 'https://deep-e.com/kawasaki_a/');

  await findLogo('DEEP ESSENTIAL', 'https://deep-e.com/');
  await findLogo('ラビットスパ',   'https://rabbit-spa.net/');
})();
