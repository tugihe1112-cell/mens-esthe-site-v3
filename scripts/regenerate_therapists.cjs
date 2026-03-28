const fs = require('fs-extra');
const path = require('path');

// パス設定
const DATA_DIR = path.join(__dirname, '../src/data');
const PUBLIC_DIR = path.join(__dirname, '../public/data');
const BACKUP_FILE = path.join(DATA_DIR, 'all_shops.json.bak');
const CURRENT_SHOPS_FILE = path.join(DATA_DIR, 'all_shops.json');
const CURRENT_THERAPISTS_FILE = path.join(DATA_DIR, 'therapists.json');

const main = async () => {
  console.log('♻️ Starting Therapist Regeneration from Backup...');

  if (!await fs.pathExists(BACKUP_FILE)) {
    console.error('❌ Backup file missing.');
    process.exit(1);
  }

  const oldShops = await fs.readJson(BACKUP_FILE);
  const currentShops = await fs.readJson(CURRENT_SHOPS_FILE);

  // 店名 -> 新ID の辞書作成
  const nameToNewShop = {};
  currentShops.forEach(shop => {
    if (shop.name) nameToNewShop[shop.name] = shop;
  });

  let newTherapistsList = [];
  
  oldShops.forEach(oldShop => {
    const newShop = nameToNewShop[oldShop.name];
    if (!newShop) return;

    const members = oldShop.therapists || [];
    if (Array.isArray(members) && members.length > 0) {
      members.forEach((member, index) => {
        if (typeof member === 'object' && member.name) {
          const newTherapist = {
            ...member,
            id: `${newShop.id}_th_${index + 1}`, // 新ID発行
            shop_id: newShop.id,
            group_id: newShop.group_id
          };
          newTherapistsList.push(newTherapist);
        }
      });
    }
  });

  // 店舗側のリスト更新
  const fixedShops = currentShops.map(shop => {
    const myTherapists = newTherapistsList
      .filter(t => t.shop_id === shop.id)
      .map(t => t.id);
    return { ...shop, therapists: myTherapists };
  });

  await fs.writeJson(CURRENT_THERAPISTS_FILE, newTherapistsList, { spaces: 2 });
  await fs.writeJson(CURRENT_SHOPS_FILE, fixedShops, { spaces: 2 });
  await fs.ensureDir(PUBLIC_DIR);
  await fs.writeJson(path.join(PUBLIC_DIR, 'therapists.json'), newTherapistsList, { spaces: 2 });
  await fs.writeJson(path.join(PUBLIC_DIR, 'all_shops.json'), fixedShops, { spaces: 2 });

  console.log(`✅ Regenerated ${newTherapistsList.length} therapists.`);
};

main();
