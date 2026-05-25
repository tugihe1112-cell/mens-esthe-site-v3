/**
 * Y PRIME リストページのS3画像URL全文確認
 * 実行: node scripts/debug/debug_y_prime_imgurl.mjs
 */
import * as cheerio from 'cheerio';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const res = await fetch('https://y-prime-yokohama.com/therapist', { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  // S3 URL を全文（切り捨てなし）で表示
  const s3Matches = [...html.matchAll(/https?:\/\/y-prime-yokohama-bucket-prod[^\s"'<>\)]+/g)];
  const unique = [...new Set(s3Matches.map(m => m[0]))];
  console.log(`S3 URL ユニーク件数: ${unique.length}`);
  unique.forEach((u, i) => console.log(`  [${i}] ${u}`));

  // img の data-src / data-lazy / srcset なども確認
  console.log('\n=== img の全属性（先頭10件） ===');
  $('img').slice(0, 10).each((i, el) => {
    const attrs = Object.entries(el.attribs || {})
      .map(([k, v]) => `${k}="${String(v).slice(0, 80)}"`)
      .join(' ');
    console.log(`  [${i}] ${attrs}`);
  });

  // セラピスト要素（/therapist/[id] リンク）の親の data-* 属性
  console.log('\n=== セラピスト要素の data 属性 ===');
  $('a[href*="/therapist/"]').slice(0, 4).each((i, el) => {
    const href = $(el).attr('href') || '';
    if (!/\/therapist\/\d+/.test(href)) return;
    const parent = $(el).closest('article, li, section, div[class]');
    const dataAttrs = Object.entries(parent[0]?.attribs || {})
      .filter(([k]) => k.startsWith('data-'))
      .map(([k, v]) => `${k}="${String(v).slice(0, 80)}"`)
      .join(' ');
    console.log(`  href="${href}" | data: ${dataAttrs || 'なし'}`);
    // 親のHTML先頭200文字
    console.log(`  html: ${$.html(parent).slice(0, 200)}`);
  });
}

run().catch(e => console.error('❌', e.message));
