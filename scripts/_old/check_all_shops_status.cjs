const fs = require('fs');
const path = 'src/data/all_shops.json';

try {
  const raw = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(raw);

  console.log("🔍 全店舗データの状態診断を実行します...\n");

  if (Array.isArray(data)) {
    console.log("❌ 【判定: 危険】 データが「配列 (Array)」になっています。");
    console.log(`   影響を受けている店舗数: ${data.length} 件 (全店舗)`);
    console.log("   状況: すべての店舗で、詳細ページをクリックしても「店舗が見つかりません」となります。");
    console.log("   -> アロマモアだけでなく、他の全ての店舗でも同じ現象が起きています。");
  } else {
    console.log("✅ 【判定: 安全】 データは「オブジェクト (Object)」になっています。");
    console.log(`   登録店舗数: ${Object.keys(data).length} 件`);
    console.log("   状況: 詳細ページは正常に開ける状態です。");
  }

} catch (e) {
  console.error("エラー:", e);
}
