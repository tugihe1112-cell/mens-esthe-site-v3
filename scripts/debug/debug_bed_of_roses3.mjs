import * as cheerio from 'cheerio';

const SITE = 'https://bed-of-roses.site';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const res = await fetch(`${SITE}/therapists.html`, { headers: ua });
  const html = await res.text();
  const $ = cheerio.load(html);

  // JS ファイルを列挙
  console.log('=== script src ===');
  $('script[src]').each((_, el) => console.log(`  ${$(el).attr('src')}`));

  // インライン JS に URL やデータが含まれるか
  console.log('\n=== インライン script 内のURL/fetch ===');
  $('script:not([src])').each((_, el) => {
    const code = $(el).text();
    const urls = [...code.matchAll(/['"`](https?:\/\/[^'"`\s]{5,}|\/[a-z][^'"`\s]{3,}\.(?:json|php|api))/g)];
    if (urls.length) urls.forEach(m => console.log(`  ${m[1]}`));
    if (code.includes('fetch(') || code.includes('axios') || code.includes('$.ajax')) {
      console.log(`  [fetch/ajax発見] ${code.slice(0, 200)}`);
    }
  });

  // HTML 内の JSON っぽいデータ
  console.log('\n=== JSON/データ埋め込み ===');
  const jsonMatches = [...html.matchAll(/\{[^{}]{0,20}"name"[^{}]{0,100}\}/g)];
  jsonMatches.slice(0, 5).forEach(m => console.log(`  ${m[0].slice(0, 100)}`));

  // 3days.tech API（テンプレートエンジン）
  const tdMatches = [...html.matchAll(/3days\.tech[^\s'"<>]*/g)];
  if (tdMatches.length) tdMatches.forEach(m => console.log(`  3days: ${m[0]}`));

  // HTML 全体から画像URLパターン
  console.log('\n=== HTML内の画像URL候補 ===');
  const imgUrls = [...html.matchAll(/https?:\/\/[^\s'"<>]+\.(?:jpg|jpeg|png|webp)/gi)];
  imgUrls.slice(0, 10).forEach(m => console.log(`  ${m[0]}`));

  // AWS S3やCDN
  console.log('\n=== S3/CDN URL ===');
  const s3 = [...html.matchAll(/https?:\/\/[^\s'"<>]*(?:s3|cloudfront|cdn)[^\s'"<>]*/gi)];
  s3.slice(0, 5).forEach(m => console.log(`  ${m[0]}`));
}

run().catch(e => console.error('❌', e.message));
