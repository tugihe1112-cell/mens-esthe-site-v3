import fs from 'fs';
import path from 'path';

const searchFiles = [
  'src/data/all_shops.json',
  'src/data/shops.json',
  'src/data/brand_details.json',
  'src/data_backup_final/src_data/all_shops.json'
];

console.log('🔍 巨大なJSONファイルの中から「写真が設定されているEREN」を執念で探します...');

searchFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  try {
    const data = JSON.parse(content);
    // 配列かオブジェクトか判定
    const shops = Array.isArray(data) ? data : (data.shops || Object.values(data));
    
    shops.forEach(shop => {
      if (shop && shop.name && (shop.name.includes('EREN') || shop.name.includes('エレン'))) {
        const therapists = shop.therapists || (shop.raw_data && shop.raw_data.therapists) || [];
        const photoCount = therapists.filter(t => t.image || t.photo || t.image_url).length;
        const schedule = shop.schedule_link || shop.scheduleUrl || (shop.raw_data && shop.raw_data.schedule_link);

        if (photoCount > 0 || schedule) {
          console.log(`\n🎯 【ついに発見！】: ${file}`);
          console.log(`   📍 ID: ${shop.id} / 名前: ${shop.name}`);
          console.log(`   🗓 スケジュール: ${schedule || 'なし'}`);
          console.log(`   👩‍⚕️ 写真ありセラピスト: ${photoCount}名`);
        }
      }
    });
  } catch (e) {
    // パースエラー
  }
});

console.log('\n✅ 捜索終了');
