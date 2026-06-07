/**
 * ADAMAS 画像取得デバッグ（最初の3件だけ試す）
 * 実行: node scripts/debug/debug_adamas_images.mjs
 */

const BASE = 'https://a-adamas.com';

const URLS = [
  { name: '葉月ななみ', src: 'https://a-adamas.com/wp-content/uploads/49529a346bd67407f473a1980.jpg' },
  { name: '並木いろは', src: 'https://a-adamas.com/wp-content/uploads/546598baf2e72b448d3b02bbe.jpg' },
  { name: '戸田ゆいか', src: 'https://a-adamas.com/wp-content/uploads/S__62939139.jpg' },
];

for (const t of URLS) {
  console.log(`\n--- ${t.name} ---`);
  console.log('URL:', t.src);
  try {
    const res = await fetch(t.src, {
      headers: {
        'Referer': BASE + '/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      }
    });
    console.log('Status:', res.status, res.statusText);
    console.log('Content-Type:', res.headers.get('content-type'));
    console.log('Content-Length:', res.headers.get('content-length'));
  } catch (e) {
    console.log('Error:', e.message);
    if (e.cause) console.log('Cause:', e.cause.message);
  }
}
