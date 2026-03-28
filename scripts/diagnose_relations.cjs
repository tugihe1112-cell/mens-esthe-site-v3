const fs = require('fs');
const path = require('path');

try {
  // 1. データ読み込み
  const shops = JSON.parse(fs.readFileSync('src/data/shops.json', 'utf8'));
  const therapists = JSON.parse(fs.readFileSync('src/data/therapists.json', 'utf8'));

  console.log(`\n📊 データ診断レポート`);
  console.log(`=========================`);
  console.log(`🏢 店舗総数: ${shops.length} 件`);
  console.log(`👩‍🦰 セラピスト総数: ${therapists.length} 人`);

  // 2. IDのマッピング作成
  const shopIds = new Set(shops.map(s => s.id));
  
  // 3. 迷子のセラピストを探す (存在しない店舗IDを持っている人)
  const orphans = therapists.filter(t => !shopIds.has(t.shop_id));
  
  // 4. セラピスト0の店舗を探す
  const activeShopIds = new Set(therapists.map(t => t.shop_id));
  const emptyShops = shops.filter(s => !activeShopIds.has(s.id));

  console.log(`\n🔍 診断結果`);
  console.log(`-------------------------`);

  if (orphans.length > 0) {
    console.log(`🚨 【異常あり】迷子のセラピスト: ${orphans.length} 人`);
    console.log(`   → 店舗IDが一致せず、表示されていません！`);
    console.log(`   ▼ 迷子の例 (最初の5件):`);
    orphans.slice(0, 5).forEach(t => {
      console.log(`   - 名前: ${t.name}, 持っているshop_id: "${t.shop_id}"`);
      // 近いIDがないか探す簡易ロジック
      const similar = [...shopIds].find(sid => sid.includes(t.shop_id) || t.shop_id.includes(sid));
      if (similar) console.log(`     (もしかして: "${similar}" ?)`);
    });
  } else {
    console.log(`✅ セラピスト側の紐付けデータは正常です (迷子 0人)`);
    console.log(`   → つまり、448店舗は「本当にデータが無い」空っぽの店舗です。`);
  }

  console.log(`\n🏚 ゴースト店舗 (セラピスト0): ${emptyShops.length} 件`);
  if (emptyShops.length > 0) {
    console.log(`   ▼ 例: ${emptyShops[0].name} (ID: ${emptyShops[0].id})`);
  }
  console.log(`=========================\n`);

} catch (e) {
  console.error("エラー:", e.message);
}
