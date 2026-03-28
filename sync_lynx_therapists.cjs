const fs = require('fs-extra');
const path = require('path');

const THERAPISTS_FILE = './public/data/therapists.json';
const SHOPS_FILE = './public/data/shops.json';

const main = async () => {
  console.log('🔄 Syncing Lynx therapists across all branches...');

  const therapists = await fs.readJson(THERAPISTS_FILE);
  const shops = await fs.readJson(SHOPS_FILE);

  // Lynx店舗を取得
  const lynxShops = shops.filter(s => s.name.includes('Lynx'));
  
  console.log(`\nFound ${lynxShops.length} Lynx shops:`);
  lynxShops.forEach(s => console.log(`  - ${s.id}: ${s.name}`));

  // 東京店舗のセラピストを取得（秋葉原店を基準にする）
  const baseShopId = 'tokyo_chiyoda_akihabara_lynx';
  const baseTherapists = therapists.filter(t => t.shop_id === baseShopId);
  
  console.log(`\n✓ Base shop (${baseShopId}) has ${baseTherapists.length} therapists`);

  // 全Lynx店舗にコピー
  const newTherapists = [];
  
  lynxShops.forEach(shop => {
    const existing = therapists.filter(t => t.shop_id === shop.id);
    
    if (existing.length > 0) {
      console.log(`  ✓ ${shop.id}: already has ${existing.length} therapists (keeping)`);
      newTherapists.push(...existing);
    } else {
      console.log(`  + ${shop.id}: adding ${baseTherapists.length} therapists`);
      
      // セラピストをコピー（shop_idのみ変更）
      const copied = baseTherapists.map(t => ({
        ...t,
        id: `${shop.id}_${t.name.replace(/\s/g, '_')}`,
        shop_id: shop.id
      }));
      
      newTherapists.push(...copied);
    }
  });

  // Lynx以外のセラピストも追加
  const nonLynxTherapists = therapists.filter(t => 
    !t.shop_id || !t.shop_id.includes('lynx')
  );
  
  const allTherapists = [...nonLynxTherapists, ...newTherapists];

  // 保存
  await fs.writeJson(THERAPISTS_FILE, allTherapists, { spaces: 2 });
  
  console.log(`\n✅ Complete! Total therapists: ${allTherapists.length}`);
  console.log(`   - Lynx: ${newTherapists.length}`);
  console.log(`   - Others: ${nonLynxTherapists.length}`);
};

main().catch(console.error);
