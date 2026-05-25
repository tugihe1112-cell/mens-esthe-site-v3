const fs = require('fs');

console.log("🔍 徹底調査開始...\n");

// 1. src/data の中身を全部見る（隠れているかも）
console.log("📂 src/data フォルダの中身:");
if (fs.existsSync('src/data')) {
  const files = fs.readdirSync('src/data');
  files.forEach(f => console.log(`   - ${f}`));
} else {
  console.log("   (フォルダが存在しません)");
}

console.log("\n---------------------------------------------------\n");

// 2. 先ほどヒットした "super_happy_girls.json" の中身確認
// （これがセラピストリストなのか、ただの店舗なのか？）
const girlsPath = 'public/data/osaka/umeda/super_happy_girls.json';
if (fs.existsSync(girlsPath)) {
  console.log(`📄 ${girlsPath} の中身（先頭のみ）:`);
  const content = fs.readFileSync(girlsPath, 'utf8');
  try {
    const json = JSON.parse(content);
    // 配列で、中身がセラピストっぽいなら当たり
    if (Array.isArray(json) && json[0].bust !== undefined) {
       console.log("   ✅ 【当たりかも！】これはセラピストのリストデータに見えます！");
    } else if (json.therapists) {
       console.log("   ⚠️ これは「店舗データ」です（中にtherapistsを持っています）。");
    }
    console.log(`   データ構造: ${JSON.stringify(json).substring(0, 200)}...`);
  } catch (e) {
    console.log("   (JSONパースエラー)");
  }
}

console.log("\n---------------------------------------------------\n");

// 3. create_... 系スクリプトの中に "const therapists = [...]" がないか探す
console.log("🔍 create_*.js スクリプト内のコード検索:");
const rootFiles = fs.readdirSync('.');
const createScripts = rootFiles.filter(f => f.startsWith('create_') && f.endsWith('.js') || f.endsWith('.cjs'));

createScripts.forEach(script => {
  const content = fs.readFileSync(script, 'utf8');
  // "therapists =" や "staffs =" みたいな定義があるか
  if (content.match(/const\s+(therapists|staffs|girls)\s*=\s*\[/)) {
    console.log(`   ✅ 発見: ${script} の中にセラピストのリスト定義コードがあります！`);
  }
});

if (createScripts.length === 0) console.log("   (create_系スクリプトは見当たりませんでした)");

