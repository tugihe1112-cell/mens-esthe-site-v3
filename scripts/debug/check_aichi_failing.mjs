/**
 * 自動処理で0名になった店舗の構造確認
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function checkSite(name, baseUrl, therapistPath) {
  const url = therapistPath ? `${baseUrl}${therapistPath}` : baseUrl;
  try {
    const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.log(`❌ ${name}: HTTP ${res.status} (${url})`); return; }
    const html = await res.text();
    const $ = cheerio.load(html);

    // CMS判定
    const cms = html.includes('caskan') ? 'caskan' : html.includes('3days') ? '3days' : html.includes('wp-content') ? 'wordpress' : 'generic';

    // img統計
    const imgs = $('img').map((_,el) => ({ alt: $(el).attr('alt'), src: $(el).attr('src') || $(el).attr('data-src') })).get();
    const meaningfulImgs = imgs.filter(i => i.src && !i.src.includes('icon') && !i.src.includes('logo') && !i.src.includes('banner'));

    console.log(`\n=== ${name} [${cms}] ===`);
    console.log(`  URL: ${url}`);
    console.log(`  img総数: ${imgs.length}, 候補: ${meaningfulImgs.length}`);
    meaningfulImgs.slice(0, 5).forEach(i => console.log(`    [${i.alt?.slice(0,20)}] ${i.src?.slice(0,80)}`));

    // caskan
    if (html.includes('caskan')) {
      const castItems = $('li:has(img[src*="caskan"])').length;
      const castImgs = $('img[src*="caskan"]').length;
      console.log(`  caskan li: ${castItems}, img: ${castImgs}`);
      $('img[src*="caskan"]').slice(0,3).each((_,el) => {
        const $li = $(el).closest('li');
        console.log(`    alt=${$(el).attr('alt')}, name=${$li.find('.name,.cast-name,h3,h4').first().text().trim().slice(0,20)}`);
      });
    }

    // 3days
    if (html.includes('3days')) {
      const items = $('[class*="therapist"],[class*="cast"],[class*="staff"],[class*="girl"]').length;
      console.log(`  3days系クラス要素: ${items}`);
      // アセット確認
      const assetImg = $('img[src*="assets"]').first();
      if (assetImg.length) console.log(`  assets img例: ${assetImg.attr('src')?.slice(0,80)}`);
    }

    // WordPress
    if (html.includes('wp-content')) {
      const wpImgs = $('img[src*="wp-content/uploads"]').length;
      console.log(`  wp-content/uploads img: ${wpImgs}`);
      $('img[src*="wp-content/uploads"]').slice(0,3).each((_,el) => console.log(`    alt=[${$(el).attr('alt')}] src=${$(el).attr('src')?.slice(0,70)}`));
    }

  } catch(e) { console.log(`❌ ${name}: ${e.message?.slice(0,60)}`); }
  await sleep(500);
}

// 自動処理で0名だった店舗
await checkSite('メンズエステ一宮', 'https://esthe-ichinomiya.com', '/cast/');
await checkSite('Number9', 'https://nagoya-number9.com', '/cast/');
await checkSite('Galaxy-NAGOYA', 'https://galaxy-nagoya.com', '/cast/');
await checkSite('milk repos', 'https://milkrepos.com', '/staff/');
await checkSite('Tororich', 'https://www.tororich.net', '/staff/');
await checkSite('Aromana', 'https://aromana-sakae.com', '/staff/');
await checkSite('CAMPBELL', 'https://vip-campbell.nagoya', '/member/');
await checkSite('Cucue', 'https://cucue.jp', '/therapist/');
await checkSite('M Spa', 'https://m-spa.net', '/cast/');
await checkSite('RICH AROMA', 'https://www.richaroma.nagoya', '/therapist/');
await checkSite('Spur Luxury', 'https://spurluxury.com', '/therapist/');
await checkSite('MADAME聖子', 'https://madame-seiko.com', '/');
await checkSite('VENIRE', 'https://venire-aroma.com', '/therapist/');
await checkSite('century', 'https://century-nagoya.com', '/staff/');
await checkSite('ENCORE', 'https://encore-nagoya.com', '/staff/');
await checkSite('GOLDEN ROSE', 'https://golden-rose.jp', '/staff/');
await checkSite('Marigold', 'https://mari-gold.biz', '/girl/');
await checkSite('ゆりかご名古屋', 'https://www.yurikago-nagoya.com', '/therapist/');
