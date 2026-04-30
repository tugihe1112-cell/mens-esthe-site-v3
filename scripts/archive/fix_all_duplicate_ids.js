import fs from 'fs';

const shops = JSON.parse(fs.readFileSync('public/data/shops.json', 'utf8'));

// 最大IDを取得
let nextId = Math.max(...shops.map(s => s.id).filter(id => id > 0)) + 1;

// IDの使用状況を追跡
const usedIds = new Set();
let fixCount = 0;

const fixedShops = shops.map((shop, index) => {
  // 既に使われているIDか、ID=0の場合は新しいIDを割り当て
  if (usedIds.has(shop.id) || shop.id === 0) {
    const oldId = shop.id;
    shop.id = nextId;
    console.log(`[${fixCount + 1}] ID ${oldId} → ${nextId}: ${shop.name} (${shop.area || shop.city})`);
    nextId++;
    fixCount++;
  }
  usedIds.add(shop.id);
  return shop;
});

fs.writeFileSync('public/data/shops.json', JSON.stringify(fixedShops, null, 2));
console.log(`\n✅ 修正完了！`);
console.log(`修正した店舗: ${fixCount}`);
console.log(`合計店舗数: ${fixedShops.length}`);
console.log(`すべて一意のID: ${usedIds.size}`);
