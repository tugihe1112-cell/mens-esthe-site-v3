const fs = require('fs-extra');

const main = async () => {
  const shops = await fs.readJson('./public/data/shops.json');
  const therapists = await fs.readJson('./public/data/therapists.json');
  
  // 0人店舗を抽出
  const zeroShops = shops.filter(shop => {
    const count = therapists.filter(t => t.shop_id === shop.id).length;
    return count === 0;
  });
  
  console.log(`\n🔍 0人店舗の分析: ${zeroShops.length}件\n`);
  
  // brandIdでグループ化
  const byBrand = {};
  zeroShops.forEach(shop => {
    const brand = shop.brandId || 'unknown';
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(shop);
  });
  
  // ブランドごとに集計
  console.log('【ブランド別の0人店舗数】');
  Object.entries(byBrand)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([brand, shops]) => {
      console.log(`  ${brand}: ${shops.length}店舗`);
      shops.slice(0, 3).forEach(s => {
        console.log(`    - ${s.name} (${s.id})`);
      });
      if (shops.length > 3) {
        console.log(`    ... and ${shops.length - 3} more`);
      }
    });
  
  // 各ブランドでセラピストがいる店舗を探す
  console.log('\n【基準店舗の候補】');
  for (const [brand, zeroShopList] of Object.entries(byBrand)) {
    const allBrandShops = shops.filter(s => s.brandId === brand);
    const withTherapists = allBrandShops.filter(s => {
      const count = therapists.filter(t => t.shop_id === s.id).length;
      return count > 0;
    });
    
    if (withTherapists.length > 0) {
      const baseShop = withTherapists[0];
      const count = therapists.filter(t => t.shop_id === baseShop.id).length;
      console.log(`  ✓ ${brand}: ${baseShop.id} (${count}人) → ${zeroShopList.length}店舗にコピー可能`);
    } else {
      console.log(`  ✗ ${brand}: 基準店舗なし (全店舗0人)`);
    }
  }
};

main().catch(console.error);
