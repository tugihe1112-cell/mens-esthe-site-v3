/**
 * ホームの固定ヒーロー画像を公式サイト直リンクから自社R2へ移す。
 * 既定はdry-run。`--live`を付けた場合だけ、同じ固定キーへ冪等アップロードする。
 */
import { uploadImage } from '../lib/r2Upload.mjs';

const LIVE = process.argv.includes('--live');
const WORKER_BASE = 'https://mens-esthe-images.tugihe1112.workers.dev/shop-logos';

const images = [
  {
    shopId: 'tokyo_minato_azabujuban_linda_spa',
    source: 'https://linda-spa.com/wp-content/themes/linda2/img/logo.png',
    referer: 'https://linda-spa.com/',
    key: 'hero_linda_spa_logo.png',
  },
  {
    shopId: 'tokyo_shinjuku_kabukicho_aromacharm',
    source: 'https://aromacharm.net/images_shop/logo.png',
    referer: 'https://aromacharm.net/',
    key: 'hero_aromacharm_logo.png',
  },
  {
    shopId: 'tokyo_chiyoda_iidabashi_tokyo_aroma_este',
    source: 'https://tokyoaroma.jp/wp-content/uploads/2023/12/girl-2554687_1280-1.jpg',
    referer: 'https://tokyoaroma.jp/',
    key: 'hero_tokyo_aroma_este.jpg',
  },
];

if (!LIVE) {
  console.log(JSON.stringify({ live: false, uploads: images.map((item) => ({
    shopId: item.shopId,
    source: item.source,
    destination: `${WORKER_BASE}/${item.key}`,
  })) }, null, 2));
  process.exit(0);
}

for (const item of images) {
  const uploaded = await uploadImage(item.source, item.key, item.referer, 'shop-logos');
  if (!uploaded) throw new Error(`${item.shopId}: R2アップロードに失敗`);

  const publicUrl = `${WORKER_BASE}/${item.key}`;
  const response = await fetch(publicUrl, {
    headers: { Accept: 'image/*', 'User-Agent': 'hero-image-cache-verifier/1.0' },
    signal: AbortSignal.timeout(15_000),
  });
  const contentType = response.headers.get('content-type') || '';
  const bytes = (await response.arrayBuffer()).byteLength;
  if (!response.ok || !contentType.startsWith('image/') || bytes === 0) {
    throw new Error(`${item.shopId}: 公開検証失敗 HTTP ${response.status} ${contentType} ${bytes}bytes`);
  }
  console.log(`✅ ${item.shopId}: ${publicUrl} (${contentType}, ${bytes} bytes)`);
}
