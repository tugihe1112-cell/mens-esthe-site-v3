const fs = require('fs');
const path = require('path');

// データの場所
const dataDir = path.join(__dirname, 'public/data');
const outputFile = path.join(__dirname, 'src/data/index.js');

// 再帰的にファイルを探索する関数
const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // JSONファイルのみ対象
      if (file.endsWith('.json') && !file.startsWith('.')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
};

try {
  console.log('🔄 データフォルダをスキャンして正規化・登録中...');
  
  if (!fs.existsSync(dataDir)) {
    console.error('❌ public/data フォルダが見つかりません');
    process.exit(1);
  }

  const allFiles = getAllFiles(dataDir);
  const shops = {};
  let successCount = 0;
  let errorCount = 0;

  allFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 空ファイル対策
      if (!content.trim()) return;

      const rawData = JSON.parse(content);
      
      // ■ ここが修正ポイント：配列でも単体でも「配列」に変換して統一処理する
      const dataList = Array.isArray(rawData) ? rawData : [rawData];

      dataList.forEach(data => {
        // IDがない場合はファイル名等から生成（重複回避のためディレクトリ名を含める）
        if (!data.id) {
          const fileName = path.basename(filePath, '.json');
          const parentDir = path.basename(path.dirname(filePath));
          data.id = `${parentDir}_${fileName}`; // 例: ebisu_anaichi
        }
        
        // IDを文字列型に統一（数値と文字列が混ざるとバグの元になるため）
        const shopId = String(data.id);
        
        // データを登録
        shops[shopId] = data;
        successCount++;
      });

    } catch (err) {
      console.error(`❌ 読み込み失敗: ${filePath}`, err.message);
      errorCount++;
    }
  });

  // src/data/index.js を書き出し
  const fileContent = `// 自動生成ファイル: ${new Date().toLocaleString()}
// 登録店舗数: ${successCount}
export const allShops = ${JSON.stringify(shops, null, 2)};
`;

  fs.writeFileSync(outputFile, fileContent, 'utf8');
  
  console.log('------------------------------------------------');
  console.log(`✅ 完了！ src/data/index.js を更新しました`);
  console.log(`📊 登録された店舗数: ${successCount} 件`);
  if (errorCount > 0) console.log(`⚠️ エラーがあったファイル: ${errorCount} 件`);
  console.log('------------------------------------------------');

} catch (err) {
  console.error('致命的なエラー:', err);
}
