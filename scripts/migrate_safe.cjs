const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

// 設定
const SRC_DIR = path.join(__dirname, '../src/data');
const OUT_DIR = path.join(__dirname, '../public/data');

// ハッシュ生成関数 (IDがない場合の予備用)
const createHash = (str) => crypto.createHash('md5').update(str).digest('hex');

const main = async () => {
  console.log('🚀 Starting Safe Migration (ID Preservation Mode)...');
  
  // ディレクトリ初期化
  await fs.ensureDir(OUT_DIR);

  // --- 1. 店舗データの処理 ---
  // shops.json または all_shops.json を読み込む
  const shopsFile = await fs.pathExists(path.join(SRC_DIR, 'shops.json')) 
    ? 'shops.json' 
    : 'all_shops.json';
    
  console.log(`📖 Reading shops from ${shopsFile}...`);
  const rawShops = await fs.readJson(path.join(SRC_DIR, shopsFile));

  const shops = rawShops.map(shop => {
    // 【最重要】既存のIDがあればそれを絶対優先する
    // IDがない場合のみ、店名からハッシュを生成する
    const finalId = shop.id || `shop_${createHash(shop.name).slice(0, 8)}`;
    
    // グループID: 既存があれば維持、なければIDベースで生成
    const groupId = shop.group_id || `g_${createHash('group:' + finalId).slice(0, 8)}`;

    return {
      ...shop,
      id: finalId,       // 固定IDを維持
      group_id: groupId  // グループID
    };
  });

  // --- 2. セラピストデータの処理 ---
  console.log('📖 Reading therapists...');
  const rawTherapists = await fs.readJson(path.join(SRC_DIR, 'therapists.json'));

  const therapists = rawTherapists.map(t => {
    // データ整合性チェック (レポートの教訓: 文字列だけのデータは弾く)
    if (typeof t !== 'object' || !t.name || t.name === 'セラピスト') {
      // console.warn(`⚠️ Skipping invalid therapist entry: ${JSON.stringify(t)}`);
      return null;
    }

    // 所属店舗のグループIDを紐付ける
    const parentShop = shops.find(s => s.id === t.shop_id);
    const groupId = parentShop ? parentShop.group_id : null;

    return { 
      ...t, 
      group_id: groupId 
    };
  }).filter(Boolean); // null (不正データ) を除外

  // --- 3. 書き出し ---
  console.log(`💾 Writing to public/data...`);
  
  // アプリの仕様に合わせてファイル出力
  await fs.writeJson(path.join(OUT_DIR, 'shops.json'), shops, { spaces: 2 });
  await fs.writeJson(path.join(OUT_DIR, 'all_shops.json'), shops, { spaces: 2 }); // 互換性用
  await fs.writeJson(path.join(OUT_DIR, 'therapists.json'), therapists, { spaces: 2 });
  
  // バージョン管理ファイル
  await fs.writeJson(path.join(OUT_DIR, 'version.json'), { 
    updatedAt: new Date().toISOString(),
    shopCount: shops.length,
    therapistCount: therapists.length
  });

  console.log(`✅ Migration Complete!`);
  console.log(`   - Shops: ${shops.length}`);
  console.log(`   - Therapists: ${therapists.length}`);
};

main().catch(console.error);
