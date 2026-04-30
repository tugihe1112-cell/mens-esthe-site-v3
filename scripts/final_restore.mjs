import fs from 'fs';
import path from 'path';

async function main() {
  const targetFile = path.resolve('src/data/locations.js');
  const backupFile = path.resolve('src/data_backup_final/src_data/locations.js');

  try {
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, targetFile);
      console.log('✅ バックアップから locations.js を【完全に初期状態】に復元しました！');
    } else {
      console.log('⚠️ バックアップが見つかりません。');
    }
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
