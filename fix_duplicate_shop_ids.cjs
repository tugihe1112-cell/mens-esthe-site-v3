const fs = require('fs-extra');

const main = async () => {
  console.log('🔍 Detecting and fixing duplicate shop IDs...\n');
  
  const shops = await fs.readJson('./public/data/shops.json');
  const therapists = await fs.readJson('./public/data/therapists.json');
  
  // IDの出現回数をカウント
  const idCounts = {};
  shops.forEach(shop => {
    idCounts[shop.id] = (idCounts[shop.id] || 0) + 1;
  });
  
  // 重複IDを特定
  const duplicateIds = Object.entries(idCounts)
    .filter(([id, count]) => count > 1)
    .map(([id]) => id);
  
  console.log(`Found ${duplicateIds.length} duplicate IDs:\n`);
  duplicateIds.forEach(id => {
    const dupes = shops.filter(s => s.id === id);
    console.log(`📍 ${id} (${idCounts[id]} shops):`);
    dupes.forEach(s => console.log(`   - ${s.name}`));
    console.log('');
  });
  
  // ID変更のマッピング
  const idMapping = {}; // old_id -> new_id
  const updatedShops = [];
  const seenIds = new Set();
  
  shops.forEach(shop => {
    let newId = shop.id;
    
    // このIDが重複している場合
    if (idCounts[shop.id] > 1) {
      // 既に同じIDを処理済みの場合、サフィックスを追加
      if (seenIds.has(shop.id)) {
        // 店舗名から特徴を抽出してサフィックスを作成
        let suffix = '';
        
        // 「本館」「別邸」「A」「B」などが名前に含まれているか
        if (shop.name.includes('本館') || shop.name.includes('メイン')) {
          suffix = '_main';
        } else if (shop.name.includes('別邸') || shop.name.includes('annex')) {
          suffix = '_annex';
        } else if (shop.name.includes('西')) {
          suffix = '_nishi';
        } else if (shop.name.includes('東')) {
          suffix = '_higashi';
        } else if (shop.name.includes('南')) {
          suffix = '_minami';
        } else if (shop.name.includes('北')) {
          suffix = '_kita';
        } else {
          // 既存の同ID店舗数を数えて連番
          const existingCount = updatedShops.filter(s => 
            s.id.startsWith(shop.id)
          ).length;
          suffix = `_${existingCount + 1}`;
        }
        
        newId = `${shop.id}${suffix}`;
        console.log(`🔄 Renaming: ${shop.name}`);
        console.log(`   ${shop.id} → ${newId}`);
      }
      
      idMapping[shop.id] = newId;
    }
    
    seenIds.add(shop.id);
    updatedShops.push({
      ...shop,
      id: newId
    });
  });
  
  // therapists.jsonのshop_idも更新
  console.log('\n🔄 Updating therapist shop_ids...');
  const updatedTherapists = therapists.map(t => {
    // この therapist の shop_id が変更されたか？
    const oldShopId = t.shop_id;
    
    // idMappingから新しいIDを探す
    // 同じ元IDから複数の新IDが生成されている場合は、therapistのIDに含まれる情報から判断
    const possibleNewIds = Object.entries(idMapping)
      .filter(([old, newId]) => old === oldShopId)
      .map(([old, newId]) => newId);
    
    if (possibleNewIds.length === 0) {
      return t; // 変更なし
    }
    
    // therapist.id から店舗IDを抽出（therapist.idは shop_id + "_" + name 形式）
    let newShopId = oldShopId;
    
    // 複数の新IDがある場合、therapist.idに含まれる情報から判断
    if (possibleNewIds.length > 1) {
      // therapist.idが既に新しいIDの形式になっているか確認
      for (const possibleId of possibleNewIds) {
        if (t.id.startsWith(possibleId)) {
          newShopId = possibleId;
          break;
        }
      }
      
      // まだ見つからない場合は、therapist名から推測
      if (newShopId === oldShopId) {
        // とりあえず最初のIDを使用（後で手動調整が必要かも）
        newShopId = possibleNewIds[0];
      }
    } else {
      newShopId = possibleNewIds[0];
    }
    
    // therapist.idも更新（shop_id部分を置換）
    const newTherapistId = t.id.replace(oldShopId, newShopId);
    
    return {
      ...t,
      id: newTherapistId,
      shop_id: newShopId
    };
  });
  
  // 保存
  await fs.writeJson('./public/data/shops.json', updatedShops, { spaces: 2 });
  await fs.writeJson('./public/data/therapists.json', updatedTherapists, { spaces: 2 });
  
  console.log('\n✅ Fixed!');
  console.log(`   Updated shops: ${updatedShops.length}`);
  console.log(`   Updated therapists: ${updatedTherapists.length}`);
  console.log(`   ID mappings: ${Object.keys(idMapping).length}`);
};

main().catch(console.error);
