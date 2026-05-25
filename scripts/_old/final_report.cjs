const fs = require('fs-extra');

const main = async () => {
  const shops = await fs.readJson('./public/data/shops.json');
  const therapists = await fs.readJson('./public/data/therapists.json');
  
  console.log('📊 最終レポート\n');
  console.log('='.repeat(60));
  
  // 0人店舗
  const zeroShops = shops.filter(s => {
    const count = therapists.filter(t => t.shop_id === s.id).length;
    return count === 0;
  });
  
  // セラピストがいる店舗
  const withTherapists = shops.filter(s => {
    const count = therapists.filter(t => t.shop_id === s.id).length;
    return count > 0;
  });
  
  console.log(`総店舗数: ${shops.length}店舗`);
  console.log(`  ✓ セラピストあり: ${withTherapists.length}店舗`);
  console.log(`  ✗ セラピスト0人: ${zeroShops.length}店舗`);
  console.log(`\n総セラピスト数: ${therapists.length}人`);
  
  // ブランド別の統計
  const byBrand = {};
  withTherapists.forEach(shop => {
    const brand = shop.brandId || 'unknown';
    const count = therapists.filter(t => t.shop_id === shop.id).length;
    
    if (!byBrand[brand]) {
      byBrand[brand] = { shops: 0, therapists: 0 };
    }
    byBrand[brand].shops += 1;
    byBrand[brand].therapists += count;
  });
  
  console.log('\n【修正完了した主要ブランド（上位10）】');
  Object.entries(byBrand)
    .sort((a, b) => b[1].shops - a[1].shops)
    .slice(0, 10)
    .forEach(([brand, data]) => {
      console.log(`  ${brand}: ${data.shops}店舗, ${data.therapists}人`);
    });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 作業完了！');
  console.log(`   - 修正された店舗: ${shops.length - zeroShops.length}店舗`);
  console.log(`   - 残り0人店舗: ${zeroShops.length}店舗（再スクレイピング対象）`);
};

main().catch(console.error);
