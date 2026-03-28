import fs from 'fs';
import { execSync } from 'child_process';

console.log('すべてのJSONファイルからshops.jsonを再生成...');

const files = execSync('find public/data/tokyo public/data/kanagawa public/data/saitama public/data/chiba -type f -name "*.json" ! -name "shops.json" 2>/dev/null || true')
  .toString().trim().split('\n').filter(f => f);

console.log(`見つかったファイル: ${files.length}件\n`);

let allShops = [];
let successCount = 0;
let errorCount = 0;

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.trim()) {
      console.log(`⚠️ 空ファイル: ${file}`);
      errorCount++;
      return;
    }
    
    const data = JSON.parse(content);
    
    // 配列形式とオブジェクト形式の両方に対応
    if (Array.isArray(data) && data.length > 0) {
      // 配列形式: [{...}]
      allShops.push(data[0]);
      successCount++;
    } else if (typeof data === 'object' && data.id) {
      // オブジェクト形式: {...}
      allShops.push(data);
      successCount++;
    } else {
      console.log(`⚠️ データ形式エラー: ${file}`);
      errorCount++;
    }
  } catch (err) {
    console.log(`❌ 読み込みエラー: ${file}`);
    console.log(`   理由: ${err.message}`);
    errorCount++;
  }
});

console.log(`\n=== 結果 ===`);
console.log(`成功: ${successCount}件`);
console.log(`エラー: ${errorCount}件`);
console.log(`合計店舗数: ${allShops.length}`);

// shops.jsonに保存
fs.writeFileSync('public/data/shops.json', JSON.stringify(allShops, null, 2), 'utf8');

// all_shops.jsonにもコピー
fs.writeFileSync('src/data/all_shops.json', JSON.stringify(allShops, null, 2), 'utf8');

console.log('✅ shops.jsonとall_shops.jsonを再生成しました');
