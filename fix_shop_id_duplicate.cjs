const fs = require('fs-extra');

const main = async () => {
  console.log('🔧 Fixing duplicate shop IDs...');
  
  const shops = await fs.readJson('./public/data/shops.json');
  
  // 西船橋店を見つけてIDを変更
  const updatedShops = shops.map(shop => {
    if (shop.id === 'chiba_funabashi_lynx' && shop.name.includes('西')) {
      console.log(`Renaming: ${shop.name}`);
      console.log(`  ${shop.id} → chiba_nishi_funabashi_lynx`);
      return {
        ...shop,
        id: 'chiba_nishi_funabashi_lynx'
      };
    }
    return shop;
  });
  
  await fs.writeJson('./public/data/shops.json', updatedShops, { spaces: 2 });
  console.log('✅ Fixed!');
};

main().catch(console.error);
