const fs = require('fs-extra');
const path = require('path');

const PUBLIC_SHOPS_PATH = 'public/data/shops.json';
const SRC_SHOPS_PATH = 'src/data/shops.json';
const THERAPISTS_PATH = 'public/data/therapists.json';
const SRC_THERAPISTS_PATH = 'src/data/therapists.json';

const main = async () => {
  console.log('🚀 Starting Group ID Unification...');

  try {
    const shops = await fs.readJson(PUBLIC_SHOPS_PATH);
    const therapists = await fs.readJson(THERAPISTS_PATH);

    // 1. ブランドごとの「正解グループID」を決める
    // (最も多くの店舗が所属している group_id を正解とする)
    const brandGroups = {}; // { brandId: { groupId: count } }

    shops.forEach(s => {
      if (!s.brandId || !s.group_id) return;
      
      if (!brandGroups[s.brandId]) {
        brandGroups[s.brandId] = {};
      }
      const gid = s.group_id;
      brandGroups[s.brandId][gid] = (brandGroups[s.brandId][gid] || 0) + 1;
    });

    // 各ブランドの「代表ID」を決定
    const brandMasterMap = {}; // { brandId: 'g_correct_id' }
    
    Object.keys(brandGroups).forEach(brandId => {
      const groups = brandGroups[brandId];
      // カウントが最大のIDを探す
      const bestGroupId = Object.keys(groups).reduce((a, b) => groups[a] > groups[b] ? a : b);
      brandMasterMap[brandId] = bestGroupId;
    });

    console.log(`📋 ${Object.keys(brandMasterMap).length} ブランドの代表グループIDを特定しました。`);

    // 2. 店舗データの更新
    let shopUpdateCount = 0;
    const newShops = shops.map(s => {
      if (!s.brandId) return s;
      
      const correctGroupId = brandMasterMap[s.brandId];
      if (s.group_id !== correctGroupId) {
        shopUpdateCount++;
        return { ...s, group_id: correctGroupId };
      }
      return s;
    });

    // 3. セラピストデータの更新 (店舗のgroup_id変更に合わせて追従)
    // ※ セラピスト側も group_id を持っている場合があるため
    let therapistUpdateCount = 0;
    const newTherapists = therapists.map(t => {
      // 所属店舗を探す
      const parentShop = newShops.find(s => s.id === t.shop_id);
      if (parentShop && t.group_id !== parentShop.group_id) {
        therapistUpdateCount++;
        return { ...t, group_id: parentShop.group_id };
      }
      return t;
    });

    // 4. 保存
    console.log(`💾 Saving changes...`);
    console.log(`   - Modified Shops: ${shopUpdateCount}`);
    console.log(`   - Modified Therapists: ${therapistUpdateCount}`);

    await fs.writeJson(PUBLIC_SHOPS_PATH, newShops, { spaces: 2 });
    await fs.writeJson(SRC_SHOPS_PATH, newShops, { spaces: 2 });
    
    await fs.writeJson(THERAPISTS_PATH, newTherapists, { spaces: 2 });
    await fs.writeJson(SRC_THERAPISTS_PATH, newTherapists, { spaces: 2 });

    console.log(`✅ Unification Complete!`);

  } catch (e) {
    console.error('❌ Error:', e);
  }
};

main();
