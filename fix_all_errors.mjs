import fs from 'fs';

console.log("🛠️ 修正スクリプトを開始します...");

// 1. AuthContext.jsx の修正
const authPath = 'src/contexts/AuthContext.jsx';
if (fs.existsSync(authPath)) {
  let code = fs.readFileSync(authPath, 'utf-8');
  // profilesテーブルに存在しない店舗用カラムの要求を削除
  code = code.replace(/plan,\s*image_url,\s*website_url,\s*price_system,\s*business_hours/g, "plan, image_url");
  fs.writeFileSync(authPath, code);
  console.log("✅ AuthContext.jsx: profilesテーブルの不正なカラム要求(400エラー原因)を修正しました。");
} else {
  console.log("⚠️ AuthContext.jsx が見つかりません。手動で確認してください。");
}

// 2. DataContext.jsx の修正
const dataPath = 'src/contexts/DataContext.jsx';
if (fs.existsSync(dataPath)) {
  let code = fs.readFileSync(dataPath, 'utf-8');
  // 存在しないプレースホルダー画像へのフォールバックを null に置換
  code = code.replace(/\|\|\s*['"`]\/images\/therapists\/placeholder\.jpg['"`]/g, "|| null");
  fs.writeFileSync(dataPath, code);
  console.log("✅ DataContext.jsx: ローカルプレースホルダーへのフォールバックを null に修正しました。");
} else {
  console.log("⚠️ DataContext.jsx が見つかりません。");
}

// 3. Unsplashの404エラー修正
// Unsplashの画像URLパターンをすべて網羅して置換
const unsplashRegex = /https:\/\/images\.unsplash\.com\/photo-[^'"`\\]*/g;
const placeholdUrl = 'https://placehold.co/400x500/1e293b/94a3b8?text=No+Image';

const filesToFix = ['src/components/Sidebar.jsx', 'src/mockData.js', 'src/data/mockData.js', 'src/components/LazyImage.jsx'];
filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf-8');
    if (code.match(unsplashRegex)) {
      code = code.replace(unsplashRegex, placeholdUrl);
      fs.writeFileSync(filePath, code);
      console.log(`✅ ${filePath}: Unsplashのリンク切れURLを安全なプレースホルダーに置換しました。`);
    }
  }
});

console.log("\n🎉 すべての修正が完了しました！");
