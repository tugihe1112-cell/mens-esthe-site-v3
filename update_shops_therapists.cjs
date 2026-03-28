const fs = require('fs-extra');

const main = async () => {
  console.log('📝 Updating shops.json with therapist lists...');
  
  const therapists = await fs.readJson('./public/data/therapists.json');
  const shops = await fs.readJson('./public/data/shops.json');
  
  const updatedShops = shops.map(shop => {
    const shopTherapists = therapists
      .filter(t => t.shop_id === shop.id)
      .map(t => ({ id: t.id, name: t.name }));
    
    return {
      ...shop,
      therapists: shopTherapists
    };
  });
  
  await fs.writeJson('./public/data/shops.json', updatedShops, { spaces: 2 });
  
  console.log('✅ Updated shops.json');
  
  // Lynx店舗の確認
  const lynxShops = updatedShops.filter(s => s.name.includes('Lynx'));
  console.log('\n【Lynx店舗のセラピスト数】');
  lynxShops.forEach(s => {
    console.log(`  ${s.id}: ${s.therapists.length}人`);
  });
};

main().catch(console.error);
