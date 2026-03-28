const fs = require('fs');

console.log('アロマルナベル 7店舗のJSONファイル作成開始...\n');

// セラピストデータ
const therapists = [
  {"id": "natsume-reina", "name": "夏目れいな", "age": 32, "height": 160, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "horikita-mao", "name": "堀北まお", "age": 32, "height": 160, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "kawabata-hana", "name": "川端はな", "age": 37, "height": 152, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "hijikata-kokoro", "name": "土方こころ", "age": 32, "height": 150, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "serizawa-mirei", "name": "芹沢みれい", "age": 31, "height": 163, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "shirasaki-mona", "name": "白咲もな", "age": 38, "height": 159, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "ishihara-akari", "name": "石原あかり", "age": 35, "height": 159, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "arimura-misaki", "name": "有村みさき", "age": 37, "height": 165, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "yoshii-mayu", "name": "吉井まゆ", "age": 36, "height": 165, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "hanazono-ramu", "name": "花園らむ", "age": 28, "height": 162, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "oishi-keiko", "name": "大石けいこ", "age": 35, "height": 161, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "yazawa-sakura", "name": "矢澤さくら", "age": 30, "height": 168, "bust": 0, "cup": "H", "waist": 0, "hip": 0},
  {"id": "kikuchi-miyu", "name": "菊池みゆ", "age": 30, "height": 157, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "amano-ayaka", "name": "天野あやか", "age": 33, "height": 148, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "hatsuki-ai", "name": "羽月あい", "age": 28, "height": 148, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "fukuhara-marin", "name": "福原まりん", "age": 27, "height": 154, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "morisaki-reika", "name": "森咲れいか", "age": 31, "height": 168, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "aoi-ran", "name": "葵らん", "age": 32, "height": 156, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "nagamine-sumire", "name": "長峰すみれ", "age": 34, "height": 163, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "sakimoto-asuna", "name": "咲本あすな", "age": 30, "height": 156, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "asuka-nene", "name": "明日花ねね", "age": 35, "height": 159, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "fujikawa-narumi", "name": "藤川なるみ", "age": 34, "height": 160, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "takigawa-nanako", "name": "滝川ななこ", "age": 31, "height": 166, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "tanaka-aki", "name": "田中あき", "age": 37, "height": 156, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "hanazawa-chiyo", "name": "花沢ちよ", "age": 33, "height": 156, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "kurokawa-mai", "name": "黒川まい", "age": 35, "height": 160, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "izumi-shiho", "name": "泉しほ", "age": 32, "height": 150, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "honda-chihiro", "name": "本田ちひろ", "age": 28, "height": 153, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "yoshikawa-rina", "name": "吉川りな", "age": 31, "height": 154, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "hirosue-ayana", "name": "広末あやな", "age": 40, "height": 159, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "miya-kaori", "name": "宮かおり", "age": 32, "height": 163, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "watanabe-sena", "name": "渡辺せな", "age": 35, "height": 160, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "mizuno-nao", "name": "水野なお", "age": 37, "height": 156, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "sakurai-honoka", "name": "桜井ほのか", "age": 32, "height": 159, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "ryukawa-ryou", "name": "流川りょう", "age": 36, "height": 162, "bust": 0, "cup": "H", "waist": 0, "hip": 0},
  {"id": "kurashina-karen", "name": "倉科かれん", "age": 30, "height": 156, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "takeda-miku", "name": "竹田みく", "age": 30, "height": 160, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "aizawa-rio", "name": "相澤りお", "age": 35, "height": 155, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "ebihara-ema", "name": "海老原えま", "age": 27, "height": 154, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "kawaguchi-mina", "name": "川口みな", "age": 31, "height": 165, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "sasamoto-rinka", "name": "笹本りんか", "age": 37, "height": 162, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "aise-mizuki", "name": "愛瀬みずき", "age": 30, "height": 156, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "mori-sayaka", "name": "森さやか", "age": 31, "height": 165, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "miyashita-erisa", "name": "宮下えりさ", "age": 32, "height": 166, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "hanasaki-shiori", "name": "花咲しおり", "age": 30, "height": 166, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "uchida-chisa", "name": "内田ちさ", "age": 30, "height": 160, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "ito-mei", "name": "伊藤めい", "age": 30, "height": 148, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "kanzaki-misa", "name": "神崎みさ", "age": 31, "height": 160, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "ichinomiya-hina", "name": "一宮ひな", "age": 36, "height": 155, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "shibuya-rino", "name": "渋谷りの", "age": 33, "height": 166, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "hayashi-momo", "name": "林もも", "age": 31, "height": 160, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "shirai-moka", "name": "白井もか", "age": 30, "height": 162, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "nakamura-yuri", "name": "中村ゆり", "age": 31, "height": 161, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "tsukimi-yuzu", "name": "月見ゆず", "age": 25, "height": 165, "bust": 0, "cup": "C", "waist": 0, "hip": 0}
];

// 店舗情報
const shops = [
  { id: 60378, areaJp: '秋葉原', ward: 'chiyoda', wardJp: '千代田区', areaEn: 'akihabara' },
  { id: 60379, areaJp: '代々木', ward: 'shibuya', wardJp: '渋谷区', areaEn: 'yoyogi' },
  { id: 60380, areaJp: '池袋', ward: 'toshima', wardJp: '豊島区', areaEn: 'ikebukuro' },
  { id: 60381, areaJp: '新橋', ward: 'minato', wardJp: '港区', areaEn: 'shimbashi' },
  { id: 60382, areaJp: '麻布十番', ward: 'minato', wardJp: '港区', areaEn: 'azabujuban' },
  { id: 60383, areaJp: '新宿', ward: 'shinjuku', wardJp: '新宿区', areaEn: 'shinjuku' },
  { id: 60384, areaJp: '五反田', ward: 'shinagawa', wardJp: '品川区', areaEn: 'gotanda' }
];

const station = '秋葉原駅、代々木駅、池袋駅、新橋駅、麻布十番駅、新宿駅、五反田駅';

let successCount = 0;

shops.forEach(shop => {
  // セラピストIDにプレフィックスを追加
  const therapistsWithPrefix = therapists.map(t => ({
    ...t,
    id: `${shop.id}-${t.id}`
  }));

  const data = {
    id: shop.id,
    name: 'アロマルナベル（旧お姉さん）',
    prefecture: '東京都',
    city: shop.wardJp,
    area: shop.areaJp,
    address: `東京都内各エリア（${shop.areaJp}）`,
    image: '/images/shops/no_image.jpg',
    rating: 0,
    reviewCount: 0,
    price: '90分16,000円～',
    hours: '営業時間要確認',
    isPremium: false,
    tags: [],
    websiteUrl: 'https://aroma-lunabelle.com/',
    nearestStation: station,
    description: 'デトックストリートメント: 90分16,000円 / 120分21,000円 / 150分26,000円 / 180分31,000円 / 仰向けリンパ集中コース70分14,000円 / 指名料1,000円 / 延長10分2,000円 / オプション2,000円～4,000円',
    threads: [],
    therapists: therapistsWithPrefix
  };

  const filepath = `public/data/tokyo/${shop.ward}/${shop.areaEn}/aroma_lunabelle_${shop.areaEn}.json`;
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${shop.areaJp}店 (ID: ${shop.id}) - ${filepath}`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${shop.areaJp}店エラー: ${error.message}`);
  }
});

console.log(`\n=== 結果 ===`);
console.log(`成功: ${successCount}/7店舗`);
console.log(`\n次のコマンドでshops.jsonを再生成してください:`);
console.log(`node regenerate_shops_json.js`);
console.log(`cp public/data/shops.json src/data/all_shops.json`);

