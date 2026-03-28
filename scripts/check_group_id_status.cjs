const fs = require('fs');

const SHOPS_PATH = 'public/data/shops.json';

try {
  if (!fs.existsSync(SHOPS_PATH)) {
    console.error("❌ shops.json が見つかりません");
    process.exit(1);
  }

  const shops = JSON.parse(fs.readFileSync(SHOPS_PATH, 'utf8'));
  const total = shops.length;

  console.log(`📊 店舗データ診断 (全 ${total} 店舗)`);
  console.log("---------------------------------------------------");

  // 1. group_id の有無チェック
  const withGroup = shops.filter(s => s.group_id && s.group_id.trim() !== "");
  const withoutGroup = shops.filter(s => !s.group_id || s.group_id.trim() === "");

  console.log(`✅ group_id あり: ${withGroup.length} 店舗`);
  console.log(`⚠️ group_id なし: ${withoutGroup.length} 店舗`);

  // 2. brandId の有無チェック
  const withBrand = shops.filter(s => s.brandId);
  const withoutBrand = shops.filter(s => !s.brandId);

  if (withoutGroup.length > 0) {
    console.log(`   -> うち、brandIdはある店舗: ${withoutGroup.filter(s => s.brandId).length} 店舗`);
    console.log(`   -> brandIdもない完全迷子:   ${withoutGroup.filter(s => !s.brandId).length} 店舗`);
  }

  // 3. グループ化の実態チェック (ちゃんと束ねられているか？)
  const groupCounts = {};
  withGroup.forEach(s => {
    groupCounts[s.group_id] = (groupCounts[s.group_id] || 0) + 1;
  });

  const multiShopGroups = Object.values(groupCounts).filter(c => c > 1).length;
  const singleShopGroups = Object.values(groupCounts).filter(c => c === 1).length;

  console.log("\n🔗 グループ化の状況:");
  console.log(`   - 複数店舗を持つグループ数: ${multiShopGroups} グループ`);
  console.log(`   - 1店舗だけのグループ数:    ${singleShopGroups} グループ`);

  // 4. サンプル表示 (確認用)
  if (multiShopGroups > 0) {
    // 一番店舗数が多いグループを探す
    const largestGroupId = Object.keys(groupCounts).reduce((a, b) => groupCounts[a] > groupCounts[b] ? a : b);
    const largestGroupShops = shops.filter(s => s.group_id === largestGroupId);
    
    console.log(`\n👀 サンプル確認 (最大グループ: ${largestGroupId})`);
    console.log(`   ブランド名: ${largestGroupShops[0].brandId || largestGroupShops[0].name}`);
    console.log(`   店舗数: ${largestGroupShops.length}`);
    largestGroupShops.slice(0, 3).forEach(s => console.log(`     - ${s.name} (ID: ${s.id})`));
  }

} catch (e) {
  console.error("エラー:", e);
}
