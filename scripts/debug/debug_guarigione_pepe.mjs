/**
 * Guarigione (.girl 構造) / Pepe Spa (data-src) 詳細確認
 * 実行: node scripts/debug/debug_guarigione_pepe.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function debugGuarigione() {
  console.log('\n====== Guarigione ======');
  const res = await fetch('https://www.spa-g.net/therapist.html', { headers: ua });
  const $ = cheerio.load(await res.text());

  // .girl 内部構造
  $('.girl').slice(0, 4).each((i, el) => {
    const imgs = $(el).find('img').map((_, e) => $(e).attr('src') || '').get();
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`  [${i}] imgs: ${imgs.join(' | ')}`);
    console.log(`       text: ${text}`);
  });

  // ロゴ: templates_c/ の画像が実際のパスかチェック
  console.log('\nロゴURL (templates_c):', 'https://www.spa-g.net/templates_c/10501a24bfc4febcf52a4a118b7b0b85.jpg');
}

async function debugPepe() {
  console.log('\n====== Pepe Spa ======');
  const res = await fetch('https://www.pepespa.com/staff/', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  // img の全属性確認（data-src / data-lazy / srcset）
  console.log('img 全属性（先頭8件）:');
  $('img').slice(0, 8).each((i, el) => {
    const attrs = Object.entries(el.attribs || {})
      .map(([k, v]) => `${k}="${String(v).slice(0, 60)}"`)
      .join(', ');
    console.log(`  [${i}] ${attrs}`);
  });

  // script 内に画像URLがあるか
  console.log('\nscript内 URL/fetch:');
  $('script:not([src])').each((_, el) => {
    const code = $(el).text();
    if (code.includes('/staff') || code.includes('image') || code.includes('photo')) {
      console.log(`  ${code.slice(0, 200)}`);
    }
  });

  // li:has(img) の HTML 先頭200文字
  console.log('\nli[0] innerHTML:');
  const li0 = $('li:has(img)').first();
  console.log($.html(li0).slice(0, 400));
}

async function run() {
  await debugGuarigione();
  await debugPepe();
  console.log('\n完了');
}
run().catch(e => console.error('❌', e.message));
