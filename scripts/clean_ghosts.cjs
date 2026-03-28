const fs = require('fs-extra');
const path = require('path');

const SRC_THERAPISTS = 'src/data/therapists.json';
const BACKUP_PATH = 'src/data/therapists.json.bak_ghosts';

const main = async () => {
  console.log('🧹 Starting Ghost Cleaning...');

  try {
    // 1. データの読み込み
    const therapists = await fs.readJson(SRC_THERAPISTS);
    console.log(`- 現在の総人数: ${therapists.length} 名`);

    // バックアップ作成
    await fs.writeJson(BACKUP_PATH, therapists, { spaces: 2 });
    console.log(`- バックアップ作成完了: ${BACKUP_PATH}`);

    // 2. フィルタリング (除霊)
    const validTherapists = therapists.filter(t => {
      // 条件A: 名前が「不明なセラピスト」ではない
      const isUnknownName = t.name === '不明なセラピスト' || t.name === 'Unknown';
      
      // 条件B: IDがちゃんと文字列として存在する
      const hasValidId = t.id && typeof t.id === 'string';

      // ログ出し（削除対象の場合）
      if (isUnknownName || !hasValidId) {
        // console.log(`   🗑️ 削除: ${t.name} (ID: ${t.id})`);
        return false; // 削除
      }
      return true; // 残す
    });

    const deletedCount = therapists.length - validTherapists.length;

    // 3. 保存
    await fs.writeJson(SRC_THERAPISTS, validTherapists, { spaces: 2 });

    console.log(`\n✨ クリーニング完了!`);
    console.log(`- 削除した亡霊データ: ${deletedCount} 件`);
    console.log(`- 残った正常データ:   ${validTherapists.length} 名`);
    
    if (deletedCount > 0) {
      console.log('\n✅ 次のステップ: node scripts/migrate_safe.cjs を実行して反映してください。');
    } else {
      console.log('\n⚠️ 削除対象が見つかりませんでした。条件を見直す必要があります。');
    }

  } catch (e) {
    console.error('❌ Error:', e);
  }
};

main();
