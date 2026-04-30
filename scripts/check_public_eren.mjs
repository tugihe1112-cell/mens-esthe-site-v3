import fs from 'fs';

const checkFiles = [
  'public/data/tokyo/setagaya/shimokitazawa/eren.json',
  'public/data/tokyo/shibuya/yoyogi_harajuku/eren.json',
  'public/data/all_shops.json',
  'public/data/shops.json'
];

console.log('🔍 public/ フォルダのERENデータの中身を最終確認します...');
let foundAny = false;

checkFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  try {
    const content = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(content);
    const shops = Array.isArray(data) ? data : (data.shops ? data.shops : [data]);
    
    shops.forEach(shop => {
        if (shop && shop.name && (shop.name.includes('EREN') || shop.name.includes('エレン'))) {
            const therapists = shop.therapists || (shop.raw_data && shop.raw_data.therapists) || [];
            const photoCount = therapists.filter(t => t.image || t.photo || t.image_url || t.img).length;
            const schedule = shop.schedule_link || shop.scheduleUrl || shop.schedule || shop.link || (shop.raw_data && shop.raw_data.schedule_link);
            
            if (photoCount > 0 || (schedule && schedule !== '未設定')) {
                console.log(`\n🎯 【本物発見！】 ファイル: ${file}`);
                console.log(`   📍 店舗名: ${shop.name}`);
                console.log(`   🗓 スケジュール: ${schedule || 'なし'}`);
                console.log(`   👩‍⚕️ 写真ありセラピスト数: ${photoCount}名`);
                foundAny = true;
            }
        }
    });
  } catch (e) {
    // パースエラーはスキップ
  }
});

if (!foundAny) {
  console.log('\n❌ publicフォルダ内のファイルにも、写真やスケジュールは設定されていませんでした。');
}
console.log('\n✅ チェック完了');
