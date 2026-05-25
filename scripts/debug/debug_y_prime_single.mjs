/**
 * Y PRIME 個別セラピストページの画像URL確認
 * 実行: node scripts/debug/debug_y_prime_single.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  // 個別ページ例: /therapist/124
  const res = await fetch('https://y-prime-yokohama.com/therapist/124', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('=== img src 全件 ===');
  $('img').each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy') || '';
    if (src) console.log(`  [${i}] ${src.slice(0, 100)}`);
  });

  console.log('\n=== S3 URL ===');
  const s3 = [...html.matchAll(/https?:\/\/y-prime-yokohama-bucket-prod[^\s'"<>]+/g)];
  [...new Set(s3.map(m => m[0]))].forEach(u => console.log(`  ${u.slice(0, 120)}`));

  console.log('\n=== テキスト（名前/スペック確認） ===');
  $('h1, h2, .name, [class*="name"], [class*="profile"]').slice(0, 5).each((_, el) => {
    console.log(`  ${$(el).text().replace(/\s+/g, ' ').trim().slice(0, 80)}`);
  });
}

run().catch(e => console.error('❌', e.message));
