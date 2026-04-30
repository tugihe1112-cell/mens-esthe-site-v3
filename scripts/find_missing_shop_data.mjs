import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🔍 全店舗のサムネイル画像とリンクの設置状況を調査します...\n');

  const shopsPath = path.resolve('public/data/shops.json');
  if (!fs.existsSync(shopsPath)) {
    console.error('⚠️ public/data/shops.json が見つかりません。');
    process.exit(1);
  }

  const shops = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));

  const missingThumbnails = [];
  const missingLinks = [];

  shops.forEach(shop => {
    // ① サムネイルのチェック (よく使われるキー名を網羅)
    const hasThumb = shop.image_url || shop.image || shop.thumbnail || (shop.images && shop.images.length > 0);
    if (!hasThumb) {
      missingThumbnails.push({ id: shop.id, name: shop.name || '名前なし', area: shop.area || 'エリア不明' });
    }

    // ② リンクのチェック
    const hasOfficial = shop.url || shop.official_url || shop.website;
    const hasSchedule = shop.schedule_url || shop.scheduleUrl || shop.schedule;
    const hasCast = shop.cast_url || shop.therapist_url || shop.castUrl || shop.girls_url;

    if (!hasOfficial || !hasSchedule || !hasCast) {
      const missingTypes = [];
      if (!hasOfficial) missingTypes.push('オフィシャル');
      if (!hasSchedule) missingTypes.push('スケジュール');
      if (!hasCast) missingTypes.push('セラピスト');

      missingLinks.push({
        id: shop.id,
        name: shop.name || '名前なし',
        area: shop.area || 'エリア不明',
        missing: missingTypes
      });
    }
  });

  // 結果の表示
  console.log('==================================================');
  console.log(`🖼️ ① サムネイルが未設置の店舗: 【 ${missingThumbnails.length} 件 】`);
  console.log('==================================================');
  missingThumbnails.slice(0, 10).forEach(s => console.log(`  - [${s.area}] ${s.name} (ID: ${s.id})`));
  if (missingThumbnails.length > 10) console.log(`  ...他 ${missingThumbnails.length - 10} 件\n`);

  console.log('==================================================');
  console.log(`🔗 ② 必須リンクが1つ以上欠けている店舗: 【 ${missingLinks.length} 件 】`);
  console.log('==================================================');
  missingLinks.slice(0, 10).forEach(item => {
    console.log(`  - [${item.area}] ${item.name} (ID: ${item.id})`);
    console.log(`    └ 欠損: ${item.missing.join(', ')}`);
  });
  if (missingLinks.length > 10) console.log(`  ...他 ${missingLinks.length - 10} 件\n`);

  // 全件リストをファイルに出力（ターミナルで見きれない用）
  const report = {
    total_shops: shops.length,
    missing_thumbnails: missingThumbnails,
    missing_links: missingLinks
  };
  fs.writeFileSync('missing_data_report.json', JSON.stringify(report, null, 2));
  console.log(`✅ 詳細な全件リストをプロジェクト直下の 'missing_data_report.json' に保存しました！`);
}

main();
