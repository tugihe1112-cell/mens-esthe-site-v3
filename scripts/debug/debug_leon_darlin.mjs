/**
 * LEON SPA・ダーリンプレミアム 詳細構造調査
 * 実行: node scripts/debug/debug_leon_darlin.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

// ============================================================
// LEON SPA - rank_frame の親構造
// ============================================================
console.log('=== LEON SPA leonspa.net/girl ===');
{
  const res = await fetch('https://leonspa.net/girl', { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const frames = $('[class*="rank_frame"]');
  console.log(`rank_frame: ${frames.length}件`);
  frames.slice(0, 4).each((i, el) => {
    const $el = $(el);
    const img = $el.find('img').first();
    const imgSrc = img.attr('src') || img.attr('data-src') || img.attr('data-original') || '';
    const imgAlt = img.attr('alt') || '';
    const text = $el.text().replace(/\s+/g, ' ').trim();
    // 親要素
    const parent = $el.parent();
    const parentTag = parent[0]?.name;
    const parentCls = parent.attr('class') || '';
    const parentText = parent.text().replace(/\s+/g, ' ').trim().slice(0, 150);
    // 兄弟
    const nextSib = $el.next();
    const nextText = nextSib.text().replace(/\s+/g, ' ').trim().slice(0, 100);
    console.log(`[${i}] img: ${imgSrc.slice(0, 70)}, alt: "${imgAlt}"`);
    console.log(`     self text: "${text.slice(0, 80)}"`);
    console.log(`     parent<${parentTag} cls="${parentCls}">: "${parentText.slice(0, 80)}"`);
    console.log(`     next sibling: "${nextText.slice(0, 80)}"`);
  });

  // photos/*.jpg パターンを全収集
  const photoMatches = [...html.matchAll(/photos\/(\d+)\/raw_\d+\.jpg/g)];
  console.log(`\nphotos/xxx/raw_xxx.jpg: ${photoMatches.length}件`);

  // APIエンドポイントや JSON を探す
  const apiMatches = html.match(/(?:api|ajax|json|fetch|xhr)[^'"<]{0,200}/gi) || [];
  console.log(`API候補: ${apiMatches.slice(0, 3).map(m => m.slice(0, 80)).join('\n  ')}`);

  // script タグ内に名前データがあるか
  $('script').each((_, el) => {
    const scriptText = $(el).html() || '';
    if (scriptText.includes('name') || scriptText.includes('cast') || scriptText.includes('girl')) {
      const excerpt = scriptText.slice(0, 300).replace(/\s+/g, ' ');
      if (excerpt.includes('れ') || excerpt.includes('な') || excerpt.includes('か')) {
        console.log(`\nscript with Japanese: "${excerpt.slice(0, 200)}"`);
      }
    }
  });
}

// ============================================================
// ダーリンプレミアム - /wcms/gals/ の詳細
// ============================================================
console.log('\n=== ダーリンプレミアム darlin-premium.com/gals/ ===');
{
  const res = await fetch('https://darlin-premium.com/gals/', { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  // wcms/gals/images を含む画像要素の親構造
  const galImgs = $('img[src*="wcms/gals"]');
  console.log(`wcms/gals 画像: ${galImgs.length}件`);
  galImgs.slice(0, 5).each((i, el) => {
    const $img = $(el);
    const src = $img.attr('src') || '';
    const alt = $img.attr('alt') || '';
    const parent = $img.closest('li, div, article').first();
    const parentCls = parent.attr('class') || '';
    const parentTag = parent[0]?.name;
    const parentText = parent.text().replace(/\s+/g, ' ').trim().slice(0, 150);
    console.log(`  [${i}] alt="${alt}" src=${src}`);
    console.log(`       parent<${parentTag} cls="${parentCls}">: "${parentText.slice(0, 100)}"`);
  });

  // li, div で名前らしきテキストを含む要素
  console.log('\n名前を含む可能性のある要素:');
  $('li, div.gal_item, div.cast_item, div[class*="gal"]').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (/[ぁ-ん]{2,}/.test(text) && text.length < 100 && !$(el).find('li, div').length) {
      const cls = $(el).attr('class') || '';
      const tag = el.name;
      console.log(`  <${tag} cls="${cls}">: "${text.slice(0, 80)}"`);
    }
  });

  // name 系クラス
  $('[class*="name"], [class*="cast_name"], [class*="gal_name"]').slice(0, 5).each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    console.log(`  name-class[${i}]: "${text}"`);
  });
}

// ============================================================
// wife-line.com - garbled alt の原因調査
// ============================================================
console.log('\n=== 和いふらいん wife-line.com ===');
{
  const res = await fetch('https://wife-line.com/', { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  // img の alt を確認 (文字化けの原因調査)
  const galleryImgs = $('img[src*="gallery"]');
  console.log(`gallery imgs: ${galleryImgs.length}件`);
  galleryImgs.slice(0, 5).each((i, el) => {
    const $img = $(el);
    const src = $img.attr('src') || '';
    const alt = $img.attr('alt') || '';
    const parent = $img.closest('li, div.girls, div').first();
    const parentText = parent.text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`  [${i}] alt="${alt}" src=${src.slice(0, 60)}`);
    console.log(`       parent: "${parentText.slice(0, 80)}"`);
  });

  // span.gal_type の構造
  console.log('\nspan.gal_type:');
  $('span.gal_type').slice(0, 5).each((i, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, ' ').trim();
    const parent = $el.closest('li, div').first();
    const parentText = parent.text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`  [${i}]: "${text}" / parent: "${parentText.slice(0, 80)}"`);
  });
}
