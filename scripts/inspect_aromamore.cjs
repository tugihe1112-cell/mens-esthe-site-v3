const fs = require('fs');
const path = require('path');

const SHOPS_PATH = 'public/data/shops.json';
const THERAPISTS_PATH = 'public/data/therapists.json';

try {
  console.log("🌸 AROMAMORE INVESTIGATION STARTED");

  const shops = JSON.parse(fs.readFileSync(SHOPS_PATH, 'utf8'));
  const therapists = JSON.parse(fs.readFileSync(THERAPISTS_PATH, 'utf8'));

  // 1. アロマモア全店舗を特定
  const targetShops = shops.filter(s => s.name.includes('アロマモア') || s.name.toLowerCase().includes('aromamore'));
  
  if (targetShops.length === 0) {
    console.error("❌ アロマモアが見つかりません！");
    process.exit(1);
  }

  console.log(`\n🏢 対象店舗: ${targetShops.length} 店舗`);
  targetShops.forEach(s => console.log(`   - ${s.name} (ID: ${s.id})`));

  const targetShopIds = targetShops.map(s => s.id);
  const targetGroupIds = targetShops.map(s => s.group_id).filter(Boolean);

  // 2. 所属セラピストを抽出
  const targetTherapists = therapists.filter(t => 
    targetShopIds.includes(t.shop_id) || 
    (t.group_id && targetGroupIds.includes(t.group_id))
  );

  console.log(`\n👩‍⚕️ 所属セラピスト総数: ${targetTherapists.length} 名`);

  // 3. 重複チェック（名前でグルーピング）
  const nameMap = {};
  targetTherapists.forEach(t => {
    const name = t.name.trim(); // 空白削除して比較
    if (!nameMap[name]) nameMap[name] = [];
    nameMap[name].push(t);
  });

  // 4. 分析結果出力
  console.log("\n🔍 重複・怪しいデータの内訳:");
  
  Object.keys(nameMap).forEach(name => {
    const entries = nameMap[name];
    
    // 重複している場合、またはIDがおかしい場合に出力
    if (entries.length > 1 || entries[0].id.includes('blind') || entries[0].id.includes('merge')) {
      console.log(`\n👉 名前: [ ${name} ] (${entries.length}件登録)`);
      entries.forEach(e => {
        let status = "✅ 正常系";
        if (e.id.includes('blind') || e.id.includes('merge') || e.id.includes('smart')) {
          status = "⚠️ 復旧データ系";
        }
        console.log(`     - ID: ${e.id.padEnd(30)} | Shop: ${e.shop_id} | ${status}`);
      });
    }
  });

  console.log("\n==========================================");
  console.log("💡 診断:");
  const duplicates = Object.values(nameMap).filter(arr => arr.length > 1).length;
  if (duplicates > 0) {
    console.log(`🚨 ${duplicates} 名のセラピストが重複しています！`);
    console.log("対策: 「復旧データ系」の方を削除し、「正常系」を残すマージ処理が必要です。");
  } else {
    console.log("重複は見当たりません。別の原因（無関係な人が混ざっているなど）かもしれません。");
  }

} catch (e) {
  console.error("エラー:", e);
}
