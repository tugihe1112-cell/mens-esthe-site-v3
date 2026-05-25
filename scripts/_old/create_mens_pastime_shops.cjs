const fs = require('fs');

console.log('メンズパスタイム 3店舗のJSONファイル作成開始...\n');

// セラピストデータ（名前と年齢のみ）
const therapists = [
  {"id": "oguro", "name": "大黒", "age": 39, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "kaneko", "name": "金子", "age": 44, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "sugikawa", "name": "杉河", "age": 47, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "kisaragi", "name": "如月", "age": 44, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "yumesaki", "name": "夢咲", "age": 47, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "seto", "name": "瀬戸", "age": 38, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "oyama", "name": "大山", "age": 36, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "mihara", "name": "三原", "age": 36, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "mito", "name": "美桃", "age": 40, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "sakurai", "name": "桜井", "age": 46, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "arihara", "name": "有原", "age": 34, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "iwakura", "name": "岩倉", "age": 40, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "sawai", "name": "沢井", "age": 45, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "mutsuki", "name": "睦月", "age": 46, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "makino", "name": "牧野", "age": 35, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "kawanishi", "name": "川西", "age": 32, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "aoi", "name": "蒼井", "age": 47, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "shima", "name": "志摩", "age": 39, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "izumi", "name": "泉", "age": 44, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "koda", "name": "倖田", "age": 48, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "yonekura", "name": "米倉", "age": 46, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "kodama", "name": "児玉", "age": 43, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "fukatsu", "name": "深津", "age": 45, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "mikumo", "name": "三雲", "age": 44, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "takamiya", "name": "高宮", "age": 40, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "kirishima", "name": "霧島", "age": 36, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "hotta", "name": "堀田", "age": 40, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "satsuki", "name": "皐月", "age": 48, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "kojima", "name": "小島", "age": 45, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "oguri", "name": "小栗", "age": 37, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "tomura", "name": "戸村", "age": 34, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "chinen", "name": "知念", "age": 34, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "miyake", "name": "三宅", "age": 40, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "sakamoto", "name": "坂本", "age": 33, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "tezuka", "name": "手塚", "age": 37, "height": 0, "bust": 0, "cup": "", "waist": 0, "hip": 0}
];

// 店舗情報
const shops = [
  { id: 60386, areaJp: '池袋', ward: 'toshima', wardJp: '豊島区', areaEn: 'ikebukuro' },
  { id: 60387, areaJp: '赤羽', ward: 'kita', wardJp: '北区', areaEn: 'akabane' },
  { id: 60388, areaJp: '練馬', ward: 'nerima', wardJp: '練馬区', areaEn: 'nerima' }
];

const station = '池袋駅、赤羽駅、練馬駅';

let successCount = 0;

shops.forEach(shop => {
  // セラピストIDにプレフィックスを追加
  const therapistsWithPrefix = therapists.map(t => ({
    ...t,
    id: `${shop.id}-${t.id}`
  }));

  const data = {
    id: shop.id,
    name: 'メンズパスタイム（旧アルパカの想い）',
    prefecture: '東京都',
    city: shop.wardJp,
    area: shop.areaJp,
    address: `東京都${shop.wardJp}${shop.areaJp}（詳細は要確認）`,
    image: '/images/shops/no_image.jpg',
    rating: 0,
    reviewCount: 0,
    price: '90分15,000円～',
    hours: '営業時間要確認',
    isPremium: false,
    tags: ['カード払いOK'],
    websiteUrl: 'https://mens-pastime.com/',
    nearestStation: station,
    description: '90分15,000円 / 120分20,000円 / 150分25,000円 / 延長30分6,000円 / 指名料・本指名料1,000円',
    threads: [],
    therapists: therapistsWithPrefix
  };

  const filepath = `public/data/tokyo/${shop.ward}/${shop.areaEn}/mens_pastime_${shop.areaEn}.json`;
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${shop.areaJp}店 (ID: ${shop.id}) - ${filepath}`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${shop.areaJp}店エラー: ${error.message}`);
  }
});

console.log(`\n=== 結果 ===`);
console.log(`成功: ${successCount}/3店舗`);
console.log(`\n次のコマンドでshops.jsonを再生成してください:`);
console.log(`node regenerate_shops_json.js`);
console.log(`cp public/data/shops.json src/data/all_shops.json`);

