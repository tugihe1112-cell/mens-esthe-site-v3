const fs = require('fs');

// 安全に文字列化するヘルパー
const safeStr = (val) => (val ? String(val).toLowerCase() : '');

// テスト用ロジック (utilsと同じ修正を適用)
const performSearch = (shops, query) => {
  if (!query) return { type: 'all' };
  const normalizedQuery = query.toLowerCase().trim();
  
  // フィルタ
  const matchedShops = shops.filter(shop => {
    const name = safeStr(shop.name);
    const brand = safeStr(shop.brandId);
    const area = safeStr(shop.area);
    return name.includes(normalizedQuery) || brand.includes(normalizedQuery) || area.includes(normalizedQuery);
  });
  
  if (matchedShops.length === 0) return { type: 'empty', count: 0 };
  
  // グルーピング
  const groupCounts = matchedShops.reduce((acc, shop) => {
    if (shop.group_id) acc[shop.group_id] = (acc[shop.group_id] || 0) + 1;
    return acc;
  }, {});

  let maxCount = 0;
  let dominantGroupId = null;
  Object.entries(groupCounts).forEach(([gid, c]) => { 
      if(c > maxCount) { maxCount = c; dominantGroupId = gid; } 
  });
  
  const dominanceRate = maxCount / matchedShops.length;
  
  if (dominanceRate >= 0.8 && matchedShops.length > 1) {
    return { type: 'brand', count: matchedShops.length, groupId: dominantGroupId, rate: dominanceRate };
  }
  return { type: 'shop', count: matchedShops.length, rate: dominanceRate };
};

// 実データ読み込み
try {
  const shops = JSON.parse(fs.readFileSync('public/data/shops.json', 'utf8'));

  console.log("🧪 検索ロジック検証テスト");
  console.log("---------------------------------------------------");

  // ケース1: ブランド名「doigt de fee」で検索
  const res1 = performSearch(shops, "doigt de fee");
  console.log(`🔎 Query: "doigt de fee"`);
  console.log(`   結果: ${res1.type.toUpperCase()} モード`);
  console.log(`   件数: ${res1.count} 件`);
  console.log(`   占有率: ${(res1.rate * 100).toFixed(1)}%`);
  if (res1.type === 'brand') console.log("   ✅ OK: ブランドモードになりました");
  else console.log("   ❌ NG: 店舗モードになってしまいました");

  console.log("---------------------------------------------------");

  // ケース2: エリア名「川崎」で検索
  const res2 = performSearch(shops, "川崎");
  console.log(`🔎 Query: "川崎"`);
  console.log(`   結果: ${res2.type.toUpperCase()} モード`);
  console.log(`   件数: ${res2.count} 件`);
  if (res2.type === 'shop') console.log("   ✅ OK: 店舗リストモードになりました");
  else console.log("   ⚠️ 注意: 特定ブランドが川崎を支配しています (Brandモード)");

  console.log("---------------------------------------------------");

} catch (e) {
  console.error("エラー:", e);
}
