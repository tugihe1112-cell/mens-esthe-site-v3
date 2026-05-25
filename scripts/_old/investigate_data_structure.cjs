const fs = require('fs');
const path = require('path');

console.log("🔍 データ構造の徹底調査を開始します...\n");

// 1. ソース元となる public/data/osaka の確認
const osakaDir = 'public/data/osaka';
if (fs.existsSync(osakaDir)) {
  console.log(`✅ ディレクトリ発見: ${osakaDir}`);
  
  // 再帰的にファイルを探索してJSONを探す
  function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        results = results.concat(getFiles(filePath));
      } else if (file.endsWith('.json')) {
        results.push(filePath);
      }
    });
    return results;
  }

  const files = getFiles(osakaDir);
  console.log(`   -> 大阪エリアのJSONファイル数: ${files.length} ファイル`);

  if (files.length > 0) {
    // 最初のファイルの「中身」を確認
    const samplePath = files[0];
    const content = fs.readFileSync(samplePath, 'utf8');
    console.log(`\n📄 データの中身チェック (${path.basename(samplePath)}):`);
    console.log("---------------------------------------------------");
    console.log(content.substring(0, 500)); 
    console.log("---------------------------------------------------");
    
    try {
      const data = JSON.parse(content);
      const shop = Array.isArray(data) ? data[0] : data;
      console.log(`   [診断] prefecture: ${shop.prefecture || "❌なし"}`);
      console.log(`   [診断] city: ${shop.city || "❌なし"}`);
    } catch(e) {
      console.log(`   ❌ JSONとして読み込めません: ${e.message}`);
    }
  } else {
    console.log("   ⚠️ ディレクトリはありますが、JSONファイルが1つもありません。");
  }
} else {
  console.log(`❌ 重大エラー: ${osakaDir} が見つかりません。データ元が存在しません。`);
}

console.log("\n---------------------------------------------------\n");

// 2. アプリが読み込んでいる src/data/all_shops.json の確認
const destFile = 'src/data/all_shops.json';
if (fs.existsSync(destFile)) {
  const content = fs.readFileSync(destFile, 'utf8');
  const shops = JSON.parse(content);
  console.log(`✅ 出力先ファイル確認: ${destFile}`);
  console.log(`   -> 現在の登録総数: ${shops.length} 件`);
  
  const osakaShops = shops.filter(s => 
    (s.prefecture && s.prefecture.includes('大阪')) || 
    (s.city && s.city.includes('大阪'))
  );
  console.log(`   -> そのうち「大阪」と認識されているデータ: ${osakaShops.length} 件`);
} else {
  console.log(`❌ 出力先ファイル (${destFile}) が存在しません。`);
}
