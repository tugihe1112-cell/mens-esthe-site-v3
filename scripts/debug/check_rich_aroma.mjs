import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

async function check(name, url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
  if (!res.ok) { console.log(`❌ ${name}: HTTP ${res.status}`); return; }
  const html = await res.text();
  const $ = cheerio.load(html);

  const is3days = html.includes('3days') || html.includes('s3-ap-northeast-1.amazonaws.com');
  const items = $('.item.clearfix').length;

  console.log(`\n=== ${name} ===`);
  console.log(`  URL: ${url}`);
  console.log(`  3days: ${is3days}, .item.clearfix: ${items}`);

  if (items > 0) {
    $('.item.clearfix').slice(0, 3).each((i, el) => {
      const text = $(el).text().trim().replace(/\s+/g,' ').slice(0, 60);
      const imgSrc = $(el).find('img[src*="s3"],img[src*="amazonaws"]').first().attr('src') || $(el).find('img').first().attr('src') || '';
      const nameMatch = text.match(/([ぁ-んァ-ヾ一-龯々]{1,10})\s*[（(](\d{2,3})歳?[)）]/);
      console.log(`  card${i+1}: "${text}" → name: ${nameMatch?.[1] || 'なし'}, img: ${imgSrc.slice(40,80)}`);
    });
  } else {
    // 画像パターン確認
    $('img').slice(0, 5).each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      if (src && !src.includes('assets') && !src.includes('icon')) {
        console.log(`  img: alt=[${alt}] src=${src.slice(0, 70)}`);
      }
    });
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 0名だった愛知の店舗を確認
await check('RICH AROMA', 'https://www.richaroma.nagoya/therapist/');
await sleep(400);
await check('Tororich /staff/', 'https://www.tororich.net/staff/');
await sleep(400);
await check('Aromana /staff/', 'https://aromana-sakae.com/staff/');
await sleep(400);
await check('century /staff/', 'https://century-nagoya.com/staff/');
await sleep(400);
await check('ENCORE トップ', 'https://encore-nagoya.com/');
await sleep(400);
await check('Marigold トップ', 'https://mari-gold.biz/');
await sleep(400);
await check('milk repos /staff/', 'https://milkrepos.com/staff/');
