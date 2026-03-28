const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// パス定義
const PUBLIC_DIR = 'public/data';
const SRC_DIR = 'src/data';

const main = async () => {
  console.log('🔄 Data Synchronization Started...');

  try {
    // 1. まずはグループIDの統一など、データ整形スクリプトを実行 (Source of Truthを整える)
    console.log('🛠  Running data normalization (unify_brand_groups)...');
    try {
      execSync('node scripts/unify_brand_groups.cjs', { stdio: 'inherit' });
    } catch (e) {
      console.warn('⚠️  Warning: Data normalization script failed, but continuing sync.');
    }

    // 2. public/data の内容を src/data に完全同期
    console.log(`📂 Copying ${PUBLIC_DIR} to ${SRC_DIR}...`);
    
    // src/data がなければ作成
    await fs.ensureDir(SRC_DIR);

    // コピー実行 (上書き)
    await fs.copy(PUBLIC_DIR, SRC_DIR);

    // 3. 完了メッセージ
    console.log('---------------------------------------------------');
    const shops = await fs.readJson(path.join(SRC_DIR, 'shops.json'));
    const therapists = await fs.readJson(path.join(SRC_DIR, 'therapists.json'));
    
    console.log(`✅ Synchronization Complete!`);
    console.log(`   - Shops:      ${shops.length} records`);
    console.log(`   - Therapists: ${therapists.length} records`);
    console.log(`   - Destination: src/data/ is now up to date.`);
    console.log('---------------------------------------------------');

  } catch (e) {
    console.error('❌ Sync Failed:', e);
    process.exit(1);
  }
};

main();
