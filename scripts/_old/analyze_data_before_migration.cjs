const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data';
let totalShops = 0;
let shopsWithTherapists = 0;
let totalTherapistsCount = 0;
let objectTypeCount = 0;
let stringTypeCount = 0;
let missingIdCount = 0;
let sampleTherapist = null;

console.log("🔍 データ診断を開始します（変更は加えません）...\n");

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);
        // 配列なら先頭を取得(以前の修正対応)
        const shop = Array.isArray(data) ? data[0] : data;
        
        totalShops++;

        if (shop.therapists && Array.isArray(shop.therapists) && shop.therapists.length > 0) {
          shopsWithTherapists++;
          
          shop.therapists.forEach(t => {
            totalTherapistsCount++;
            
            if (typeof t === 'string') {
              stringTypeCount++;
            } else if (typeof t === 'object') {
              objectTypeCount++;
              if (!t.id) {
                missingIdCount++;
                // IDがないデータのサンプルを表示
                if (missingIdCount === 1) console.log(`⚠️ IDがないデータ発見: 店舗[${shop.name}] 名前[${t.name}]`);
              }
              // サンプルとして最初の1件を保持
              if (!sampleTherapist) sampleTherapist = t;
            }
          });
        }
      } catch (e) {
        console.error(`❌ 読込エラー: ${fullPath}`, e.message);
      }
    }
  });
}

if (fs.existsSync(DATA_DIR)) {
  scanDirectory(DATA_DIR);
} else {
  console.log(`❌ ディレクトリが見つかりません: ${DATA_DIR}`);
  console.log("   (カレントディレクトリを確認してください)");
}

console.log("\n---------------------------------------------------");
console.log("📊 診断結果レポート");
console.log("---------------------------------------------------");
console.log(`🏠 総店舗ファイル数      : ${totalShops} 件`);
console.log(`👯 セラピストがいる店舗  : ${shopsWithTherapists} 件`);
console.log(`👤 セラピストデータ総数  : ${totalTherapistsCount} 人分`);
console.log("---------------------------------------------------");
console.log(`📝 データ形式の内訳:`);
console.log(`   - 詳細情報（Object）  : ${objectTypeCount} 件 (これらを正規化します)`);
console.log(`   - ID参照（String）    : ${stringTypeCount} 件 (すでに正規化済？)`);
console.log("---------------------------------------------------");

if (missingIdCount > 0) {
  console.log(`⚠️ 【注意】IDを持たないセラピストが ${missingIdCount} 件あります。`);
  console.log(`   -> 自動的に ID を生成する必要があります（例: shopId_name）。`);
} else {
  console.log("✅ 全員のデータに元々 ID が付与されています。");
}

if (sampleTherapist) {
  console.log("\n👀 抽出されるデータのサンプル（1件目）:");
  console.log(JSON.stringify(sampleTherapist, null, 2));
}

console.log("\n---------------------------------------------------");
if (objectTypeCount > 0) {
  console.log("💡 判定: 正規化の実行が必要です。");
  console.log("   次のステップで、これら詳細データをマスターファイルに移動します。");
} else if (totalTherapistsCount === 0) {
  console.log("❓ セラピストデータが1件も見つかりませんでした。場所が正しいか確認してください。");
} else {
  console.log("✅ すべてID参照になっているようです。正規化の必要はないかもしれません。");
}
