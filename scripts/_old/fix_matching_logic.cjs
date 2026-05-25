const fs = require('fs');
const path = require('path');

// バックアップファイルを全て読み込んでマップを作成
const backupDir = './src/data_backup_final/public_data';
const backupMap = {}; // shop_id -> therapists

function scanAllBackups(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanAllBackups(fullPath);
    } else if (item.name.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (data.therapists && Array.isArray(data.therapists) && data.therapists.length > 0) {
          // shop_idを推測
          const shopId = data.id || item.name.replace('.json', '');
          
          // therapistsの最初の要素にshop_idがあればそれを使う
          if (data.therapists[0] && data.therapists[0].shop_id) {
            const sid = data.therapists[0].shop_id;
            if (!backupMap[sid]) {
              backupMap[sid] = data.therapists;
            }
          } else if (typeof shopId === 'string') {
            // ファイル名から推測されたIDを使用
            const pathParts = fullPath.split('/');
            // 例: tokyo/shibuya/ebisu.json -> tokyo_shibuya_ebisu
            const constructedId = pathParts.slice(-3, -1).join('_') + '_' + shopId;
            
            if (!backupMap[constructedId]) {
              backupMap[constructedId] = data.therapists;
            }
          }
        }
      } catch (e) {}
    }
  });
}

console.log('バックアップをスキャン中...');
scanAllBackups(backupDir);

console.log(`\nバックアップマップ作成完了: ${Object.keys(backupMap).length}店舗`);
console.log('\nサンプル (最初の10件):');
Object.keys(backupMap).slice(0, 10).forEach(id => {
  console.log(`  ${id}: ${backupMap[id].length}人`);
});

// cucueがあるか確認
const cucueKeys = Object.keys(backupMap).filter(k => k.includes('cucue'));
console.log(`\nCucue関連: ${cucueKeys.length}件`);
cucueKeys.forEach(k => console.log(`  ${k}: ${backupMap[k].length}人`));
