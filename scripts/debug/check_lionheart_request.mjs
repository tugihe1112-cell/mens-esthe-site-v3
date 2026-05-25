/**
 * Lion Heart & Request のセラピスト名・画像パターン詳細確認
 * 実行: node scripts/debug/check_lionheart_request.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

// === Lion Heart ===
console.log('=== Lion Heart ===');
{
  const res = await fetch('http://lion-heart.pwchp.com/therapist.php', { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('images_staff 先頭10件:');
  $('img[src*="images_staff"]').slice(0, 10).each((i, el) => {
    console.log(`  [${i}] alt="${$(el).attr('alt')}" | ${$(el).attr('src')?.slice(0, 70)}`);
  });

  console.log('\n繰り返し構造候補:');
  ['li', '.cast', '.therapist', '.staff', '.member', '[class*="cast"]', '[class*="staff"]'].forEach(sel => {
    const n = $(sel).length;
    if (n > 3 && n < 300) console.log(`  ${sel}: ${n}件`);
  });

  // images_staffの前後のテキスト（名前がどこにあるか）
  console.log('\nimages_staff img の親要素テキスト(先頭5件):');
  $('img[src*="images_staff"]').slice(0, 5).each((i, el) => {
    const parentText = $(el).closest('li, div, article').text().trim().replace(/\s+/g, ' ').slice(0, 60);
    console.log(`  [${i}] "${parentText}"`);
  });
}

// === Request ===
console.log('\n=== Request ===');
{
  const res = await fetch('https://request-hakata.com/therapist/', { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('cast img 先頭10件:');
  $('img[src*="cast"]').slice(0, 10).each((i, el) => {
    console.log(`  [${i}] alt="${$(el).attr('alt')}" | ${$(el).attr('src')?.slice(0, 70)}`);
  });

  // cast imgの親テキスト
  console.log('\ncast img の親要素テキスト(先頭5件):');
  $('img[src*="cast"]').slice(0, 5).each((i, el) => {
    const parentText = $(el).closest('li, div, article, tr').text().trim().replace(/\s+/g, ' ').slice(0, 80);
    console.log(`  [${i}] "${parentText}"`);
  });

  // schedule_url候補
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/schedule|スケジュール/i.test(href + text)) {
      console.log(`\nschedule候補: "${text}" → ${href}`);
    }
  });
}
