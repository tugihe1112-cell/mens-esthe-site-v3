/**
 * DEEP ESSENTIAL / ラビットスパ スケジュールURL・ロゴ確認
 * 実行: node scripts/debug/debug_kanagawa_schedule_logo.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

async function check(label, url) {
  try {
    const res = await fetch(url, { headers: ua });
    const ogImage = cheerio.load(await res.text())('meta[property="og:image"]').attr('content') || '';
    console.log(`${label}: ${res.status} ${ogImage ? '| OGP: ' + ogImage.slice(0,80) : ''}`);
  } catch(e) { console.log(`${label}: ❌ ${e.message}`); }
}

(async () => {
  console.log('=== DEEP ESSENTIAL ===');
  await check('TOP OGP',          'https://deep-e.com/');
  await check('/web/schedule',    'https://deep-e.com/web/schedule');
  await check('/schedule',        'https://deep-e.com/schedule');

  console.log('\n=== ラビットスパ ===');
  await check('TOP OGP',          'https://rabbit-spa.net/');
  await check('/schedule',        'https://rabbit-spa.net/schedule');
  await check('/calendar',        'https://rabbit-spa.net/calendar');
})();
