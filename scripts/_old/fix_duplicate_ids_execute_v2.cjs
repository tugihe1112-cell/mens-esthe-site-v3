const fs = require('fs');
const path = require('path');

console.log('🔧 重複ID修正実行スクリプト（配列対応版）開始...\n');

// 1. 更新計画を読み込み
const updates = JSON.parse(fs.readFileSync('id_updates.json', 'utf8'));

console.log(`修正対象: ${updates.length}件\n`);

let successCount = 0;
let errorCount = 0;

// 2. 各ファイルを更新
updates.forEach(({ file, name, oldId, newId }, index) => {
  try {
    // JSONファイルを読み込み
    const rawData = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    // 配列形式かオブジェクト形式か判定
    let data;
    let isArray = false;
    
    if (Array.isArray(rawData)) {
      isArray = true;
      data = rawData[0]; // 配列の最初の要素を取得
    } else {
      data = rawData;
    }
    
    // IDを更新
    data.id = newId;
    
    // セラピストIDのプレフィックスを更新
    if (data.therapists && Array.isArray(data.therapists)) {
      data.therapists = data.therapists.map(therapist => {
        let therapistName = therapist.id || therapist.name;
        
        // 既存のプレフィックスがある場合は削除
        if (therapistName && therapistName.includes('-')) {
          therapistName = therapistName.split('-').slice(1).join('-');
        }
        
        return {
          ...therapist,
          id: `${newId}-${therapistName}`
        };
      });
    }
    
    // ファイルに書き込み（元の形式を保持）
    if (isArray) {
      fs.writeFileSync(file, JSON.stringify([data], null, 2), 'utf8');
    } else {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    }
    
    successCount++;
    
    if ((index + 1) % 20 === 0) {
      console.log(`処理中... ${index + 1}/${updates.length}`);
    }
    
  } catch (error) {
    console.error(`❌ エラー: ${name} (${file})`);
    console.error(`   ${error.message}`);
    errorCount++;
  }
});

console.log(`\n=== 実行結果 ===`);
console.log(`✅ 成功: ${successCount}件`);
console.log(`❌ エラー: ${errorCount}件`);

console.log(`\n次のコマンドでshops.jsonを再生成してください:`);
console.log(`node regenerate_shops_json.js`);
console.log(`cp public/data/shops.json src/data/all_shops.json`);

