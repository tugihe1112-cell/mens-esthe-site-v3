const fs = require('fs');
const path = require('path');

// --- 設定 ---
const SRC_DIR = path.join(__dirname, '../src/data');
const OUT_DIR = path.join(__dirname, '../public/data');

// 出力ファイル
const OUT_SHOPS = path.join(OUT_DIR, 'shops.json');
const OUT_REVIEWS = path.join(OUT_DIR, 'reviews.json');
// therapists.json は既存のものをベースにする（今回は上書きしない設定）
const OUT_THERAPISTS = path.join(OUT_DIR, 'therapists.json');

// --- ヘルパー関数: 再帰的にファイルを探索 ---
function getAllJsonFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllJsonFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.json') && file !== 'mockData.js') {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

function main() {
  console.log('🚀 Generating master data from src/data...');

  // 1. 出力先ディレクトリの確保
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 2. ソースファイルの収集
  const allFiles = getAllJsonFiles(SRC_DIR);
  const shops = [];
  const brandGroupMap = {}; // brandId → group_id のマッピング
  let allReviews = [];

  console.log(`📋 Found ${allFiles.length} source files.`);

  // 3. データ抽出と統合
  allFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // IDを持つものを「店舗データ」とみなす
      if (data.id) {
        // 店舗データをリストに追加
        // ★重要: reviewsが含まれていれば、そのままshops.jsonにも含める
        // brandIdが同じ店舗には同じgroup_idを付与（レビュー吸収のため）
        if (data.brandId) {
          if (!brandGroupMap[data.brandId]) {
            // 既存のgroup_idがあればそれを使い、なければ新規生成
            brandGroupMap[data.brandId] = data.group_id || ('g_brand_' + data.brandId);
          }
          data.group_id = brandGroupMap[data.brandId];
        }
        shops.push(data);

        // クチコミがあれば、reviews.json用に抽出して平坦化する
        if (data.reviews && Array.isArray(data.reviews)) {
          allReviews = allReviews.concat(data.reviews);
        }
      }
    } catch (err) {
      console.warn(`⚠️  Skipping ${path.basename(filePath)}: ${err.message}`);
    }
  });

  // 4. ファイル書き出し
  
  // (A) shops.json
  fs.writeFileSync(OUT_SHOPS, JSON.stringify(shops, null, 2));
  console.log(`✅ Generated shops.json (${shops.length} shops)`);

  // (B) reviews.json
  // 既存のreviews.jsonがある場合は、それとマージするか、今回生成したものを優先するか。
  // ここでは「今回生成したもの」で完全に上書きします（srcが正なので）。
  fs.writeFileSync(OUT_REVIEWS, JSON.stringify(allReviews, null, 2));
  console.log(`✅ Generated reviews.json (${allReviews.length} reviews)`);

  console.log("🎉 Master data generation complete!");
}

main();
