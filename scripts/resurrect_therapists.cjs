const fs = require('fs');
const path = require('path');

// ファイルパス設定
const CURRENT_SHOPS_PATH = 'src/data/shops.json';
const BACKUP_SHOPS_PATH = 'src/data/all_shops.json.bak'; // ここに遺産があるはず
const CURRENT_THERAPISTS_PATH = 'src/data/therapists.json';

try {
  console.log("💎 THE RESURRECTION PROTOCOL STARTED 💎");

  // 1. データの読み込み
  if (!fs.existsSync(BACKUP_SHOPS_PATH)) {
    throw new Error(`バックアップファイル (${BACKUP_SHOPS_PATH}) が見つかりません！`);
  }

  const currentShops = JSON.parse(fs.readFileSync(CURRENT_SHOPS_PATH, 'utf8'));
  const backupShops = JSON.parse(fs.readFileSync(BACKUP_SHOPS_PATH, 'utf8'));
  const currentTherapists = JSON.parse(fs.readFileSync(CURRENT_THERAPISTS_PATH, 'utf8'));

  console.log(`- 現在の店舗数: ${currentShops.length}`);
  console.log(`- バックアップの店舗数: ${backupShops.length}`);
  console.log(`- 現在のセラピスト数: ${currentTherapists.length}`);

  // 2. 現在「0人」の店舗IDを特定
  const activeShopIds = new Set(currentTherapists.map(t => t.shop_id));
  const ghostShops = currentShops.filter(s => !activeShopIds.has(s.id));
  console.log(`- 救出対象のゴースト店舗: ${ghostShops.length} 件`);

  // 3. 救出作戦開始
  let rescuedCount = 0;
  let newTherapists = [];

  ghostShops.forEach(ghost => {
    // バックアップから同じ名前の店舗を探す
    // (IDが変わっている可能性があるので、名前やURLで照合するのが確実だが、一旦ID照合を試みる)
    let originalData = backupShops.find(b => b.id === ghost.id);
    
    // IDで見つからない場合、名前で探す（バイブルの教え: IDは変わる可能性がある）
    if (!originalData) {
      originalData = backupShops.find(b => b.name === ghost.name);
    }

    // 古いデータの中に 'threads' (セラピストリスト) があるか確認
    if (originalData && Array.isArray(originalData.threads) && originalData.threads.length > 0) {
      // 救出！
      originalData.threads.forEach((t, index) => {
        // 新しいセラピストオブジェクトを作成
        const newTherapist = {
          id: t.id || `rescued_${ghost.id}_${index}`,
          shop_id: ghost.id, // ★ここで現在の店舗IDに強制紐付け (バイブル第2部門)
          name: t.name || "不明なセラピスト",
          age: t.age || 0,
          height: t.height,
          bust: t.bust,
          cup: t.cup,
          waist: t.waist,
          hip: t.hip,
          image: t.image || "/images/therapist/no_image.jpg",
          description: t.description || "",
          threads: t.threads || [] // レビューなど
        };
        newTherapists.push(newTherapist);
        rescuedCount++;
      });
    }
  });

  // 4. 合体と保存
  if (rescuedCount > 0) {
    const mergedTherapists = [...currentTherapists, ...newTherapists];
    
    // srcに保存
    fs.writeFileSync(CURRENT_THERAPISTS_PATH, JSON.stringify(mergedTherapists, null, 2));
    
    // publicにも即反映 (バイブル第1部門: migrateの手間を省く)
    const PUBLIC_THERAPISTS_PATH = 'public/data/therapists.json';
    if (!fs.existsSync('public/data')) fs.mkdirSync('public/data');
    fs.writeFileSync(PUBLIC_THERAPISTS_PATH, JSON.stringify(mergedTherapists, null, 2));

    console.log(`\n🎉 復活成功！ ${rescuedCount} 人のセラピストを救出しました！`);
    console.log(`📁 ファイルを更新しました: ${CURRENT_THERAPISTS_PATH}`);
  } else {
    console.log("\n⚠️ 救出可能なセラピストが見つかりませんでした。バックアップの中身も空の可能性があります。");
  }

} catch (e) {
  console.error("\n❌ 復活失敗:", e.message);
}
