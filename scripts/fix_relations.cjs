const fs = require('fs-extra');
const path = require('path');

// ファイルパス設定
const DATA_DIR = path.join(__dirname, '../src/data');
const PUBLIC_DIR = path.join(__dirname, '../public/data');
const BACKUP_FILE = path.join(DATA_DIR, 'all_shops.json.bak');
const CURRENT_SHOPS_FILE = path.join(DATA_DIR, 'all_shops.json');
const CURRENT_THERAPISTS_FILE = path.join(DATA_DIR, 'therapists.json');

const main = async () => {
  console.log('🚑 Starting Data Relation Repair (Safe Mode)...');

  // 1. データ読み込み
  if (!await fs.pathExists(BACKUP_FILE)) {
    console.error('❌ Backup file missing. Cannot map IDs.');
    process.exit(1);
  }

  const oldShops = await fs.readJson(BACKUP_FILE);
  const currentShops = await fs.readJson(CURRENT_SHOPS_FILE);
  const rawTherapists = await fs.readJson(CURRENT_THERAPISTS_FILE);

  // ★ここでデータの形を安全に整える (配列じゃなかったら配列に変換)
  let therapists = [];
  if (Array.isArray(rawTherapists)) {
    therapists = rawTherapists;
  } else if (rawTherapists.therapists && Array.isArray(rawTherapists.therapists)) {
    therapists = rawTherapists.therapists;
  } else {
    // オブジェクト形式なら配列に変換
    therapists = Object.values(rawTherapists);
  }

  console.log(`Loaded: ${oldShops.length} Old Shops, ${currentShops.length} Current Shops, ${therapists.length} Therapists`);

  if (therapists.length === 0) {
    console.log('⚠️ No therapists found to fix.');
    return;
  }

  // 2. ID変換マップ作成
  const nameToNewId = {};
  currentShops.forEach(shop => {
    if (shop.name) nameToNewId[shop.name] = shop.id;
  });

  const idMap = {};
  oldShops.forEach(oldShop => {
    const newId = nameToNewId[oldShop.name];
    if (newId && oldShop.id) idMap[oldShop.id] = newId;
  });

  // 3. セラピストデータの修正
  let fixedCount = 0;
  const fixedTherapists = therapists.map(t => {
    if (t.shop_id && idMap[t.shop_id]) {
      if (t.shop_id === idMap[t.shop_id]) return t;
      fixedCount++;
      return { ...t, shop_id: idMap[t.shop_id] };
    }
    return t;
  });

  // 4. 店舗データのtherapists配列も更新
  const fixedShops = currentShops.map(shop => {
    const myTherapists = fixedTherapists
      .filter(t => t.shop_id === shop.id)
      .map(t => t.id);
    
    return { ...shop, therapists: myTherapists };
  });

  // 5. 保存
  await fs.writeJson(CURRENT_THERAPISTS_FILE, fixedTherapists, { spaces: 2 });
  await fs.writeJson(CURRENT_SHOPS_FILE, fixedShops, { spaces: 2 });
  
  await fs.ensureDir(PUBLIC_DIR);
  await fs.writeJson(path.join(PUBLIC_DIR, 'therapists.json'), fixedTherapists, { spaces: 2 });
  await fs.writeJson(path.join(PUBLIC_DIR, 'all_shops.json'), fixedShops, { spaces: 2 });

  console.log(`✅ Repair Complete! Fixed ${fixedCount} therapist links.`);
};

main();
