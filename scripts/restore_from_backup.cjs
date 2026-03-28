const fs = require('fs-extra');
const path = require('path');

// 設定：データの場所
const CURRENT_SHOPS_FILE = 'src/data/all_shops.json';
const BACKUP_FILE = 'src/data_backup_final/src_data/all_shops.json';
const DEST_THERAPISTS_FILE = 'src/data/therapists.json';

const main = async () => {
  console.log('💎 Starting Grand Restoration Protocol (v2)...');

  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`❌ Backup file not found at: ${BACKUP_FILE}`);
    process.exit(1);
  }

  // 1. 読み込み
  const currentShopsRaw = await fs.readJson(CURRENT_SHOPS_FILE);
  const backupShopsRaw = await fs.readJson(BACKUP_FILE);

  // ★ここを修正: 配列でもオブジェクトでも配列に統一して扱う
  const currentShops = Array.isArray(currentShopsRaw) ? currentShopsRaw : Object.values(currentShopsRaw);
  const backupShops = Array.isArray(backupShopsRaw) ? backupShopsRaw : Object.values(backupShopsRaw);

  console.log(`📊 Current Shops: ${currentShops.length} stores`);
  console.log(`📦 Backup Data: ${backupShops.length} stores found`); // これでundefinedにならない

  // 2. 名寄せ用辞書作成 (店名 -> 新ID)
  const nameToIdMap = {};
  currentShops.forEach(s => {
    if (s.name) nameToIdMap[s.name.trim()] = s.id;
  });

  const newTherapistList = [];
  let restoredCount = 0;

  // 3. バックアップから抽出
  backupShops.forEach(backupShop => {
    const currentId = nameToIdMap[backupShop.name?.trim()];
    
    // セラピストデータがあり、かつ現在の店舗IDと紐付けられる場合
    if (backupShop.therapists && Array.isArray(backupShop.therapists) && currentId) {
      backupShop.therapists.forEach(t => {
        newTherapistList.push({
          ...t,
          shop_id: currentId, // 新しいIDに書き換え
          id: t.id || `th_${Math.random().toString(36).substr(2, 9)}`
        });
        restoredCount++;
      });
    }
  });

  // 4. 保存
  await fs.writeJson(DEST_THERAPISTS_FILE, newTherapistList, { spaces: 2 });

  console.log('\n✨✨✨ RESTORATION COMPLETE ✨✨✨');
  console.log(`✅ 復元成功: ${restoredCount} 名`);
  console.log(`💾 保存先: ${DEST_THERAPISTS_FILE}`);
};

main().catch(err => console.error(err));
