/**
 * /gals/ ページの実際のimg構造を確認
 * 実行: node scripts/debug/check_gals_page.mjs
 */
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function checkGalsPage(name, url) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${name}】 ${url}`);
  console.log('='.repeat(60));

  const html = await (await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(15000),
  })).text();

  const $ = cheerio.load(html);

  // src / data-src / data-lazy それぞれで wcms/gals を確認
  for (const attr of ['src', 'data-src', 'data-lazy', 'data-original', 'data-img']) {
    const count = $(`img[${attr}*="/wcms/gals/"]`).length;
    if (count > 0) {
      console.log(`\nimg[${attr}*="/wcms/gals/"] = ${count}件`);
      $(`img[${attr}*="/wcms/gals/"]`).slice(0, 5).each((_, el) => {
        const val = $(el).attr(attr) || '';
        const alt = $(el).attr('alt') || '';
        console.log(`  alt="${alt}" ${attr}="${val.slice(-60)}"`);
      });
    }
  }

  // 全imgタグのsrc/data-src 先頭20件
  console.log('\n全imgタグ (先頭20件):');
  $('img').slice(0, 20).each((i, el) => {
    const src = $(el).attr('src') || '';
    const dataSrc = $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    console.log(`  [${i}] alt="${alt.slice(0,20)}" src="${src.slice(-50)}" data-src="${dataSrc.slice(-50)}"`);
  });

  // /wcms/gals/ を含む raw テキストの行を抽出
  const rawMatches = html.match(/[^\n]*\/wcms\/gals\/images\/[^\n]*/g) || [];
  console.log(`\nraw テキスト内の /wcms/gals/ 行数: ${rawMatches.length}`);
  rawMatches.slice(0, 5).forEach(l => console.log(`  ${l.trim().slice(0, 120)}`));

  // /list/profile や /gals/profile リンクの実際の uid
  const uidLinks = [];
  $('a[href*="profile"]').each((_, el) => {
    uidLinks.push($(el).attr('href'));
  });
  console.log(`\nprofileリンク数: ${uidLinks.length}件`);
  uidLinks.slice(0, 5).forEach(l => console.log(`  ${l}`));
}

await checkGalsPage('ミセスの子守唄', 'https://mrs-komoriuta.com/gals/');
await checkGalsPage('ミセスムーンR 大阪', 'https://www.moonr.jp/gals/');
await checkGalsPage('ミセスムーンR 兵庫', 'https://moor-kobe.jp/gals/');

console.log('\n完了');
