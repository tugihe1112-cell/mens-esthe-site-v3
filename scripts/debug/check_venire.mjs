import * as cheerio from 'cheerio';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const res = await fetch('https://venire-aroma.com/therapist/', { headers: ua });
const html = await res.text();
const $ = cheerio.load(html);

// セレクタ確認
console.log('.item.clearfix 数:', $('.item.clearfix').length);
console.log('.item 数:', $('.item').length);
console.log('.item.clearfix.fadein 数:', $('.item.clearfix.fadein').length);

// 最初の3カードのp/spanテキスト詳細
$('.item.clearfix').slice(0, 4).each((i, el) => {
  console.log(`\n--- card ${i+1} ---`);
  console.log('全テキスト:', $(el).text().trim().replace(/\s+/g, ' ').slice(0, 80));
  $(el).find('p, span').each((_, pe) => {
    const t = $(pe).text().trim();
    if (t) console.log(`  [${$(pe).get(0).tagName}] "${t}"`);
  });
  // 日本語名+年齢パターンを直接検索
  const fullText = $(el).text().trim().replace(/\s+/g, ' ');
  const m1 = fullText.match(/([ぁ-んァ-ヾ一-龯々]{1,10})\s*[（(](\d{2,3})[)）]/);
  console.log('  名前マッチ:', m1 ? `"${m1[1]}" (${m1[2]}歳)` : 'なし');
  // S3 img
  const s3 = $(el).find('img[src*="s3"]').first().attr('src') || '';
  console.log('  S3 img:', s3.slice(0, 60));
});
