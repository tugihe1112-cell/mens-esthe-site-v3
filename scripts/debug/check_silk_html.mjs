/**
 * men-esthe.jp Silk (salonId=9416) の口コミHTML構造確認
 * 実行: node scripts/debug/check_silk_html.mjs
 */
import * as cheerio from 'cheerio';

const url = 'https://men-esthe.jp/salon.php?id=9416';
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ja' },
  signal: AbortSignal.timeout(15000),
});
const html = await res.text();
const $ = cheerio.load(html);

// 口コミブロックを探す
const candidates = $('li[id^="kid-"], li a[name^="kid-"]').closest('li');
console.log(`口コミ候補ブロック数: ${candidates.length}`);

candidates.each((i, el) => {
  if (i > 1) return; // 最初の2件だけ確認

  console.log(`\n===== ブロック ${i + 1} =====`);

  // プレミアム判定
  const isPremium = $(el).find('img[src*="premosaic"], img[src*="mosaic"]').length > 0
    || $(el).text().includes('プレミアム口コミ');
  console.log(`プレミアム: ${isPremium}`);
  if (isPremium) return;

  // h3
  const h3 = $(el).find('h3').first().text().trim();
  console.log(`h3: ${h3}`);

  // p タグ一覧
  const pTags = $(el).find('p');
  console.log(`p タグ数: ${pTags.length}`);
  pTags.each((j, p) => {
    const text = $(p).text().trim().slice(0, 100);
    console.log(`  p[${j}]: ${text}`);
  });

  // .kuchikomi-content
  const kcontent = $(el).find('.kuchikomi-content');
  console.log(`.kuchikomi-content 数: ${kcontent.length}`);
  if (kcontent.length) {
    console.log(`  text: ${kcontent.text().trim().slice(0, 100)}`);
  }

  // 全テキスト（ノイズ込み）
  const allText = $(el).clone()
    .find('h3, .star, a, img, script').remove().end()
    .text().replace(/\s+/g, ' ').trim();
  console.log(`全テキスト(200文字): ${allText.slice(0, 200)}`);
  console.log(`全テキスト長: ${allText.length}`);
});

// プレミアム以外の件数
let free = 0, premium = 0;
candidates.each((_, el) => {
  if ($(el).find('img[src*="premosaic"], img[src*="mosaic"]').length > 0 || $(el).text().includes('プレミアム口コミ')) {
    premium++;
  } else {
    free++;
  }
});
console.log(`\n無料: ${free}件 / プレミアム: ${premium}件`);
