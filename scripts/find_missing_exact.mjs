import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🔍 【完全版】全店舗のサムネイル画像と必須リンクの設置状況を調査します...\n');

  const shopsPath = path.resolve('public/data/shops.json');
  if (!fs.existsSync(shopsPath)) {
    console.error('⚠️ public/data/shops.json が見つかりません。');
    process.exit(1);
  }

  const shops = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));

  const missingThumbnails = [];
  const missingLinks = [];

  shops.forEach(shop => {
    // ① サムネイルのチェック (no_imageやplaceholderという文字が含まれていたらアウト)
    const img = shop.image_url || shop.image || '';
    const isMissingImg = !img || img.includes('no_image') || img.includes('placeholder');
    
    if (isMissingImg) {
      missingThumbnails.push({ id: shop.id, name: shop.name, area: shop.area });
    }

    // ② リンクのチェック (よくあるキー名の揺れもすべてカバー)
    const official = shop.websiteUrl || shop.officialUrl || shop.official_url || shop.website || shop.url;
    const schedule = shop.scheduleUrl || shop.schedule_url;
    const cast = shop.castUrl || shop.cast_url || shop.therapistUrl || shop.therapist_url;

    if (!official || !schedule || !cast) {
      const missingTypes = [];
      if (!official) missingTypes.push('オフィシャル');
      if (!schedule) missingTypes.push('スケジュール');
      if (!cast) missingTypes.push('セラピスト');

      missingLinks.push({
        id: shop.id,
        name: shop.name,
        brandId: shop.brandId,
        missing: missingTypes
      });
    }
  });

  // 結果の表示
  console.log('==================================================');
  console.log(`🖼️ ① サムネイル画像が「No Image」等の店舗: 【 ${missingThumbnails.length} 件 】`);
  console.log('==================================================');
  missingThumbnails.slice(0, 5).forEach(s => console.log(`  - [${s.area}] ${s.name} (ID: ${s.id})`));
  if (missingThumbnails.length > 5) console.log(`  ...他 ${missingThumbnails.length - 5} 件\n`);

  console.log('==================================================');
  console.log(`🔗 ② 必須リンクが欠けている店舗: 【 ${missingLinks.length} 件 】`);
  console.log('==================================================');
  missingLinks.slice(0, 5).forEach(item => {
    console.log(`  - [${item.brandId || 'ブランド不明'}] ${item.name} (ID: ${item.id})`);
    console.log(`    └ 欠損: ${item.missing.join(', ')}`);
  });
  if (missingLinks.length > 5) console.log(`  ...他 ${missingLinks.length - 5} 件\n`);

  // レポート出力
  const report = {
    total_shops: shops.length,
    missing_thumbnails: missingThumbnails,
    missing_links: missingLinks
  };
  fs.writeFileSync('missing_data_report_exact.json', JSON.stringify(report, null, 2));
  console.log(`✅ 詳細な全件リストを 'missing_data_report_exact.json' に保存しました！`);
}

main();
