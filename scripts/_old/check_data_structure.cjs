const fs = require('fs');
const path = 'src/data/all_shops.json';

if (!fs.existsSync(path)) {
  console.log("❌ ファイルがありません");
  process.exit(1);
}

const rawData = fs.readFileSync(path, 'utf8');
const data = JSON.parse(rawData);

console.log("🔍 データ構造チェック:");
console.log("---------------------------------------------------");

// 1. 配列かオブジェクトか判定
if (Array.isArray(data)) {
  console.log("⚠️ 現在のデータ形式: [ 配列 (Array) ] です");
  console.log("   (詳細ページが ID で検索する際、配列だと見つけられない可能性があります)");
} else {
  console.log("✅ 現在のデータ形式: { オブジェクト (Object) } です");
}

console.log(`📊 データ総数: ${Object.keys(data).length} 件`);

// 2. アロマモアを探す
let target = null;
if (Array.isArray(data)) {
  target = data.find(s => s.name && s.name.includes("アロマモア"));
} else {
  // オブジェクトの場合、valuesから探す
  target = Object.values(data).find(s => s.name && s.name.includes("アロマモア"));
}

console.log("\n🔍 アロマモアの登録状況:");
if (target) {
  console.log(`✅ データあり: ${target.name}`);
  console.log(`   ID: ${target.id}`);
  console.log(`   型: ${typeof target.id}`);
} else {
  console.log("❌ アロマモアのデータ自体が見つかりません（一覧に出ているのが不思議です）");
}
