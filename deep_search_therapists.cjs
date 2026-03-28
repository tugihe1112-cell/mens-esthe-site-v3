const fs = require('fs');
const path = require('path');

// 除外するディレクトリ
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build'];

// 1. プロジェクト全体から関連ファイルを探す
console.log("🔍 プロジェクト全体からセラピスト関連ファイル（json/js）を捜索中...");
function findFiles(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (!IGNORE_DIRS.includes(file)) {
          results = results.concat(findFiles(fullPath));
        }
      } else {
        // ファイル名チェック: therapist, staff, cast, girl, master などの単語が含まれるか
        if (file.match(/therapist|staff|cast|girl|master/i) && (file.endsWith('.json') || file.endsWith('.js'))) {
          results.push(fullPath);
        }
      }
    });
  } catch (e) {}
  return results;
}

const foundFiles = findFiles('.');
if (foundFiles.length > 0) {
  console.log("✅ 以下の関連ファイルが見つかりました:");
  foundFiles.forEach(f => console.log(`   - ${f}`));
} else {
  console.log("❌ 関連する名前のファイルは見つかりませんでした。");
}

console.log("\n---------------------------------------------------\n");

// 2. 全店舗データをスキャンして「ID参照型」の痕跡を探す
console.log("🔍 全店舗データの中身をスキャン中...");
const shopsPath = 'src/data/all_shops.json';

if (fs.existsSync(shopsPath)) {
  const data = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));
  const shops = Array.isArray(data) ? data : Object.values(data);
  let idRefFound = false;

  shops.forEach(shop => {
    if (shop.therapists && shop.therapists.length > 0) {
      // 最初のセラピストをチェック
      const t = shop.therapists[0];
      
      // 文字列ならID参照（例: ["hanako01"]）
      // オブジェクトでもキーが少ないならID参照の可能性あり
      if (typeof t === 'string' || (typeof t === 'object' && Object.keys(t).length < 3 && t.id)) {
        console.log(`✅ 発見！店舗「${shop.name}」のデータはID参照型のようです。`);
        console.log(`   値: ${JSON.stringify(t)}`);
        idRefFound = true;
      }
    }
  });

  if (!idRefFound) {
    console.log("❌ 全店舗チェックしましたが、「ID参照型（分離型）」になっているデータは1件も見つかりませんでした。");
    console.log("   すべてのデータが「埋め込み型（詳細情報入り）」になっています。");
  }
}
