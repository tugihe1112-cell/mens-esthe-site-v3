import fs from 'fs';

try {
  console.log('🔧 ローカルJSONの紐付けを修復します...');
  const shopsPath = 'public/data/shops.json';
  const therapistsPath = 'public/data/therapists.json';

  const shops = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));
  const therapists = JSON.parse(fs.readFileSync(therapistsPath, 'utf8'));

  const ts = Array.isArray(therapists) ? therapists : therapists.therapists || [];
  const sl = Array.isArray(shops) ? shops : shops.shops || [];

  // shop_idごとにセラピストIDをリスト化
  const byShopId = {};
  ts.forEach(t => {
    const sid = t.shop_id || t.shopId;
    if (sid) {
      if (!byShopId[sid]) byShopId[sid] = [];
      byShopId[sid].push(t.id);
    }
  });

  const targets = [
    'tokyo_shinagawa_gotanda_yuru_spa',
    'tokyo_setagaya_futakotamagawa_mens_esthe_group'
  ];

  let fixed = 0;
  sl.forEach(shop => {
    if (targets.includes(shop.id)) {
      const correctIds = byShopId[shop.id] || [];
      console.log(`📝 ${shop.name} (ID: ${shop.id})`);
      console.log(`   → 修正前: ${shop.therapists ? shop.therapists.length : 0}名`);
      shop.therapists = correctIds;
      console.log(`   → 修正後: ${correctIds.length}名 に紐付け直しました！`);
      fixed++;
    }
  });

  fs.writeFileSync(shopsPath, JSON.stringify(shops, null, 2));
  console.log(`\n✅ public/data/shops.json の修正完了 (${fixed}店舗)`);

} catch (e) {
  console.error('❌ エラー:', e.message);
}
