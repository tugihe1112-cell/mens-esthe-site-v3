const fs = require('fs');
const path = require('path');

// データディレクトリのパス
const dataDir = path.join(__dirname, 'public', 'data');
const srcDataDir = path.join(__dirname, 'src', 'data');

// すべての店舗JSONファイルを収集する関数
function collectShopFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // ディレクトリの場合、再帰的に探索
      collectShopFiles(filePath, fileList);
    } else if (file.endsWith('.json') && file !== 'shops.json') {
      // JSONファイル（shops.json以外）の場合、リストに追加
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// メイン処理
try {
  console.log('店舗ファイルを収集中...');
  const shopFiles = collectShopFiles(dataDir);
  console.log(`${shopFiles.length}件の店舗ファイルを発見しました`);
  
  const shops = [];
  let errorCount = 0;
  
  // 各JSONファイルを読み込み
  shopFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const shop = JSON.parse(content);
      
      // ファイル名からIDを抽出（拡張子を除く）
      const fileName = path.basename(filePath, '.json');
      
      // IDが数値の場合のみ追加（shops.jsonなどを除外）
      if (!isNaN(fileName)) {
        // ファイル名とIDが一致しているか確認
        if (shop.id.toString() !== fileName) {
          console.warn(`警告: ${filePath} - ファイル名(${fileName})とID(${shop.id})が不一致`);
        }
        shops.push(shop);
      }
    } catch (error) {
      console.error(`エラー: ${filePath} の読み込みに失敗しました:`, error.message);
      errorCount++;
    }
  });
  
  console.log(`\n${shops.length}件の店舗を読み込みました`);
  if (errorCount > 0) {
    console.log(`${errorCount}件のエラーがありました`);
  }
  
  // IDでソート
  shops.sort((a, b) => a.id - b.id);
  
  // public/data/shops.json を生成
  const publicShopsPath = path.join(dataDir, 'shops.json');
  fs.writeFileSync(publicShopsPath, JSON.stringify(shops, null, 2), 'utf8');
  console.log(`\n✓ ${publicShopsPath} を更新しました`);
  
  // src/data/all_shops.json を生成
  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true });
  }
  const srcShopsPath = path.join(srcDataDir, 'all_shops.json');
  fs.writeFileSync(srcShopsPath, JSON.stringify(shops, null, 2), 'utf8');
  console.log(`✓ ${srcShopsPath} を更新しました`);
  
  console.log('\n完了しました！');
  
} catch (error) {
  console.error('エラーが発生しました:', error);
  process.exit(1);
}
