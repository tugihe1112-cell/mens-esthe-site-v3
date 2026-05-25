/**
 * Y PRIME セラピストページ構造詳細確認
 * 実行: node scripts/debug/debug_y_prime_therapist.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const res = await fetch('https://y-prime-yokohama.com/therapist', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log(`HTTP: ${res.status}, img総数: ${$('img').length}`);

  // S3 therapist_image URL を全部収集
  const s3Imgs = [...html.matchAll(/https?:\/\/y-prime-yokohama-bucket-prod[^\s'"<>]+/g)].map(m => m[0]);
  console.log(`\nS3 therapist画像 件数: ${s3Imgs.length}`);
  [...new Set(s3Imgs)].slice(0, 5).forEach(u => console.log(`  ${u.slice(0, 100)}`));

  // セラピスト名リンク
  console.log('\n=== /therapist/[id] リンク ===');
  $('a[href*="/therapist/"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (!/\/therapist\/\d+/.test(href)) return;
    const text = $(el).closest('article, li, div').first().text().replace(/\s+/g, ' ').trim().slice(0, 120);
    const img = $(el).closest('article, li, div').first().find('img').first().attr('src') || '';
    console.log(`  href="${href}" img="${img.slice(0,60)}"`);
    console.log(`    text="${text}"`);
    if (i > 6) return false;
  });

  // img[src*="s3"] の親要素構造
  console.log('\n=== S3画像を含む li/article 構造 ===');
  $('img[src*="y-prime-yokohama-bucket-prod"]').slice(0, 4).each((i, el) => {
    const parent = $(el).closest('li, article, [class*="cast"], [class*="therapist"]').first();
    const tag = parent.prop('tagName') || 'none';
    const cls = (parent.attr('class') || '').slice(0, 60);
    const text = parent.text().replace(/\s+/g, ' ').trim().slice(0, 120);
    console.log(`  [${i}] tag=${tag} class="${cls}"`);
    console.log(`    text="${text}"`);
  });
}

run().catch(e => console.error('❌', e.message));
