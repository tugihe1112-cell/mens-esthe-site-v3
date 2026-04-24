import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 修正前: {(shop.website_url || shop?.raw_data?.website) && (
// 修正後: {(shop.websiteUrl || shop.website_url || shop?.raw_data?.website || cloudShop?.schedule_url) && (

if (content.includes('shop.website_url || shop?.raw_data?.website')) {
  content = content.replace(
    /\{\(shop\.website_url\s*\|\|\s*shop\?\.raw_data\?\.website\)\s*&&\s*\(/g,
    '{(shop.websiteUrl || shop.website_url || shop?.raw_data?.website || cloudShop?.schedule_url) && ('
  );
  fs.writeFileSync(filePath, content);
  console.log('✅ ShopDetailPage.jsx の表示条件のバグを修正しました！');
} else {
  console.log('⚠️ 対象のコードが見つかりません。');
}
