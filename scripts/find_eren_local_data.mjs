import fs from 'fs';

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    const data = JSON.parse(content);
    // 配列でもオブジェクト単体でも対応できるように正規化
    const shops = Array.isArray(data) ? data : [data];
    
    shops.forEach(shop => {
      if (shop.name && shop.name.toLowerCase().includes('eren')) {
        const schedule = shop.schedule_link || shop.scheduleUrl || shop.schedule || shop.link || '未設定';
        const therapists = shop.therapists || [];
        const hasPhoto = therapists.some(t => t.image || t.photo || t.img || t.image_url);

        // スケジュールか写真のどちらかが設定されていれば「当たり」
        if (schedule !== '未設定' || hasPhoto) {
          console.log(`\n🎯 【当たり発見！】ファイル: ${filePath}`);
          console.log(`   📍 店舗: ${shop.name}`);
          console.log(`   🗓 スケジュール: ${schedule}`);
          console.log(`   👩‍⚕️ セラピスト: ${therapists.length}件 (写真設定あり: ${hasPhoto ? 'はい' : 'いいえ'})`);
        }
      }
    });
  } catch (e) {
    // パースエラーは無視
  }
}

console.log('🔍 ローカルのJSONファイルから、設定済みのERENデータを探します...');
checkFile('src/data/all_shops.json');
checkFile('src/data/shops.json');
checkFile('src/data/tokyo/setagaya/shimokitazawa/eren.json');
checkFile('src/data/tokyo/shibuya/yoyogi_harajuku/eren.json');

console.log('✅ 探索完了');
