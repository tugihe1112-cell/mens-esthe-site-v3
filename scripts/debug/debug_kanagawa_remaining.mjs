/**
 * 神奈川 残り店舗 HTML構造一括確認
 * 実行: node scripts/debug/debug_kanagawa_remaining.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

const shops = [
  { name: 'doigt de fee',       url: 'https://exe-fee.com/' },
  { name: 'アプローチ川崎',     url: 'https://kawasakia.beautycloud.co.jp/' },
  { name: 'Fromage',            url: 'http://fromage-kawasaki.com/' },
  { name: 'LIVSPA',             url: 'https://livspa.net/' },
  { name: 'Jesse',              url: 'https://ms-jesse.com/' },
  { name: 'RiRe川崎',           url: 'https://rire-kawasaki.com/' },
  { name: 'ベッドオブローゼス', url: 'https://bed-of-roses.site/index.html' },
  { name: 'ROYCE',              url: 'http://aromaroyce.com/' },
  { name: 'レッドアイ',         url: 'https://redeye-esthe.com/' },
  { name: 'Guarigione',         url: 'https://www.spa-g.net/' },
  { name: 'THE BLANC',          url: 'https://the-blanc.site/' },
  { name: 'ワイプライム',       url: 'https://y-prime-yokohama.com/' },
];

async function inspect({ name, url }) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${name}】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const $ = cheerio.load(await res.text());

    // スタッフ関連リンク
    const staffLinks = new Set();
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/staff|cast|therapist|セラピスト|スタッフ|キャスト|model|girl|lady|schedule|スケジュール|出勤/i.test(href + text)) {
        staffLinks.add(`  ${href.slice(0,60)}  [${text.slice(0,20)}]`);
      }
    });
    console.log(`  スタッフ/スケリンク: ${[...staffLinks].slice(0,6).join(' | ')}`);

    // OGP
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    if (ogImage) console.log(`  OGP: ${ogImage.slice(0,90)}`);

    // ロゴ候補
    let logoFound = '';
    $('img').each((i, el) => {
      const src = $(el).attr('src') || '';
      if (/logo/i.test(src) && !logoFound) logoFound = src;
    });
    if (!logoFound) $('header img, .header img, #header img').first().each((i, el) => {
      logoFound = $(el).attr('src') || '';
    });
    if (logoFound) console.log(`  ロゴ候補: ${logoFound.slice(0,90)}`);

    // img 先頭5枚（スタッフ系）
    let staffImgs = 0;
    $('img').each((i, el) => {
      if (staffImgs >= 3) return;
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      if (src.includes('icon') || src.includes('logo') || src.includes('banner') || src.includes('btn') || src.includes('nav')) return;
      console.log(`  img[${i}]: src="${src.slice(0,70)}" alt="${alt.slice(0,25)}"`);
      staffImgs++;
    });

  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}

(async () => {
  for (const shop of shops) {
    await inspect(shop);
  }
})();
