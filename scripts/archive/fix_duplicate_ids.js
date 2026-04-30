const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('重複ID修正スクリプト開始...\n');

// 1. すべてのJSONファイルを取得
const files = execSync('find public/data/tokyo public/data/kanagawa -type f -name "*.json" ! -name "shops.json" 2>/dev/null || true')
  .toString().trim().split('\n').filter(f => f);

console.log(`見つかったファイル: ${files.length}件\n`);

// 2. すべての店舗データを読み込み
let shops = [];
let errors = [];

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    shops.push({ file, data });
  } catch (error) {
    errors.push({ file, error: error.message });
  }
});

console.log(`読み込み成功: ${shops.length}件`);
console.log(`読み込みエラー: ${errors.length}件\n`);

// 3. ID使用状況を確認
const idMap = new Map();
shops.forEach(({ file, data }) => {
  if (!idMap.has(data.id)) {
    idMap.set(data.id, []);
  }
  idMap.get(data.id).push({ file, name: data.name });
});

// 4. 重複IDを特定
const duplicates = Array.from(idMap.entries())
  .filter(([id, files]) => files.length > 1)
  .sort((a, b) => a[0] - b[0]);

console.log(`=== 重複ID: ${duplicates.length}個 ===`);
duplicates.forEach(([id, files]) => {
  console.log(`ID ${id}: ${files.length}店舗`);
  files.forEach(f => console.log(`  - ${f.name} (${f.file})`));
});
console.log('');

// 5. 最大IDを取得
const allIds = Array.from(idMap.keys()).filter(id => id > 0);
const maxId = Math.max(...allIds);
console.log(`現在の最大ID: ${maxId}`);
console.log(`新しいID開始番号: ${maxId + 1}\n`);

// 6. 重複IDに新しいIDを割り当て
let newId = maxId + 1;
let updates = [];

duplicates.forEach(([oldId, files]) => {
  // 最初の店舗は既存IDを保持、残りは新しいIDを割り当て
  files.slice(1).forEach(({ file, name }) => {
    updates.push({
      file,
      name,
      oldId,
      newId: newId++
    });
  });
});

console.log(`=== 更新が必要な店舗: ${updates.length}件 ===\n`);

// 7. 確認表示
updates.forEach(({ file, name, oldId, newId }) => {
  console.log(`${name}: ID ${oldId} → ${newId}`);
});

console.log(`\n更新を実行しますか？ (このスクリプトは確認のみです)`);
console.log(`実行する場合は、次のコマンドを使用してください：`);
console.log(`node fix_duplicate_ids_execute.js\n`);

// 8. 更新情報をJSONファイルに保存
fs.writeFileSync('id_updates.json', JSON.stringify(updates, null, 2));
console.log('✅ 更新計画を id_updates.json に保存しました');

