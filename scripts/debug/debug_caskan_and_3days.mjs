/**
 * THE BLANC (caskan) / ゆるスパ横浜 (caskan) / Y PRIME (3days) 構造確認
 * 実行: node scripts/debug/debug_caskan_and_3days.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

// ── THE BLANC (caskan) ────────────────────────────────────
async function debugBlanc() {
  console.log('\n====== THE BLANC (caskan) ======');
  const res = await fetch('https://the-blanc.site/therapist', { headers: ua });
  const $ = cheerio.load(await res.text());

  console.log(`img[src*="caskan"] 件数: ${$('img[src*="caskan"]').length}`);
  console.log(`li[src*="caskan"] li数: ${$('li:has(img[src*="caskan"])').length}`);

  $('li:has(img[src*="caskan"])').slice(0, 3).each((i, el) => {
    const img = $(el).find('img[src*="caskan"]').first();
    const alt = img.attr('alt') || '';
    const src = img.attr('src') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
    console.log(`  [${i}] alt="${alt}" img="${src.slice(0,60)}"`);
    console.log(`       text="${text}"`);
  });
}

// ── ゆるスパ横浜 (caskan?) ────────────────────────────────
async function debugYuru() {
  console.log('\n====== ゆるスパ横浜 ======');
  const res = await fetch('https://yuru-spa.com/yokohama/therapist/', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  // caskan CDN 確認
  const caskanImgs = $('img[src*="caskan"]').length;
  const localTherapistImgs = $('img[src*="therapist_img"]').length;
  console.log(`caskan img: ${caskanImgs}, therapist_img: ${localTherapistImgs}`);

  // スクリプト確認
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('caskan') || src.includes('data') || src.includes('cast')) {
      console.log(`  script: ${src}`);
    }
  });

  // セラピストリスト構造確認
  $('li:has(img), .cast-item, .therapist-item, [class*="cast"]:has(img)').slice(0, 3).each((i, el) => {
    const img = $(el).find('img').first();
    const alt = img.attr('alt') || img.attr('data-alt') || '';
    const src = img.attr('src') || img.attr('data-src') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
    console.log(`  [${i}] tag=${el.tagName} alt="${alt}" img="${src.slice(0,60)}"`);
    console.log(`       text="${text}"`);
  });

  // caskan API endpoint があるか
  const caskanUrl = [...html.matchAll(/caskan[^\s'"<>]*/g)].map(m => m[0]);
  if (caskanUrl.length) console.log(`caskan参照: ${[...new Set(caskanUrl)].slice(0,5).join(', ')}`);
}

// ── Y PRIME (3days) data.js 探索 ─────────────────────────
async function debugYPrime() {
  console.log('\n====== Y PRIME (3days) ======');
  const res = await fetch('https://y-prime-yokohama.com/therapist', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  // script src を全列挙
  console.log('=== script src ===');
  $('script[src]').each((_, el) => console.log(`  ${$(el).attr('src')}`));

  // インラインスクリプト内の URL / fetch
  console.log('=== インライン script の fetch/URL ===');
  $('script:not([src])').each((_, el) => {
    const code = $(el).text();
    if (code.includes('fetch') || code.includes('data.js') || code.includes('s3')) {
      console.log(`  ${code.slice(0, 300)}`);
    }
  });

  // S3 URL
  const s3 = [...html.matchAll(/https?:\/\/[^\s'"<>]*(?:s3|amazonaws)[^\s'"<>]*/gi)];
  if (s3.length) {
    console.log('=== S3 URL ===');
    [...new Set(s3.map(m => m[0]))].slice(0, 8).forEach(u => console.log(`  ${u.slice(0,100)}`));
  }

  // セラピスト名がページ内にあるか
  const names = $('a[href*="/therapist/"]').slice(0, 5).map((_, el) => $(el).text().trim()).get();
  console.log(`セラピスト名候補: ${names.join(', ')}`);
}

async function run() {
  await debugBlanc();
  await debugYuru();
  await debugYPrime();
  console.log('\n完了');
}

run().catch(e => console.error('❌', e.message));
