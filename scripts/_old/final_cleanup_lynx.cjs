const fs = require('fs-extra');

const main = async () => {
  console.log('🔥 Final cleanup of all Lynx therapists...');
  
  const therapists = await fs.readJson('./public/data/therapists.json');
  
  // Lynx以外のセラピストを保持
  const nonLynx = therapists.filter(t => !t.shop_id || !t.shop_id.includes('lynx'));
  console.log(`Non-Lynx therapists: ${nonLynx.length}`);
  
  // 基準となる秋葉原店のセラピスト（重複なし）
  const baseTherapists = therapists.filter(t => t.shop_id === 'tokyo_chiyoda_akihabara_lynx');
  const uniqueBase = [];
  const seenNames = new Set();
  
  baseTherapists.forEach(t => {
    if (!seenNames.has(t.name)) {
      seenNames.add(t.name);
      uniqueBase.push(t);
    }
  });
  
  console.log(`Unique base therapists: ${uniqueBase.length}`);
  
  // Lynx全店舗のリスト
  const lynxShopIds = [
    'chiba_chiba_lynx',
    'chiba_funabashi_lynx',
    'chiba_nishi_funabashi_lynx',
    'chiba_matsudo_lynx',
    'kanagawa_yokohama_lynx',
    'saitama_kawaguchi_lynx',
    'saitama_saitama_lynx',
    'tokyo_chiyoda_akihabara_lynx',
    'tokyo_kita_lynx',
    'tokyo_shinagawa_gotanda_lynx',
    'tokyo_shinjuku_shinjuku_lynx',
    'tokyo_shinjuku_takadanobaba_lynx',
    'tokyo_toshima_ikebukuro_lynx'
  ];
  
  // 各店舗に同じセラピストをコピー
  const allLynxTherapists = [];
  
  lynxShopIds.forEach(shopId => {
    const shopTherapists = uniqueBase.map(t => ({
      ...t,
      id: `${shopId}_${t.name.replace(/\s/g, '_')}`,
      shop_id: shopId
    }));
    allLynxTherapists.push(...shopTherapists);
    console.log(`  ${shopId}: ${shopTherapists.length} therapists`);
  });
  
  // 統合
  const finalTherapists = [...nonLynx, ...allLynxTherapists];
  
  await fs.writeJson('./public/data/therapists.json', finalTherapists, { spaces: 2 });
  
  console.log('\n✅ Final cleanup complete!');
  console.log(`  Total: ${finalTherapists.length}`);
  console.log(`  Lynx: ${allLynxTherapists.length} (${lynxShopIds.length} shops × ${uniqueBase.length})`);
  console.log(`  Others: ${nonLynx.length}`);
};

main().catch(console.error);
