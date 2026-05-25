/**
 * Marine・DEEP ESSENTIAL セラピスト画像 詳細確認
 * 実行: node scripts/debug/debug_marine_deepe.mjs
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

    // data-src で staff/cast/therapist っぽい画像を探す
    console.log('\n⏳ data-src (staff画像候補, 最初の10件):');
    let count = 0;
    $('img[data-src]').each((i, el) => {
      const src = $(el).attr('data-src') || '';
      if (src.includes('icon') || src.includes('nav') || src.includes('logo') || src.includes('banner')) return;
      if (count >= 10) return;
      const alt = $(el).attr('alt') || '';
      const cls = $(el).attr('class') || '';
      console.log(`  data-src="${src.slice(0,80)}" alt="${alt.slice(0,30)}" class="${cls.slice(0,30)}"`);
      count++;
    });

    // 通常のsrcでstaff系
    console.log('\n🖼️  src (staff/cast画像候補, 最初の10件):');
    count = 0;
    $('img[src]').each((i, el) => {
      const src = $(el).attr('src') || '';
      if (src.includes('icon') || src.includes('nav') || src.includes('logo') || src.includes('header') || src.includes('common') || src.includes('btn')) return;
      if (count >= 10) return;
      const alt = $(el).attr('alt') || '';
      console.log(`  src="${src.slice(0,80)}" alt="${alt.slice(0,30)}"`);
      count++;
    });

    // cast/staffブロック全体を表示
    console.log('\n📦 cast/staffブロック HTML（最初の2件）:');
    const blocks = $('[class*="cast_wrap"],[class*="cast_box"],[class*="staff_box"],[class*="therapist_list"]').slice(0, 2);
    blocks.each((i, el) => {
      console.log(`\n  [${i}] <${el.tagName} class="${$(el).attr('class')}">:`);
      // このブロック内のimg
      $(el).find('img').each((j, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src') || '';
        const alt = $(img).attr('alt') || '';
        console.log(`    img src="${src.slice(0,80)}" alt="${alt.slice(0,30)}"`);
      });
      // テキスト
      const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 150);
      console.log(`    text: ${text}`);
    });

    // ラビットスパ用 OGP確認
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    if (ogImage) console.log(`\n🌐 OGP: ${ogImage.slice(0,100)}`);

  } catch (e) {
    console.log(`❌ ${e.message}`);
  }
}

(async () => {
  await inspect('Marine スタッフ', 'https://tsunamarine.com/staff.php');
  await inspect('DEEP ESSENTIAL セラピスト', 'https://deep-e.com/web/therapist');
  await inspect('ラビットスパ TOP (OGP確認)', 'https://rabbit-spa.net/');
})();
