/**
 * 大阪 グループ別詳細構造調査
 * 実行: node scripts/debug/debug_osaka_groups.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function fetchHtml(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
  return await res.text();
}

// ============================================================
// 感謝 旧愛燦燦 (kansya-osaka.com) - figure:has(img) pattern
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('[感謝] kansya-osaka.com/cast/');
try {
  const html = await fetchHtml('https://kansya-osaka.com/cast/');
  const $ = cheerio.load(html);
  $('figure:has(img[src*="wp-content"])').slice(0, 5).each((i, el) => {
    const $el = $(el);
    const imgSrc = $el.find('img').first().attr('src') || '';
    const figcaption = $el.find('figcaption').text().trim();
    const parentText = $el.parent().text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`[${i}] figcaption: "${figcaption}"`);
    console.log(`     parent: "${parentText.slice(0, 100)}"`);
    console.log(`     img: ${imgSrc}`);
  });
  // figureを含む親要素のパターンも確認
  const $figs = $('figure:has(img[src*="wp-content"])');
  console.log(`figure[wp-content]: ${$figs.length}件`);
  const firstFig = $figs.first();
  console.log('figure.parent tag:', firstFig.parent()[0]?.name);
  console.log('figure.parent.parent tag:', firstFig.parent().parent()[0]?.name);
  console.log('figure.parent class:', firstFig.parent().attr('class'));
} catch(e) { console.log('ERROR:', e.message); }

// ============================================================
// スーパーハッピーガールズ (super-happy.net) - figure
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('[スーパーハッピー] super-happy.net/therapist');
try {
  const html = await fetchHtml('https://super-happy.net/therapist');
  const $ = cheerio.load(html);
  $('figure:has(img)').slice(0, 5).each((i, el) => {
    const $el = $(el);
    const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
    const figcaption = $el.find('figcaption').text().trim();
    const parentText = $el.closest('li, div, article').first().text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`[${i}] figcaption: "${figcaption}"`);
    console.log(`     parent: "${parentText.slice(0, 100)}"`);
    console.log(`     img: ${imgSrc.slice(0, 80)}`);
  });
} catch(e) { console.log('ERROR:', e.message); }

// ============================================================
// ミセスあまおう (amaou-therapi.jp) - o-pack.jp images
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('[ミセスあまおう] amaou-therapi.jp/lady.php');
try {
  const html = await fetchHtml('https://amaou-therapi.jp/lady.php');
  const $ = cheerio.load(html);
  // img.o-pack.jp を含む要素
  $('img[src*="o-pack.jp"]').slice(0, 5).each((i, el) => {
    const $el = $(el);
    const imgSrc = $el.attr('src') || '';
    const parentText = $el.closest('li, div, article, section').first().text().replace(/\s+/g, ' ').trim().slice(0, 150);
    console.log(`[${i}] img: ${imgSrc.slice(0, 80)}`);
    console.log(`     parent text: "${parentText.slice(0, 120)}"`);
  });
  console.log('\nすべての img[o-pack]: ', $('img[src*="o-pack.jp"]').length, '件');
} catch(e) { console.log('ERROR:', e.message); }

// ============================================================
// マジメSPA (majime-spa.com) - guarigione-like
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('[マジメSPA] majime-spa.com/therapist.html');
try {
  const html = await fetchHtml('https://majime-spa.com/therapist.html');
  const $ = cheerio.load(html);
  // AGE.パターンを含む要素を探す
  const candidates = [];
  $('*').each((_, el) => {
    const text = $(el).text();
    if (/AGE\.\d{2}/.test(text) && text.length < 200) {
      const tag = el.name;
      const cls = $(el).attr('class') || '';
      candidates.push(`${tag}.${cls}: "${text.replace(/\s+/g, ' ').trim().slice(0, 100)}"`);
    }
  });
  candidates.slice(0, 8).forEach((c, i) => console.log(`[${i}] ${c}`));
  // 画像URLパターン
  const imgs = html.match(/src="([^"]*(?:therapist|cast|staff|girl|lady)[^"]*)"/gi) || [];
  console.log('\n画像URL候補:');
  imgs.slice(0, 5).forEach(m => console.log('  ' + m));
} catch(e) { console.log('ERROR:', e.message); }

// ============================================================
// セレブスパ (kitashinchiceleb.com) - li.fontFigure
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('[セレブスパ] kitashinchiceleb.com/cast.html');
try {
  const html = await fetchHtml('https://kitashinchiceleb.com/cast.html');
  const $ = cheerio.load(html);
  $('li.fontFigure, figure, li:has(img)').slice(0, 8).each((i, el) => {
    const $el = $(el);
    const imgSrc = $el.find('img').first().attr('src') || '';
    const text = $el.text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`[${i}] text: "${text.slice(0, 80)}"`);
    console.log(`     img: ${imgSrc.slice(0, 80)}`);
  });
  // rank画像パターン確認
  const rankImgs = $('img[src*="rank"]');
  console.log(`rank images: ${rankImgs.length}件`);
  rankImgs.slice(0, 3).each((i, el) => {
    console.log(`  ${$(el).attr('src')}`);
  });
} catch(e) { console.log('ERROR:', e.message); }

// ============================================================
// DSP (dsp-osaka.net) - article:has(img)
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('[DSP] dsp-osaka.net/therapist_list');
try {
  const html = await fetchHtml('https://dsp-osaka.net/therapist_list');
  const $ = cheerio.load(html);
  $('article:has(img)').slice(1, 6).each((i, el) => {
    const $el = $(el);
    const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
    const text = $el.text().replace(/\s+/g, ' ').trim().slice(0, 150);
    console.log(`[${i}] text: "${text.slice(0, 100)}"`);
    console.log(`     img: ${imgSrc.slice(0, 80)}`);
  });
  // 背景画像パターン
  const bgMatches = html.match(/background(?:-image)?\s*:\s*url\(['"]?([^'"\)]+)['"]?\)/gi) || [];
  console.log(`\nbg-image候補: ${bgMatches.length}件`);
  bgMatches.slice(0, 3).forEach(m => console.log('  ' + m.slice(0, 80)));
  // data-src
  const dataSrcs = $('img[data-src]');
  console.log(`data-src画像: ${dataSrcs.length}件`);
  dataSrcs.slice(0, 3).each((i, el) => console.log(`  ${$(el).attr('data-src')}`));
} catch(e) { console.log('ERROR:', e.message); }

// ============================================================
// 隠れ家 (kakurega-iyashi.com) - p.therapist_img
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('[隠れ家] kakurega-iyashi.com/girllist');
try {
  const html = await fetchHtml('https://kakurega-iyashi.com/girllist');
  const $ = cheerio.load(html);
  $('p.therapist_img, .therapist_img').slice(0, 5).each((i, el) => {
    const $el = $(el);
    const imgSrc = $el.find('img').first().attr('src') || '';
    const imgStyle = $el.attr('style') || $el.find('img').first().attr('style') || '';
    const closestItem = $el.closest('li, div, article').first();
    const text = closestItem.text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`[${i}] text: "${text.slice(0, 100)}"`);
    console.log(`     img src: ${imgSrc}`);
    console.log(`     style: ${imgStyle.slice(0, 80)}`);
  });
  // 背景画像確認
  const bgImgs = html.match(/background(?:-image)?\s*:\s*url\(['"]?\/[^'"\)]+['"]?\)/gi) || [];
  console.log(`bg-image: ${bgImgs.length}件`);
  bgImgs.slice(0, 3).forEach(m => console.log('  ' + m.slice(0, 80)));
} catch(e) { console.log('ERROR:', e.message); }
