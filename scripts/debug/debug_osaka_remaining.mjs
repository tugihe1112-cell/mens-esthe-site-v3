/**
 * 大阪残り店舗 構造調査 (LEON SPA・Furyu・wife-line 系)
 * 実行: node scripts/debug/debug_osaka_remaining.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function fetchHtml(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
  return await res.text();
}

function inspect(html, baseUrl, label) {
  const $ = cheerio.load(html);
  console.log(`\n[${label}]`);

  // div.ph パターン (umihey/namihey CMS)
  const divPh = $('div.ph');
  if (divPh.length > 0) {
    console.log(`div.ph: ${divPh.length}件`);
    divPh.slice(0, 3).each((i, el) => {
      const $el = $(el);
      const img = $el.find('img').first();
      const imgSrc = img.attr('src') || img.attr('data-src') || '';
      const parent = $el.parent();
      const parentText = parent.text().replace(/\s+/g, ' ').trim().slice(0, 120);
      const sibText = $el.siblings().first().text().replace(/\s+/g, ' ').trim().slice(0, 80);
      console.log(`  [${i}] img: ${imgSrc.slice(0, 70)}`);
      console.log(`       parent text: "${parentText.slice(0, 80)}"`);
      console.log(`       sibling: "${sibText}"`);
    });
  }

  // div.rank_frame パターン (LEON SPA CMS)
  const rankFrame = $('[class*="rank_frame"]');
  if (rankFrame.length > 0) {
    console.log(`rank_frame: ${rankFrame.length}件`);
    rankFrame.slice(0, 3).each((i, el) => {
      const $el = $(el);
      const img = $el.find('img').first();
      const imgSrc = img.attr('src') || img.attr('data-src') || img.attr('data-original') || '';
      const text = $el.text().replace(/\s+/g, ' ').trim().slice(0, 120);
      console.log(`  [${i}] img: ${imgSrc.slice(0, 70)}`);
      console.log(`       text: "${text.slice(0, 80)}"`);
    });
    // data-original, data-lazy, data-src 確認
    const lazyImgs = $('img[data-original], img[data-lazy], img[data-src]');
    console.log(`  lazy imgs: ${lazyImgs.length}件`);
    lazyImgs.slice(0, 3).each((i, el) => {
      const $el = $(el);
      const src = $el.attr('data-original') || $el.attr('data-lazy') || $el.attr('data-src') || '';
      console.log(`  lazy[${i}]: ${src.slice(0, 70)}`);
    });
  }

  // div.model_image パターン (wife-line CMS)
  const modelImage = $('div.model_image');
  if (modelImage.length > 0) {
    console.log(`div.model_image: ${modelImage.length}件`);
    modelImage.slice(0, 3).each((i, el) => {
      const $el = $(el);
      const img = $el.find('img').first();
      const imgSrc = img.attr('src') || img.attr('data-src') || '';
      const bgStyle = $el.attr('style') || img.attr('style') || '';
      const parent = $el.closest('li, div.girls, div.model').first();
      const text = parent.text().replace(/\s+/g, ' ').trim().slice(0, 120);
      console.log(`  [${i}] img: ${imgSrc.slice(0, 70)}`);
      console.log(`       style: ${bgStyle.slice(0, 80)}`);
      console.log(`       text: "${text.slice(0, 80)}"`);
    });
  }

  // /user/theme/set1 CMS (darlin, queen, beauty) - img pattern
  const set1Imgs = $('img').filter((_, el) => {
    const src = $(el).attr('src') || '';
    return src.includes('upload') || src.includes('cast') || src.includes('girl') || src.includes('staff');
  });
  if (set1Imgs.length > 0) {
    console.log(`upload/cast/girl/staff img: ${set1Imgs.length}件`);
    set1Imgs.slice(0, 3).each((i, el) => {
      const $el = $(el);
      const src = $el.attr('src') || '';
      const alt = $el.attr('alt') || '';
      const parent = $el.closest('li, div, article').first();
      const text = parent.text().replace(/\s+/g, ' ').trim().slice(0, 100);
      console.log(`  [${i}] src: ${src.slice(0, 70)}, alt: "${alt}"`);
      console.log(`       parent: "${text.slice(0, 80)}"`);
    });
  }
}

// ============================================================
// LEON SPA
// ============================================================
try {
  console.log('\n' + '='.repeat(60));
  console.log('LEON SPA - /girl ページ');
  const html = await fetchHtml('https://leonspa.net/girl');
  inspect(html, 'https://leonspa.net', 'LEON SPA /girl');
  // JS内の画像URLを探す
  const jsImgs = html.match(/["'](\/(?:upload|img|images|photo|cast)[^"']+\.(?:jpg|jpeg|png|webp))["']/gi) || [];
  console.log(`JS内画像: ${jsImgs.length}件`);
  jsImgs.slice(0, 5).forEach(m => console.log(`  ${m}`));
} catch(e) { console.log('LEON SPA ERROR:', e.message); }

// ============================================================
// Furyu (umihey CMS)
// ============================================================
try {
  console.log('\n' + '='.repeat(60));
  const html = await fetchHtml('https://furyu.net/cast/');
  inspect(html, 'https://furyu.net', 'Furyu /cast/');
  // umiheyのcms画像パターン
  const umiheyImgs = html.match(/["']((?:https?:)?\/\/[^"']*(?:umihey|cast|upload)[^"']*\.(?:jpg|jpeg|png))["']/gi) || [];
  console.log(`umihey系画像: ${umiheyImgs.length}件`);
  umiheyImgs.slice(0, 5).forEach(m => console.log(`  ${m}`));
  // furyu.net独自upload
  const furyuImgs = html.match(/["'](\/upload\/[^"']+\.(?:jpg|jpeg|png))["']/gi) || [];
  console.log(`furyu upload画像: ${furyuImgs.length}件`);
  furyuImgs.slice(0, 5).forEach(m => console.log(`  ${m}`));
} catch(e) { console.log('Furyu ERROR:', e.message); }

// ============================================================
// SEACRET ROOM ひまわり (namihey CMS)
// ============================================================
try {
  console.log('\n' + '='.repeat(60));
  const html = await fetchHtml('https://sr-himawari.com/cast');
  inspect(html, 'https://sr-himawari.com', 'SR Himawari /cast');
  const himawariImgs = html.match(/["'](\/upload\/[^"']+\.(?:jpg|jpeg|png))["']/gi) || [];
  console.log(`sr-himawari upload画像: ${himawariImgs.length}件`);
  himawariImgs.slice(0, 5).forEach(m => console.log(`  ${m}`));
} catch(e) { console.log('SR Himawari ERROR:', e.message); }

// ============================================================
// ダーリンプレミアム (/user/theme/set1 CMS)
// ============================================================
try {
  console.log('\n' + '='.repeat(60));
  const html = await fetchHtml('https://darlin-premium.com/gals/');
  inspect(html, 'https://darlin-premium.com', 'ダーリンプレミアム /gals/');
  // cast/upload/girl画像
  const castImgs = html.match(/["'](\/[^"']*(?:cast|upload|girl|photo)[^"']*\.(?:jpg|jpeg|png|webp))["']/gi) || [];
  console.log(`cast画像: ${castImgs.length}件`);
  castImgs.slice(0, 5).forEach(m => console.log(`  ${m}`));
  // JS data を探す
  const jsonData = html.match(/\{[^{}]*(?:name|名前)[^{}]*\}/gi) || [];
  console.log(`JSON data候補: ${jsonData.length}件`);
  jsonData.slice(0, 2).forEach(m => console.log(`  ${m.slice(0, 100)}`));
} catch(e) { console.log('ダーリン ERROR:', e.message); }

// ============================================================
// 和いふらいん (wife-line.com)
// ============================================================
try {
  console.log('\n' + '='.repeat(60));
  const html = await fetchHtml('https://wife-line.com/');
  inspect(html, 'https://wife-line.com', '和いふらいん top');
  // gallery 画像
  const galleryImgs = html.match(/["'](\/img\/gallery\/[^"']+\.(?:jpg|jpeg|png|webp))["']/gi) || [];
  console.log(`gallery画像: ${galleryImgs.length}件`);
  galleryImgs.slice(0, 5).forEach(m => console.log(`  ${m}`));
  // girls 情報
  const $ = cheerio.load(html);
  $('div.girls').slice(0, 3).each((i, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`  girls[${i}]: "${text}"`);
  });
} catch(e) { console.log('wife-line ERROR:', e.message); }
