/**
 * doigt de fee /lady/ 詳細構造確認
 * 実行: node scripts/debug/debug_doigt_detail.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const res = await fetch('https://exe-fee.com/lady/', { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  // 名前候補要素を探す
  console.log('\n=== 名前候補クラス ===');
  $('[class*="name"],[class*="cast"],[class*="lady"],[class*="girl"],[class*="staff"]').slice(0,6).each((i, el) => {
    const cls = $(el).attr('class') || '';
    const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,60);
    if (text) console.log(`  cls="${cls.slice(0,40)}" "${text}"`);
  });

  // li/article 構造
  console.log('\n=== li/article 内のimg+テキスト ===');
  $('li:has(img), article:has(img)').slice(0,4).each((i, el) => {
    const img = $(el).find('img').first().attr('src') || '';
    const text = $(el).text().replace(/\s+/g,' ').trim().slice(0,80);
    console.log(`  [${i}] img="${img.slice(0,60)}" text="${text}"`);
  });

  // imgsrv.jp 画像とその兄弟テキスト
  console.log('\n=== imgsrv img の親構造 ===');
  $('img[src*="imgsrv.jp"]').slice(0,4).each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    const parent = $(el).parent();
    const parentText = parent.text().replace(/\s+/g,' ').trim().slice(0,80);
    const grandText = parent.parent().text().replace(/\s+/g,' ').trim().slice(0,80);
    console.log(`  [${i}] src="${src.slice(0,60)}" alt="${alt.slice(0,30)}"`);
    console.log(`       parent="${parentText}"`);
    console.log(`       grand="${grandText}"`);
  });

  // 個別 lady ページ(/lady/10419/)のリンク一覧
  console.log('\n=== /lady/ID/ リンク ===');
  const ladyLinks = new Set();
  $('a[href*="/lady/"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (/\/lady\/\d+\/?$/.test(href)) ladyLinks.add(href);
  });
  const links = [...ladyLinks].slice(0,5);
  links.forEach(l => console.log(`  ${l}`));
  console.log(`  合計: ${ladyLinks.size}件`);

  // ロゴ候補
  console.log('\n=== ロゴ候補 ===');
  $('img[src*="logo"], header img, .logo img').slice(0,3).each((i, el) => {
    const src = $(el).attr('src') || '';
    console.log(`  ${src.slice(0,90)}`);
  });
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
