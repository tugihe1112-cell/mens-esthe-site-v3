import fs from 'fs';
import path from 'path';

function findJsonFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory() && !filePath.includes('backup')) {
      results = results.concat(findJsonFiles(filePath));
    } else if (filePath.endsWith('.json') && !filePath.includes('backup')) {
      results.push(filePath);
    }
  });
  return results;
}

try {
  console.log("🔍 データ構造の綿密な検証を開始します...\n");

  // 1. マスターファイル以外のJSONファイルの検出
  const allJsonFiles = findJsonFiles('src/data');
  const allowedRootFiles = [
    'src/data/all_shops.json', 'src/data/brand_details.json', 
    'src/data/reviews.json', 'src/data/shop_requests.json', 
    'src/data/shops.json', 'src/data/therapists.json', 'src/data/version.json'
  ];
  
  const suspiciousFiles = allJsonFiles.filter(file => !allowedRootFiles.includes(file));
  
  console.log("【1. 不要な個別ファイルの検出】");
  if (suspiciousFiles.length > 0) {
    console.log("以下のファイルは、マスターデータ(shops.json等)と競合する可能性があり、削除または統合が必要です:");
    suspiciousFiles.forEach(f => console.log(`  - ${f}`));
  } else {
    console.log("  ✅ 不審な個別ファイルは見つかりませんでした。");
  }

  // 2. shops.json 内の重複チェック
  console.log("\n【2. shops.json 内のブランド重複チェック】");
  const shopsData = JSON.parse(fs.readFileSync('src/data/shops.json', 'utf-8'));
  const nameMap = new Map();
  const duplicates = new Set();

  shopsData.forEach(shop => {
    const normalizedName = shop.name.replace(/[\s　]+/g, '').toLowerCase();
    if (nameMap.has(normalizedName)) {
      duplicates.add(normalizedName);
      nameMap.get(normalizedName).push(shop.id);
    } else {
      nameMap.set(normalizedName, [shop.id]);
    }
  });

  if (duplicates.size > 0) {
    console.log("以下のブランドが複数のIDで重複登録されています（統合が必要です）:");
    duplicates.forEach(name => {
      console.log(`  - ${name}: [${nameMap.get(name).join(', ')}]`);
    });
  } else {
    console.log("  ✅ 重複登録されているブランドは見つかりませんでした。");
  }

  // 3. therapists.json の孤立チェック
  console.log("\n【3. therapists.json の孤立キャストチェック】");
  const therapistsData = JSON.parse(fs.readFileSync('src/data/therapists.json', 'utf-8'));
  const validShopIds = new Set(shopsData.map(s => s.id));
  const orphanedShopIds = new Set();

  therapistsData.forEach(therapist => {
    if (!validShopIds.has(therapist.shop_id)) {
      orphanedShopIds.add(therapist.shop_id);
    }
  });

  if (orphanedShopIds.size > 0) {
    console.log("以下の shop_id を持つキャストが孤立しています（shops.jsonに該当する店舗がありません）:");
    orphanedShopIds.forEach(id => console.log(`  - ${id}`));
  } else {
    console.log("  ✅ 孤立しているキャストは見つかりませんでした。");
  }

} catch (e) {
  console.error("エラーが発生しました:", e.message);
}
