/**
 * 神奈川 優先店舗 セラピストページ HTML構造確認
 * 実行: node scripts/debug/debug_kanagawa_priority2.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

async function inspect(name, url) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${name}】 ${url}`);
  try {
    const res = await fetch(url, { headers: ua });
    const html = await res.text();
    const $ = cheerio.load(html);

    // imgタグ最初の20枚
    console.log('\n🖼️  img タグ (最初の20枚):');
    $('img').slice(0, 20).each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy') || '';
      const alt = $(el).attr('alt') || '';
      const cls = $(el).attr('class') || '';
      console.log(`  [${i}] src="${src.slice(0,80)}" alt="${alt.slice(0,30)}" class="${cls.slice(0,30)}"`);
    });

    // セラピスト名っぽいテキストを含む要素
    console.log('\n👩 名前っぽい要素のサンプル:');
    $('[class*="name"],[class*="cast"],[class*="staff"],[class*="therapist"],[class*="girl"]').slice(0, 15).each((i, el) => {
      const text = $(el).text().trim().slice(0, 60);
      const cls = $(el).attr('class') || '';
      const tag = el.tagName;
      if (text) console.log(`  <${tag} class="${cls.slice(0,40)}"> ${text}`);
    });

    // picture/source タグ（lazy load対策）
    const sources = $('picture source, source[srcset]');
    if (sources.length > 0) {
      console.log(`\n📸 picture source タグ (${sources.length}件, 最初の5件):`);
      sources.slice(0, 5).each((i, el) => {
        const srcset = $(el).attr('srcset') || '';
        console.log(`  srcset="${srcset.slice(0,80)}"`);
      });
    }

    // data-src/data-lazy などのlazyload属性
    const lazyImgs = $('img[data-src], img[data-lazy], img[data-original]');
    if (lazyImgs.length > 0) {
      console.log(`\n⏳ lazy load img (${lazyImgs.length}件, 最初の5件):`);
      lazyImgs.slice(0, 5).each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-lazy') || $(el).attr('data-original') || '';
        const alt = $(el).attr('alt') || '';
        console.log(`  data-src="${src.slice(0,80)}" alt="${alt.slice(0,30)}"`);
      });
    }

    // OGP
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    if (ogImage) console.log(`\n🌐 OGP: ${ogImage.slice(0,100)}`);

  } catch (e) {
    console.log(`❌ ${e.message}`);
  }
}

(async () => {
  await inspect('DEEP ESSENTIAL セラピストページ', 'https://deep-e.com/web/therapist');
  await inspect('GOLD セラピストページ', 'https://gold-m-e.com/girl');
  await inspect('Agu スタッフページ', 'https://kosugi-agu.com/staff.php');
  await inspect('Marine スタッフページ', 'https://tsunamarine.com/staff.php');
  await inspect('ラビットスパ セラピストページ', 'https://rabbit-spa.net/therapist');
})();
