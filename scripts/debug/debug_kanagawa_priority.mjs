/**
 * 神奈川 優先店舗 HTML構造確認
 * 実行: node scripts/debug/debug_kanagawa_priority.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

const shops = [
  { name: 'DEEP ESSENTIAL', url: 'https://deep-e.com/', staffPath: null },
  { name: 'GOLD',           url: 'https://gold-m-e.com/', staffPath: null },
  { name: 'Agu',            url: 'https://kosugi-agu.com/', staffPath: null },
  { name: 'Marine',         url: 'https://tsunamarine.com/', staffPath: null },
  { name: 'ラビットスパ',   url: 'https://rabbit-spa.net/', staffPath: null },
];

async function checkSite({ name, url }) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${name}】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const html = await res.text();
    const $ = cheerio.load(html);

    // <a> タグでスタッフ・セラピスト・キャスト関連のリンクを探す
    const staffLinks = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/staff|cast|therapist|セラピスト|スタッフ|キャスト|model|girl|lady/i.test(href + text)) {
        staffLinks.push(`  href="${href}" text="${text}"`);
      }
    });
    console.log(`\n📋 スタッフ関連リンク (${staffLinks.length}件):`);
    staffLinks.slice(0, 10).forEach(l => console.log(l));

    // nav/menu 内のリンクも表示
    console.log('\n📋 ナビゲーションリンク:');
    $('nav a, .nav a, .menu a, header a, #menu a, .gnav a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (text) console.log(`  href="${href}" text="${text}"`);
    });

    // img タグの一部を表示（セラピスト画像を探す）
    console.log('\n🖼️  画像サンプル (最初の10枚):');
    $('img').slice(0, 10).each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt') || '';
      console.log(`  src="${src.slice(0, 80)}" alt="${alt.slice(0, 40)}"`);
    });

    // ロゴ候補
    console.log('\n🏷️  ロゴ候補:');
    $('img[src*="logo"], img[alt*="logo"], img[alt*="ロゴ"], header img, .logo img, #logo img').each((i, el) => {
      const src = $(el).attr('src') || '';
      console.log(`  ${src.slice(0, 100)}`);
    });

    // OGP
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    if (ogImage) console.log(`\n🌐 OGP image: ${ogImage.slice(0, 100)}`);

  } catch (e) {
    console.log(`❌ エラー: ${e.message}`);
  }
}

(async () => {
  for (const shop of shops) {
    await checkSite(shop);
  }
})();
