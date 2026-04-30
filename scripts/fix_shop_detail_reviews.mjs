import fs from 'fs';
import path from 'path';

const targetFile = path.resolve('src/pages/ShopDetailPage.jsx');

async function main() {
  if (!fs.existsSync(targetFile)) {
    console.log(`❌ ${targetFile} が見つかりません。`);
    return;
  }

  let content = fs.readFileSync(targetFile, 'utf-8');

  // 1. fetchAllData 内のクエリ作成部分を書き換える
  // group_id がある場合は group_id を使って reviews を取得するように変更
  const oldFetchLogic = `
        // 2. 確定したブランドIDを含めて、口コミとキャストを並列取得する
        const reviewFetchUrl = brandId 
          ? \`\${url}/rest/v1/reviews?shop_id.in.(\${shopId},\${brandId || 'none'})&select=*\`
          : \`\${url}/rest/v1/reviews?shop_id=eq.\${shopId}&select=*\`;`;

  const newFetchLogic = `
        // 2. group_id (系列店) があれば系列店すべての口コミを取得、なければ shop_id (単一店) で取得
        const groupId = shopData?.[0]?.group_id;
        
        // group_id で shops を検索し、紐づく reviews を取得するための URL
        const reviewFetchUrl = groupId 
          ? \`\${url}/rest/v1/reviews?select=*,shops!inner(name,group_id)&shops.group_id=eq.\${groupId}\`
          : \`\${url}/rest/v1/reviews?shop_id=eq.\${shopId}&select=*\`;`;

  // 書き換えの実行
  if (content.includes('// 2. 確定したブランドIDを含めて、口コミとキャストを並列取得する')) {
    // 古いロジックを正規表現で大まかにマッチさせて置換 (空白や改行の揺らぎを吸収)
    const regex = /\/\/ 2\. 確定したブランドIDを含めて、口コミとキャストを並列取得する[\s\S]*?(?=const \[tRes, rRes\])/;
    content = content.replace(regex, newFetchLogic + '\n\n        ');
    
    fs.writeFileSync(targetFile, content);
    console.log('✅ ShopDetailPage.jsx の fetch ロジックを「クチコミ吸収（グループ共有）」対応に書き換えました。');
  } else {
    console.log('⚠️ 対象の置換箇所が見つかりませんでした。すでに変更されているか、コード構造が異なります。');
  }
}

main();
