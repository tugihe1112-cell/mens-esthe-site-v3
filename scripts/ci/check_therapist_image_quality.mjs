import assert from 'node:assert/strict';
import {
  findRepeatedTherapistImageGroups,
  findUnrelatedRepeatedTherapistImageGroups,
  isKnownBadTherapistImageUrl,
  isSuspiciousTherapistImageSourceUrl,
  isSuspiciousTherapistName,
  normalizeTherapistNameForImageComparison,
} from '../lib/therapistImageQuality.mjs';

assert.equal(
  isKnownBadTherapistImageUrl(
    'https://mens-esthe-images.tugihe1112.workers.dev/therapist-images/mig_6904371b7677618b4187.png?x=1',
  ),
  true,
);
assert.equal(isSuspiciousTherapistImageSourceUrl('https://example.com/images/now-printing.jpg'), true);
assert.equal(isSuspiciousTherapistImageSourceUrl('https://example.com/photos/86/IMG_9048.jpg'), false);
assert.equal(isSuspiciousTherapistImageSourceUrl('https://example.com/asset/img/spacer300x450.png'), true);
assert.equal(isSuspiciousTherapistImageSourceUrl('https://example.com/写真準備中.jpg'), true);
assert.equal(isSuspiciousTherapistName('即姫割り開催中です（）'), true);
assert.equal(isSuspiciousTherapistName('トップページ'), true);
assert.equal(isSuspiciousTherapistName('雛乃 まりな'), false);
assert.equal(normalizeTherapistNameForImageComparison('《新人》 白石 みれい（23）'), '白石みれい');

const repeated = findRepeatedTherapistImageGroups(
  Array.from({ length: 5 }, (_, index) => ({
    shop_id: 'shop-a',
    name: `名前${index}`,
    image_url: 'https://example.com/same.jpg',
  })),
);
assert.equal(repeated.length, 1);
assert.equal(repeated[0].distinctNames, 5);

assert.equal(
  findUnrelatedRepeatedTherapistImageGroups([
    { shop_id: 'shop-a', name: 'うみ', image_url: 'https://example.com/a.jpg' },
    { shop_id: 'shop-a', name: 'うみ（Umi）※大塚', image_url: 'https://example.com/a.jpg' },
  ]).length,
  0,
);
assert.equal(
  findUnrelatedRepeatedTherapistImageGroups([
    { shop_id: 'shop-a', name: '桐谷ありな', image_url: 'https://example.com/a.jpg' },
    { shop_id: 'shop-a', name: '雪城みゆ', image_url: 'https://example.com/a.jpg' },
  ]).length,
  1,
);

console.log('✅ セラピスト画像の品質ガード');
