import fs from 'fs';
import path from 'path';

async function main() {
  const brokenFile = path.resolve('src/data/locations.js');
  const backupFile = path.resolve('src/data_backup_final/src_data/locations.js');

  try {
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, brokenFile);
      console.log('✅ バックアップから locations.js を正常な状態に復元しました！');
      console.log('🔄 ブラウザをリロード（または npm run dev を再起動）して、画面が元通り表示されるか確認してください。');
    } else {
      console.log('⚠️ バックアップが見つかりません。Gitを使っている場合は git checkout src/data/locations.js を実行してください。');
    }
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
