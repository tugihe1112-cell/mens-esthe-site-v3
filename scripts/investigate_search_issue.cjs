const fs = require('fs');
const path = require('path');

const SHOPS_PATH = 'src/data/shops.json';
const SEARCH_PAGE_PATH = 'src/pages/SearchPage.jsx';
const SHOP_LIST_PAGE_PATH = 'src/pages/ShopListPage.jsx';

console.log("🕵️‍♂️ Investigating Search Issue...");
console.log("===================================");

// 1. データ検証: '新宿御苑' の店舗があるか？
try {
  const shops = JSON.parse(fs.readFileSync(SHOPS_PATH, 'utf8'));
  const targetArea = "新宿御苑"; // 例として
  
  const hitShops = shops.filter(s => 
    (s.area && s.area.includes(targetArea)) || 
    (s.address && s.address.includes(targetArea))
  );

  console.log(`\n1. Data Check for '${targetArea}':`);
  if (hitShops.length > 0) {
    console.log(`   ✅ Found ${hitShops.length} shops.`);
    console.log(`   - Example: ${hitShops[0].name} (Area: ${hitShops[0].area})`);
  } else {
    console.log(`   ❌ No shops found matching '${targetArea}'.`);
  }
} catch (e) {
  console.log(`   ❌ Error reading shops.json: ${e.message}`);
}

// 2. ページ検証: SearchPage.jsx は何を検索しているか？
try {
  const content = fs.readFileSync(SEARCH_PAGE_PATH, 'utf8');
  console.log(`\n2. Code Check (SearchPage.jsx):`);
  
  // セラピストの変数が使われているか
  if (content.includes("useShopData()") && content.includes("therapists")) {
    console.log("   👉 Using 'therapists' data source.");
  }
  
  // 店舗の変数が使われているか
  if (content.includes("shops.map") || content.includes("filteredShops")) {
    console.log("   ✅ Contains logic to list Shops.");
  } else {
    console.log("   ❌ NO logic found to list Shops (Looks like Therapist-only page).");
  }

} catch (e) {
  console.log(`   ❌ Error reading SearchPage.jsx: ${e.message}`);
}

// 3. ルーティング検証: 店舗一覧ページはあるか？
if (fs.existsSync(SHOP_LIST_PAGE_PATH)) {
  console.log(`\n3. Routing Check:`);
  console.log(`   ✅ 'src/pages/ShopListPage.jsx' exists.`);
  console.log(`   👉 We should probably link to THIS page for area search.`);
} else {
  console.log(`\n3. Routing Check:`);
  console.log(`   ❌ 'src/pages/ShopListPage.jsx' does NOT exist.`);
}

console.log("\n===================================");
