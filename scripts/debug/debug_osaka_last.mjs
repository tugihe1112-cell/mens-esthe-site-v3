/**
 * 大阪残り店舗調査:
 * こころのゆりかご(3days) / 美魔女セラピー(WP) / 天上人PREMIUM(lazy)
 * + ダーリンプレミアム CMS の raw HTML 調査
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

// ============================================================
// こころのゆりかご - data.js の getTodayFormatDate エラー修正確認
// ============================================================
console.log('=== こころのゆりかご 3days ===');
try {
  const topHtml = await (await fetch('https://kokoronoyurikago-osaka.site/index.html', { headers: ua })).text();
  const dataJsMatch = topHtml.match(/src=["']([^"']*data\.js[^"']*)["']/);
  if (dataJsMatch) {
    const dataJsUrl = dataJsMatch[1].startsWith('http') ? dataJsMatch[1]
      : new URL(dataJsMatch[1], 'https://kokoronoyurikago-osaka.site/').href;
    console.log('data.js URL:', dataJsUrl);
    const dataJs = await (await fetch(dataJsUrl, { headers: ua })).text();
    console.log('data.js 先頭300文字:', dataJs.slice(0, 300));
    // 使われているカスタム関数を特定
    const funcs = dataJs.match(/\b([a-zA-Z][a-zA-Z0-9_]*)\s*\(/g) || [];
    const customFuncs = [...new Set(funcs)].filter(f => !['var','function','if','for','while','return','new'].includes(f.replace('(', '')));
    console.log('呼び出し関数:', customFuncs.slice(0, 10).join(', '));
  }
} catch(e) { console.log('ERROR:', e.message); }

// ============================================================
// 美魔女セラピー - hananoame.com のメインページ構造
// ============================================================
console.log('\n=== 美魔女セラピー hananoame.com ===');
try {
  const html = await (await fetch('https://hananoame.com/', { headers: ua })).text();
  const $ = cheerio.load(html);
  // 全画像のうちtherapist系を抽出
  const wpImgs = $('img[src*="wp-content/uploads"]');
  console.log(`wp-content/uploads 画像: ${wpImgs.length}件`);
  wpImgs.slice(0, 5).each((i, el) => {
    const $el = $(el);
    const src = $el.attr('src') || '';
    const alt = $el.attr('alt') || '';
    const parent = $el.closest('li, div, article').first();
    const text = parent.text().replace(/\s+/g, ' ').trim().slice(0, 100);
    console.log(`  [${i}] alt="${alt}" src=${src.slice(0, 70)}`);
    console.log(`       parent: "${text.slice(0, 80)}"`);
  });
  // /staff/ ページも再確認 - 別のセレクター
  const staffHtml = await (await fetch('https://hananoame.com/staff/', { headers: ua })).text();
  const $s = cheerio.load(staffHtml);
  // 全 li の内容を確認
  console.log('\nstaff page - 全 li:');
  $s('li').each((i, el) => {
    const $el = $s(el);
    const text = $el.text().replace(/\s+/g, ' ').trim().slice(0, 80);
    const imgs = $el.find('img').length;
    if (imgs > 0 && text) console.log(`  [${i}] imgs:${imgs} "${text}"`);
  });
  // article / div.entry-content 内の画像
  const articleImgs = $s('article img, .entry-content img, .staff-list img, main img');
  console.log(`\nstaff page main imgs: ${articleImgs.length}`);
  articleImgs.slice(0, 5).each((i, el) => {
    const src = $s(el).attr('src') || '';
    const alt = $s(el).attr('alt') || '';
    console.log(`  [${i}] alt="${alt}" src=${src.slice(0, 70)}`);
  });
} catch(e) { console.log('ERROR:', e.message); }

// ============================================================
// 天上人PREMIUM - data-src / data-lazy-src 確認
// ============================================================
console.log('\n=== 天上人PREMIUM tenjoubitopr.com/staff/ ===');
try {
  const html = await (await fetch('https://www.tenjoubitopr.com/staff/', { headers: ua })).text();
  const $ = cheerio.load(html);
  // data-src 系
  const lazyImgs = $('img[data-src], img[data-lazy], img[data-lazy-src], img[data-original]');
  console.log(`lazy imgs: ${lazyImgs.length}`);
  lazyImgs.slice(0, 5).each((i, el) => {
    const $el = $(el);
    const lazySrc = $el.attr('data-src') || $el.attr('data-lazy') || $el.attr('data-lazy-src') || $el.attr('data-original') || '';
    const alt = $el.attr('alt') || '';
    console.log(`  [${i}] lazySrc="${lazySrc.slice(0, 70)}" alt="${alt}"`);
  });
  // div.img 構造
  $('div.img').slice(0, 3).each((i, el) => {
    const $el = $(el);
    const imgs = $el.find('img');
    const text = $el.parent().text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`  div.img[${i}]: imgs=${imgs.length} parent="${text.slice(0, 80)}"`);
  });
  // 名前テキストをJSから抽出試み
  const nameMatches = html.match(/["']([ぁ-んァ-ヾ一-龯]{2,6}(?:[\s　][ぁ-んァ-ヾ一-龯]{2,6})?)\s*(\d{2}歳)?/g) || [];
  console.log(`\n名前候補 (HTML内):`, nameMatches.slice(0, 10).join(', '));
} catch(e) { console.log('ERROR:', e.message); }

// ============================================================
// ダーリンプレミアム - raw HTML で wcms/gals 周辺を調査
// ============================================================
console.log('\n=== ダーリンプレミアム darlin-premium.com/gals/ ===');
try {
  const html = await (await fetch('https://darlin-premium.com/gals/', { headers: ua })).text();
  // wcms/gals 周辺50文字を抽出
  const wcmsPositions = [];
  let pos = html.indexOf('wcms/gals');
  while (pos !== -1 && wcmsPositions.length < 5) {
    wcmsPositions.push(html.slice(Math.max(0, pos-100), pos+150));
    pos = html.indexOf('wcms/gals', pos+1);
  }
  console.log(`wcms/gals 出現: ${wcmsPositions.length}件`);
  wcmsPositions.forEach((ctx, i) => console.log(`  [${i}]: ...${ctx.replace(/\s+/g, ' ')}...`));

  // script タグ内のJSONデータ
  const $ = cheerio.load(html);
  let foundData = false;
  $('script').each((_, el) => {
    const content = $(el).html() || '';
    if (content.includes('name') && content.includes('photo') && content.length < 50000) {
      console.log(`\nscript with name+photo: ${content.slice(0, 400)}`);
      foundData = true;
    }
  });
  if (!foundData) console.log('名前データなし (JS動的ロード)');
} catch(e) { console.log('ERROR:', e.message); }
