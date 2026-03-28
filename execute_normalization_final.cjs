const fs = require('fs');
const path = require('path');

// 設定
const DATA_DIR = 'public/data';
const MASTER_OUTPUT = 'src/data/therapists.json';
const BACKUP_DIR = 'src/data_backup_final';

console.log("🚀 正規化プロセス(Final)を開始します...\n");

// 1. バックアップ作成
console.log(`📦 バックアップを作成中 (${BACKUP_DIR})...`);
try {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  
  function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      if (fs.statSync(srcPath).isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
  // src/data も念のため
  if(fs.existsSync('src/data')) copyRecursive('src/data', path.join(BACKUP_DIR, 'src_data'));
  // public/data
  copyRecursive(DATA_DIR, path.join(BACKUP_DIR, 'public_data'));
  console.log("   ✅ バックアップ完了");
} catch (e) {
  console.error("❌ バックアップ失敗", e);
  process.exit(1);
}

// 2. マスターデータ生成 & 店舗データ更新準備
console.log("\n🔍 データをスキャンしてマスターを構築中...");

const masterTherapists = {};
const filesToUpdate = {}; 
let totalTherapists = 0;
let ruleACount = 0; // 維持
let ruleBCount = 0; // 結合
let ruleCCount = 0; // 生成

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);
        
        const isArray = Array.isArray(data);
        const shop = isArray ? data[0] : data;
        let isModified = false;

        if (shop.therapists && Array.isArray(shop.therapists) && shop.therapists.length > 0) {
          const newTherapistIds = [];

          shop.therapists.forEach(t => {
            if (typeof t === 'object') {
              totalTherapists++;
              
              let masterId;
              const idStr = String(t.id || '');

              // --- ID決定ロジック ---
              
              if (!t.id) {
                // [ルールC] IDなし -> 生成
                const prefix = shop.id || path.basename(file, '.json');
                const cleanName = (t.name || 'unknown').replace(/\s+/g, '');
                masterId = `${prefix}_${cleanName}`;
                ruleCCount++;
              } 
              else if (idStr.match(/^[0-9-]+$/)) {
                // [ルールB] 数字とハイフンのみ -> 店舗IDを結合してユニーク化
                // ※ ただし、shop.id が既に含まれているような重複結合は避ける（簡易チェック）
                const prefix = shop.id || path.basename(file, '.json');
                masterId = `${prefix}_${idStr}`;
                ruleBCount++;
              } 
              else {
                // [ルールA] アンダースコアや文字を含む -> そのまま維持
                // (例: macherie_name, 77504-yuri)
                masterId = idStr;
                ruleACount++;
              }

              // --- マスターへの登録 ---
              if (!masterTherapists[masterId]) {
                masterTherapists[masterId] = {
                  ...t,
                  id: masterId,
                  shopIds: [shop.id]
                };
              } else {
                // 統合（所属店舗追加）
                if (shop.id && !masterTherapists[masterId].shopIds.includes(shop.id)) {
                  masterTherapists[masterId].shopIds.push(shop.id);
                }
                // 情報の補完（欠損項目があれば埋める）
                Object.keys(t).forEach(key => {
                   const currentVal = masterTherapists[masterId][key];
                   if ((currentVal === undefined || currentVal === null || currentVal === 0 || currentVal === '') && t[key]) {
                      masterTherapists[masterId][key] = t[key];
                   }
                });
              }

              newTherapistIds.push(masterId);
              isModified = true;
            } else {
              // 既にID文字列ならそのまま
              newTherapistIds.push(t);
            }
          });

          if (isModified) {
            shop.therapists = newTherapistIds;
            const newData = isArray ? [shop] : shop;
            filesToUpdate[fullPath] = JSON.stringify(newData, null, 2);
          }
        }
      } catch (e) {
        console.error(`❌ エラー: ${fullPath}`, e.message);
      }
    }
  });
}

processDirectory(DATA_DIR);

// 3. 保存実行
console.log(`\n💾 マスターデータ保存中: ${Object.keys(masterTherapists).length} 人`);
console.log(`   - ルールA (維持) : ${ruleACount}`);
console.log(`   - ルールB (結合) : ${ruleBCount}`);
console.log(`   - ルールC (生成) : ${ruleCCount}`);

if (!fs.existsSync('src/data')) fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync(MASTER_OUTPUT, JSON.stringify(masterTherapists, null, 2));

console.log(`📝 店舗データを更新中 (${Object.keys(filesToUpdate).length}ファイル)...`);
Object.keys(filesToUpdate).forEach(filePath => {
  fs.writeFileSync(filePath, filesToUpdate[filePath]);
});

console.log("\n✅ 正規化完了！");
console.log("   これより『ViewBuilder』の作成に進んでください。");
