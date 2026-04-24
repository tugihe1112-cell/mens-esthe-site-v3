import fs from 'fs';

async function run() {
  const filePath = 'src/pages/ShopDetailPage.jsx';
  let content = fs.readFileSync(filePath, 'utf8');

  console.log('🔍 画像表示のバグを修正しています...\n');

  // --- 1. 店舗ロゴ画像の修正 ---
  // 先ほど私が追加した "NO IMAGE" のフォールバックが、逆に悪さをしている（空の文字列を評価してしまっている）可能性があるため、
  // luxtimeがうまく動いていた時の「一番シンプルな形」に戻します。
  const shopLogoRegex = /<LazyImage\s+src=\{[^}]+\}\s+alt=\{[^}]+\}\s+className="w-full h-full object-cover transition duration-\[2s\] group-hover:scale-105"\s*\/>/g;
  const newShopLogo = `<LazyImage src={shop.image_url || shop.logo_url || shop.image || ""} alt={shop.name || "店舗画像"} className="w-full h-full object-cover transition duration-[2s] group-hover:scale-105" />`;
  
  if (shopLogoRegex.test(content)) {
    content = content.replace(shopLogoRegex, newShopLogo);
    console.log('✅ 店舗ロゴ（上部）の画像表示を luxtime 仕様に修正しました。');
  }

  // --- 2. セラピスト画像の修正 ---
  // スクリーンショットの原因はここです。t.image_url ではなく、データベース上に存在する全ての可能性（profile_imageなど）を拾うようにします。
  const therapistImgRegex = /<LazyImage\s+src=\{[^}]+\}\s+alt=\{[^}]+\}\s+className="w-full h-full object-cover transition duration-700 group-hover:scale-110"\s*\/>/g;
  const newTherapistImg = `<LazyImage src={t.image_url || t.profile_image || t.image || t.pic || ""} alt={t.name || "セラピスト"} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />`;
  
  if (therapistImgRegex.test(content)) {
    content = content.replace(therapistImgRegex, newTherapistImg);
    console.log('✅ セラピスト（CAST一覧）の画像表示を luxtime 仕様に修正しました。');
  }

  fs.writeFileSync(filePath, content);
  
  console.log('\n🎊 修正が完了しました！Viteサーバーが自動更新されます。ブラウザを確認してください。');
}

run();
