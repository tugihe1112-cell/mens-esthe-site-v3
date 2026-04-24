import fs from 'fs';

const filePath = 'src/pages/ShopDetailPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🛠️  クチコミ吸収ロジックを注入しています...');

// 1. fetchのURLを、ブランドIDを含めた「in」クエリに書き換え
// shop_id=eq.${shopId}  -->  shop_id=in.(${shopId},${brandId})
const oldFetch = "fetch(`${url}/rest/v1/reviews?shop_id=eq.${shopId}&select=*`";
const newFetch = "fetch(`${url}/rest/v1/reviews?shop_id=in.(${shopId}${shopData[0]?.brand_id ? ',' + shopData[0].brand_id : ''})&select=*`";

// まず、shopData[0] が確定した後にクチコミを取得するように順序を調整したロジックへ置換
// 既存の Promise.all 内のクチコミフェッチを一旦「店舗IDのみ」で維持しつつ、
// その後の処理でブランドIDが判明していたら再取得、あるいは取得条件を広げる修正を施します。
// 今回は最も確実な「取得条件の書き換え」を行います。

content = content.replace(
  /fetch\(\`\$\{url\}\/rest\/v1\/reviews\?shop_id=eq\.\$\{shopId\}\&select=\*\`,/g,
  "fetch(`${url}/rest/v1/reviews?shop_id=in.(${shopId}${shopData?.[0]?.brand_id ? ',' + shopData[0].brand_id : ''})&select=*`,"
);

// 2. スケジュールボタンの表示条件（websiteUrlのタイポ）も念のため再確認・修正
content = content.replace(
  /\{\(shop\.website_url\s*\|\|\s*shop\?\.raw_data\?\.website\)\s*&&\s*\(/g,
  '{(shop.websiteUrl || shop.website_url || shop?.raw_data?.website || cloudShop?.schedule_url) && ('
);

fs.writeFileSync(filePath, content);

console.log('✅ 修正が完了しました！');
console.log('   - クチコミ：ブランドIDによる「吸収」を有効化しました。');
console.log('   - スケジュール：表示フラグの条件を修正しました。');
console.log('\n👉 ブラウザをリロードして、メンエスグループ各店で同じクチコミが出ているか確認してください！');
