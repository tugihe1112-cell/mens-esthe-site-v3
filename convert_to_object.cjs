const fs = require('fs');
const TARGET_FILE = 'src/data/all_shops.json';

try {
  const raw = fs.readFileSync(TARGET_FILE, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    console.log("✅ データは既に正しい形式（オブジェクト）です。");
    process.exit(0);
  }

  console.log(`⚠️ 現在の形式: 配列 (${data.length}件) -> 修正が必要です`);
  console.log("🔄 IDをキーにしたオブジェクト形式に変換中...");

  const objectData = {};
  data.forEach(shop => {
    if (shop.id) {
      // IDをキーとして登録
      objectData[String(shop.id)] = shop;
    }
  });

  const newCount = Object.keys(objectData).length;
  console.log(`📊 変換後のデータ数: ${newCount}件`);

  fs.writeFileSync(TARGET_FILE, JSON.stringify(objectData, null, 2));
  console.log("🎉 保存完了！これで詳細ページが表示されるようになります。");

} catch (e) {
  console.error("エラー:", e);
}
