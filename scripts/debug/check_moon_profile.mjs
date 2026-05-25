import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
const BASE = 'https://moor-kobe.jp';

// /gals/ から最初の3件のUIDを取得
const listRes = await fetch(`${BASE}/gals/`, { headers: ua });
const listHtml = await listRes.text();
const $list = cheerio.load(listHtml);

const uids = new Set();
$list('a[href*="/gals/profile?uid="]').each((_, el) => {
  const m = ($list(el).attr('href') || '').match(/uid=(\d+)/);
  if (m) uids.add(m[1]);
});
const firstThree = [...uids].slice(0, 3);
console.log('確認するUID:', firstThree);

// 各プロフィールページの構造を確認
for (const uid of firstThree) {
  const url = `${BASE}/gals/profile?uid=${uid}`;
  console.log(`\n=== uid=${uid} ===`);
  const res = await fetch(url, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  // img全件
  console.log('img一覧:');
  $('img').each((_, el) => {
    console.log(`  alt="${$(el).attr('alt')}" src="${$(el).attr('src')}"`);
  });

  // テキスト含む要素
  console.log('\nh1/h2/h3:');
  $('h1,h2,h3').each((_, el) => console.log(`  ${$(el).text().trim()}`));

  // style background-image
  console.log('\nbackground-image:');
  $('[style*="background"]').each((_, el) => {
    console.log(`  ${$(el).attr('style')?.slice(0, 100)}`);
  });

  // HTML先頭2000文字
  console.log('\nHTML (先頭1500文字):');
  console.log(html.slice(0, 1500));
}
