import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// --- 1. 店舗ロゴを「元のシンプルな形」に戻す ---
// 先ほど追加した || "" などをすべて削ぎ落とし、余計なフォールバックをなくします
const shopRegex = /<LazyImage\s+src=\{shop(?:\?)?\.image_url\s*\|\|[^}]+\}\s+alt=\{[^}]+\}\s+className="w-full h-full object-cover transition duration-\[2s\] group-hover:scale-105"\s*\/>/g;
const originalShopTag = `<LazyImage src={shop.image_url || shop.image} alt={shop.name} className="w-full h-full object-cover transition duration-[2s] group-hover:scale-105" />`;

if (shopRegex.test(content)) {
  content = content.replace(shopRegex, originalShopTag);
  console.log('✅ 店舗ロゴの画像タグを「luxtime表示時の元の形」に復元しました。');
} else {
  console.log('⚠️ 店舗ロゴのタグが見つかりません。');
}

// --- 2. セラピスト画像を「元のシンプルな形」に戻す ---
const therapistRegex = /<LazyImage\s+src=\{t(?:\?)?\.image_url\s*\|\|[^}]+\}\s+alt=\{[^}]+\}\s+className="w-full h-full object-cover transition duration-700 group-hover:scale-110"\s*\/>/g;
const originalTherapistTag = `<LazyImage src={t.image_url || t.image} alt={t.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />`;

if (therapistRegex.test(content)) {
  content = content.replace(therapistRegex, originalTherapistTag);
  console.log('✅ セラピストの画像タグを「luxtime表示時の元の形」に復元しました。');
} else {
  console.log('⚠️ セラピストのタグが見つかりません。');
}

fs.writeFileSync(filePath, content);
console.log('\n🎊 すべての画像表示ロジックを、完全に正常だった状態に巻き戻しました！');
