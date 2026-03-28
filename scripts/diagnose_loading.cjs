const fs = require('fs');
const path = require('path');

const THERAPISTS_PATH = 'public/data/therapists.json';

try {
  console.log("🏥 LOADING ISSUE DIAGNOSIS");
  
  if (!fs.existsSync(THERAPISTS_PATH)) {
    console.error("❌ public/data/therapists.json が見つかりません");
    process.exit(1);
  }

  const therapists = JSON.parse(fs.readFileSync(THERAPISTS_PATH, 'utf8'));
  console.log(`- 全セラピスト数: ${therapists.length} 名`);

  // 1. 正常に動いているはずのデータ (例: Galaxy)
  const normalSample = therapists.find(t => t.shop_id && t.shop_id.includes('galaxy'));
  
  // 2. 救出したデータ (例: 超レベチ, 綺麗なサロン)
  // blind_, content_, smart_ などのプレフィックスがついているか、ID生成されたもの
  const rescuedSample = therapists.find(t => 
    t.id.includes('blind_') || 
    t.id.includes('content_') || 
    t.id.includes('smart_') ||
    (t.shop_id && t.shop_id.includes('levechi'))
  );

  console.log("\n📊 データ構造比較");
  console.log("---------------------------------------------------");
  
  if (normalSample) {
    console.log("✅ [正常系サンプル] (Galaxyなど)");
    console.log(`   ID:       ${normalSample.id}`);
    console.log(`   ShopID:   ${normalSample.shop_id}`);
    console.log(`   Name:     ${normalSample.name}`);
    console.log(`   GroupID:  ${normalSample.group_id}`);
  } else {
    console.log("⚠️ 正常系サンプルが見つかりません");
  }

  console.log("---------------------------------------------------");

  if (rescuedSample) {
    console.log("🚨 [救出系サンプル] (Loadingになる疑いがあるもの)");
    console.log(`   ID:       ${rescuedSample.id}`);
    console.log(`   ShopID:   ${rescuedSample.shop_id}`);
    console.log(`   Name:     ${rescuedSample.name}`);
    console.log(`   GroupID:  ${rescuedSample.group_id}`);
    
    // 重要なチェック
    if (!rescuedSample.id) console.log("   ❌ IDがありません (致命的)");
    if (!rescuedSample.shop_id) console.log("   ❌ ShopIDがありません");
    if (rescuedSample.id === rescuedSample.shop_id) console.log("   ⚠️ IDとShopIDが全く同じです (ルーティング競合の可能性)");
  } else {
    console.log("⚠️ 救出系サンプルが見つかりません (データ移行は本当に成功しましたか？)");
  }

  console.log("\n---------------------------------------------------");
  console.log("💡 次のアクション:");
  console.log("ブラウザで Loading になっている時、URLの末尾を見てください。");
  console.log("例: http://localhost:3000/therapist/【ここのID】");
  console.log("そのIDと、上記の「救出系サンプル」のIDが一致する形式か確認が必要です。");

} catch (e) {
  console.error("エラー:", e);
}
