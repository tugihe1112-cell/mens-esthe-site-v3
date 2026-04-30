import fs from 'fs';
import path from 'path';

const shopsPath = path.resolve('public/data/shops.json');
if (!fs.existsSync(shopsPath)) {
  console.error('⚠️ public/data/shops.json が見つかりません。');
  process.exit(1);
}

const shops = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));

// 名前、エリア、住所のどこかに「荻窪」が含まれる店舗を抽出
const ogikuboShops = shops.filter(s => 
  (s.name && s.name.includes('荻窪')) || 
  (s.area && s.area.includes('荻窪')) || 
  (s.address && s.address.includes('荻窪'))
);

if (ogikuboShops.length === 0) {
  console.log('⚠️ 荻窪に関連する店舗が見つかりませんでした。');
} else {
  console.log(`🔍 荻窪の店舗を ${ogikuboShops.length} 件発見しました。画像データを解析します...\n`);
  
  ogikuboShops.forEach(shop => {
    console.log(`[店舗名] ${shop.name} (ID: ${shop.id})`);
    console.log(`  - 現在の代表画像 (image): ${shop.image || '設定なし'}`);
    
    if (shop.therapists && shop.therapists.length > 0) {
      console.log(`  - 所属セラピスト: ${shop.therapists.length} 名`);
      
      // セラピストが持っている画像を重複なしでリストアップ
      const tImages = shop.therapists.map(t => t.image || '設定なし');
      const uniqueImages = [...new Set(tImages)];
      
      console.log(`  - セラピストが持っている画像データ一覧:`);
      uniqueImages.forEach(img => {
        if (img.includes('no_image') || img.includes('placeholder')) {
          console.log(`      * ❌ ${img} (プレースホルダー)`);
        } else {
          console.log(`      * ✅ ${img} (実画像)`);
        }
      });
    } else {
      console.log(`  - 所属セラピスト: 0 名 (※ここから画像を引っ張ることができません)`);
    }
    console.log('--------------------------------------------------');
  });
}
