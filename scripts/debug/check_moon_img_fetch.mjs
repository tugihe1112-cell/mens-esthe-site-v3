// ミセスムーンR 画像取得テスト
const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const testUrl = 'https://moor-kobe.jp/wcms/gals/images/751/photo_007_221028.jpg';

// 1. 素の fetch
const res1 = await fetch(testUrl, {
  headers: { 'User-Agent': ua },
  signal: AbortSignal.timeout(10000),
});
console.log('status:', res1.status);
console.log('content-type:', res1.headers.get('content-type'));
const buf = Buffer.from(await res1.arrayBuffer());
console.log('size:', buf.length, 'bytes');

// 2. Referer付き
const res2 = await fetch(testUrl, {
  headers: {
    'User-Agent': ua,
    'Referer': 'https://moor-kobe.jp/gals/',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  },
  signal: AbortSignal.timeout(10000),
});
console.log('\nReferer付き:');
console.log('status:', res2.status);
console.log('content-type:', res2.headers.get('content-type'));
const buf2 = Buffer.from(await res2.arrayBuffer());
console.log('size:', buf2.length, 'bytes');
