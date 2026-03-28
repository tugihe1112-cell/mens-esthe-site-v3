const fs = require('fs-extra');

const BRAND_MAPPINGS = {
  limited_spa: 'tokyo_sumida_kinshicho_limited_spa',
  levechi_esthe: 'tokyo_shibuya_hatsudai_levechi_esthe',
  doigt_de_fee: 'tokyo_ota_kamata_doigt_de_fee',
  hoozuki: 'tokyo_shinagawa_oimachi_hoozuki',
  luxury_romance: 'tokyo_fuchu_luxury_romance',
  platinum_tokyo: 'tokyo_chofu_platinum_tokyo',
  himitsu_mrs_room: 'saitama_saitama-minami_himitsu_mrs_room',
  ranpu_kitasenju: 'tokyo_adachi_ushida_ranpu_kitasenju',
  rondo: 'tokyo_koto_monzennakacho_rondo',
  aromamore: 'tokyo_toshima_ikebukuro_aromamore',
  grand_aroma: 'tokyo_minato_akasaka_grand_aroma',
  rabbit_spa: 'kanagawa_atsugi_rabbit_spa',
  tokyopla: 'tokyo_tachikawa_tachikawa_tokyopla',
  crest_spa_tokyo: 'tokyo_tachikawa_crest_spa_tokyo',
  yorimichi: 'tokyo_suginami_ogikubo_yorimichi',
  ryugujo: 'shizuoka_numazu_ryugujo',
  tokyo_esthe_club: 'tokyo_setagaya_sakurashinmachi_tokyo_esthe_club',
  mens_esthe_group: 'tokyo_shinagawa_musashikoyama_mens_esthe_group',
  dahlia: 'tokyo_shinagawa_oimachi_dahlia',
  grace: 'tokyo_shinagawa_shinagawa_grace',
  aqua: 'tokyo_shibuya_ebisu_aqua',
  kami_no_esthe: 'chiba_matsudo_kami_no_esthe',
  aroma_charmant: 'tokyo_suginami_ogikubo_aroma_charmant',
  tokyo_mensesthe: 'tokyo_meguro_toritsudaigaku_tokyo_mensesthe',
  aroma_modeste: 'tokyo_shinjuku_higashishinjuku_aroma_modeste',
  reve_spa: 'tokyo_shibuya_sasazuka_reve_spa',
  queens_collection: 'tokyo_chiyoda_jimbocho_queens_collection',
  yuru_spa: 'kanagawa_kannai_yuru_spa',
  be_majo: 'tokyo_arakawa_nippori_be_majo',
  e_komachi: 'tokyo_chiyoda_yotsuya_e_komachi'
};

const main = async () => {
  console.log('🚀 Bulk syncing all brands...\n');
  
  const shops = await fs.readJson('./public/data/shops.json');
  const therapists = await fs.readJson('./public/data/therapists.json');
  
  let totalAdded = 0;
  const newTherapists = [...therapists];
  
  for (const [brandId, baseShopId] of Object.entries(BRAND_MAPPINGS)) {
    // 基準店舗のセラピストを取得
    const baseTherapists = therapists.filter(t => t.shop_id === baseShopId);
    
    if (baseTherapists.length === 0) {
      console.log(`⚠️  ${brandId}: No therapists in base shop ${baseShopId}`);
      continue;
    }
    
    // 同じブランドの0人店舗を探す
    const zeroShops = shops.filter(s => {
      if (s.brandId !== brandId) return false;
      const count = therapists.filter(t => t.shop_id === s.id).length;
      return count === 0;
    });
    
    if (zeroShops.length === 0) {
      console.log(`✓ ${brandId}: No zero shops (already complete)`);
      continue;
    }
    
    console.log(`📋 ${brandId}: Copying ${baseTherapists.length} therapists to ${zeroShops.length} shops`);
    
    // 各店舗にコピー
    zeroShops.forEach(shop => {
      const copied = baseTherapists.map(t => ({
        ...t,
        id: `${shop.id}_${t.name.replace(/\s/g, '_')}`,
        shop_id: shop.id
      }));
      
      newTherapists.push(...copied);
      totalAdded += copied.length;
      console.log(`   + ${shop.id}: ${copied.length} therapists`);
    });
  }
  
  // 保存
  await fs.writeJson('./public/data/therapists.json', newTherapists, { spaces: 2 });
  
  console.log(`\n✅ Bulk sync complete!`);
  console.log(`   Total therapists added: ${totalAdded}`);
  console.log(`   Total therapists: ${newTherapists.length}`);
};

main().catch(console.error);
