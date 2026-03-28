const fs = require('fs');

const REVIEWS_PATH = 'public/data/reviews.json';

try {
  if (!fs.existsSync(REVIEWS_PATH)) {
    console.error("❌ reviews.json が見つかりません。");
    process.exit(1);
  }

  const reviews = JSON.parse(fs.readFileSync(REVIEWS_PATH, 'utf8'));

  console.log(`📊 現在の口コミ総数: ${reviews.length} 件`);

  if (reviews.length > 0) {
    console.log("\n✅ [正解フォーマット] 最新の口コミデータサンプル:");
    console.log(JSON.stringify(reviews[0], null, 2)); // 最初の1件を整形して表示
    
    // キーの一覧も出す
    console.log("\n🔑 使用されているキー一覧:");
    console.log(Object.keys(reviews[0]).join(", "));
  } else {
    console.log("⚠️ 口コミデータが空です。フォーマットを確認できません。");
  }

} catch (e) {
  console.error("エラー:", e);
}
