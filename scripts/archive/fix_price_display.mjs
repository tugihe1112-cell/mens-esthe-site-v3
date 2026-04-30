import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let code = fs.readFileSync(filePath, 'utf-8');

// 古いキャッシュ(shop)を優先している記述を狙い撃ちします
const targetRegex = /\{shop\.price_system \|\| shop\.raw_data\?\.price \|\| '料金情報なし'\}/;

// 直でDBから取ってきた最新の cloudShop.price_system を「絶対的な最優先」にするスッキリしたロジックに差し替え
const newCode = "{cloudShop?.price_system || shop?.price_system || shop?.raw_data?.price || '料金情報なし'}";

if (code.match(targetRegex)) {
  code = code.replace(targetRegex, newCode);
  fs.writeFileSync(filePath, code);
  console.log("✅ 修正完了！無駄なキャッシュ優先を廃止し、DB直の最新データ(cloudShop)を最優先で表示するように変更しました。");
} else {
  console.log("❌ 置換対象のコードが見つかりませんでした。");
}
