const fs = require('fs');

console.log('熟れた果実 4店舗のJSONファイル作成開始...\n');

// セラピストデータ
const therapists = [
  {"id": "tsukishima-sakura", "name": "月島桜", "age": 40, "height": 163, "bust": 85, "cup": "D", "waist": 58, "hip": 87},
  {"id": "murakami-rina", "name": "村上璃奈", "age": 35, "height": 165, "bust": 92, "cup": "F", "waist": 59, "hip": 89},
  {"id": "tsubaki-mire", "name": "椿みれ", "age": 43, "height": 162, "bust": 90, "cup": "E", "waist": 61, "hip": 92},
  {"id": "ibuki-mei", "name": "伊吹芽衣", "age": 36, "height": 155, "bust": 82, "cup": "C", "waist": 58, "hip": 85},
  {"id": "kisaki-airi", "name": "妃あいり", "age": 40, "height": 159, "bust": 88, "cup": "E", "waist": 58, "hip": 85},
  {"id": "suzuki-nanao", "name": "涼木菜々緒", "age": 37, "height": 160, "bust": 86, "cup": "D", "waist": 59, "hip": 88},
  {"id": "oba-emi", "name": "大場えみ", "age": 38, "height": 175, "bust": 85, "cup": "C", "waist": 60, "hip": 93},
  {"id": "aiki-rinka", "name": "愛木りんか", "age": 43, "height": 158, "bust": 88, "cup": "E", "waist": 60, "hip": 88},
  {"id": "kokusei-sana", "name": "国生紗奈", "age": 36, "height": 162, "bust": 92, "cup": "F", "waist": 62, "hip": 93},
  {"id": "isshiki-ayaka", "name": "一色彩香", "age": 36, "height": 158, "bust": 88, "cup": "E", "waist": 60, "hip": 88},
  {"id": "tonda-riko", "name": "遠田莉子", "age": 37, "height": 162, "bust": 90, "cup": "E", "waist": 63, "hip": 96},
  {"id": "suzuhara-fujino", "name": "鈴原ふじ乃", "age": 43, "height": 155, "bust": 83, "cup": "C", "waist": 58, "hip": 85},
  {"id": "aoyama-sarina", "name": "青山さりな", "age": 38, "height": 157, "bust": 88, "cup": "E", "waist": 58, "hip": 83},
  {"id": "kitano-mio", "name": "北乃みお", "age": 36, "height": 164, "bust": 86, "cup": "D", "waist": 62, "hip": 90},
  {"id": "natsume-sakina", "name": "夏目咲奈", "age": 40, "height": 149, "bust": 98, "cup": "H", "waist": 61, "hip": 89},
  {"id": "asuna-riri", "name": "明日菜りり", "age": 38, "height": 165, "bust": 95, "cup": "G", "waist": 63, "hip": 98},
  {"id": "kise-hikari", "name": "喜瀬光", "age": 39, "height": 158, "bust": 89, "cup": "E", "waist": 60, "hip": 92},
  {"id": "shiina-miran", "name": "椎名みらん", "age": 38, "height": 153, "bust": 83, "cup": "C", "waist": 59, "hip": 86},
  {"id": "mizusawa-yuna", "name": "水沢ゆうな", "age": 38, "height": 158, "bust": 87, "cup": "D", "waist": 61, "hip": 93},
  {"id": "asahina-yuzu", "name": "朝比奈ゆず", "age": 40, "height": 152, "bust": 93, "cup": "G", "waist": 61, "hip": 89},
  {"id": "kuroki-misuzu", "name": "黒木みすず", "age": 38, "height": 170, "bust": 93, "cup": "E", "waist": 62, "hip": 90},
  {"id": "kurosaki-nanami", "name": "黒崎七海", "age": 42, "height": 158, "bust": 90, "cup": "E", "waist": 62, "hip": 89},
  {"id": "yuki-eri", "name": "結城えり", "age": 32, "height": 157, "bust": 85, "cup": "D", "waist": 59, "hip": 90},
  {"id": "asada-miku", "name": "浅田みく", "age": 43, "height": 162, "bust": 88, "cup": "E", "waist": 62, "hip": 86},
  {"id": "motomura-shino", "name": "本村しの", "age": 38, "height": 163, "bust": 88, "cup": "F", "waist": 60, "hip": 85},
  {"id": "takashima-reona", "name": "高嶋れおな", "age": 40, "height": 156, "bust": 88, "cup": "E", "waist": 62, "hip": 94},
  {"id": "kitagawa-riona", "name": "北川りおな", "age": 35, "height": 160, "bust": 86, "cup": "D", "waist": 59, "hip": 87},
  {"id": "katase-rino", "name": "片瀬りの", "age": 40, "height": 166, "bust": 88, "cup": "E", "waist": 61, "hip": 85},
  {"id": "orihara-fuka", "name": "折原ふうか", "age": 38, "height": 160, "bust": 82, "cup": "C", "waist": 59, "hip": 84},
  {"id": "kisaragi-miina", "name": "如月みいな", "age": 42, "height": 163, "bust": 83, "cup": "D", "waist": 58, "hip": 87},
  {"id": "hibiki-maria", "name": "響まりあ", "age": 38, "height": 158, "bust": 89, "cup": "D", "waist": 63, "hip": 98},
  {"id": "kageyama-aira", "name": "影山あいら", "age": 40, "height": 156, "bust": 91, "cup": "H", "waist": 63, "hip": 90},
  {"id": "nishijima-nao", "name": "西島なお", "age": 40, "height": 167, "bust": 85, "cup": "D", "waist": 60, "hip": 86},
  {"id": "wakamatsu-chika", "name": "若松ちか", "age": 39, "height": 156, "bust": 90, "cup": "H", "waist": 63, "hip": 98},
  {"id": "hamabe-misa", "name": "浜辺みさ", "age": 42, "height": 157, "bust": 98, "cup": "H", "waist": 63, "hip": 83},
  {"id": "tsukishiro-sayaka", "name": "月城さやか", "age": 38, "height": 166, "bust": 88, "cup": "E", "waist": 60, "hip": 88},
  {"id": "morisaki-miwa", "name": "森崎みわ", "age": 42, "height": 161, "bust": 98, "cup": "G", "waist": 64, "hip": 88},
  {"id": "otoha-mitsu", "name": "乙葉みつ", "age": 42, "height": 166, "bust": 90, "cup": "E", "waist": 63, "hip": 89},
  {"id": "sakurazaki-mami", "name": "桜崎まみ", "age": 41, "height": 153, "bust": 82, "cup": "C", "waist": 58, "hip": 83},
  {"id": "yonekura-sakiko", "name": "米倉咲子", "age": 41, "height": 164, "bust": 90, "cup": "F", "waist": 63, "hip": 92},
  {"id": "tsukishima-ayuna", "name": "月嶋あゆな", "age": 38, "height": 168, "bust": 95, "cup": "G", "waist": 63, "hip": 92},
  {"id": "natsukawa-ayaka", "name": "夏川綺花", "age": 32, "height": 161, "bust": 84, "cup": "D", "waist": 61, "hip": 89},
  {"id": "yukihira-marika", "name": "雪平まりか", "age": 36, "height": 154, "bust": 83, "cup": "D", "waist": 59, "hip": 85},
  {"id": "sawaguchi-rio", "name": "沢口りお", "age": 43, "height": 160, "bust": 85, "cup": "C", "waist": 61, "hip": 87},
  {"id": "rinsaki-mayuri", "name": "凛咲まゆり", "age": 38, "height": 175, "bust": 91, "cup": "F", "waist": 63, "hip": 92},
  {"id": "takaoka-an", "name": "高岡あん", "age": 32, "height": 161, "bust": 90, "cup": "E", "waist": 63, "hip": 89},
  {"id": "ichijo-ayami", "name": "一条あやみ", "age": 44, "height": 162, "bust": 86, "cup": "D", "waist": 60, "hip": 88},
  {"id": "minami-karin", "name": "南花鈴", "age": 43, "height": 158, "bust": 85, "cup": "D", "waist": 62, "hip": 88},
  {"id": "hoki-megumi", "name": "宝生めぐみ", "age": 41, "height": 158, "bust": 83, "cup": "C", "waist": 61, "hip": 82},
  {"id": "sakurai-yuriko", "name": "桜井ゆりこ", "age": 42, "height": 165, "bust": 95, "cup": "E", "waist": 62, "hip": 89},
  {"id": "anzai-marina", "name": "安西まりな", "age": 38, "height": 150, "bust": 88, "cup": "D", "waist": 64, "hip": 95},
  {"id": "sakaki-risa", "name": "榊りさ", "age": 37, "height": 167, "bust": 94, "cup": "D", "waist": 64, "hip": 100},
  {"id": "niiyama-honoka", "name": "新山ほのか", "age": 42, "height": 157, "bust": 92, "cup": "G", "waist": 64, "hip": 90},
  {"id": "asakura-runa", "name": "浅倉るな", "age": 39, "height": 155, "bust": 88, "cup": "D", "waist": 62, "hip": 89},
  {"id": "kiriyama-ichika", "name": "桐山いちか", "age": 36, "height": 161, "bust": 93, "cup": "G", "waist": 64, "hip": 91},
  {"id": "yoshizawa-sumire", "name": "吉沢すみれ", "age": 40, "height": 165, "bust": 100, "cup": "I", "waist": 65, "hip": 97},
  {"id": "natori-yu", "name": "名取ゆう", "age": 39, "height": 168, "bust": 83, "cup": "C", "waist": 58, "hip": 84},
  {"id": "nanase-rui", "name": "七瀬るい", "age": 40, "height": 160, "bust": 82, "cup": "C", "waist": 56, "hip": 80}
];

// 店舗情報
const shops = [
  { id: 60392, areaJp: '日本橋', ward: 'chuo', wardJp: '中央区', areaEn: 'nihonbashi' },
  { id: 60393, areaJp: '新宿３丁目', ward: 'shinjuku', wardJp: '新宿区', areaEn: 'shinjuku_sanchome' },
  { id: 60394, areaJp: '銀座', ward: 'chuo', wardJp: '中央区', areaEn: 'ginza' },
  { id: 60395, areaJp: '立川', ward: 'tachikawa', wardJp: '立川市', areaEn: 'tachikawa' }
];

const station = '日本橋駅、新宿三丁目駅、銀座駅、立川駅';

let successCount = 0;

shops.forEach(shop => {
  // セラピストIDにプレフィックスを追加
  const therapistsWithPrefix = therapists.map(t => ({
    ...t,
    id: `${shop.id}-${t.id}`
  }));

  const data = {
    id: shop.id,
    name: '熟れた果実',
    prefecture: '東京都',
    city: shop.wardJp,
    area: shop.areaJp,
    address: `東京都${shop.wardJp}${shop.areaJp}（詳細は要確認）`,
    image: '/images/shops/no_image.jpg',
    rating: 0,
    reviewCount: 0,
    price: '60分10,000円～',
    hours: '営業時間要確認',
    isPremium: false,
    tags: ['熟女'],
    websiteUrl: 'https://spa-urekaji.com/',
    nearestStation: station,
    description: '60分10,000円 / 70分11,000円 / 90分13,000円 / 120分17,000円 / 150分21,000円 / 延長30分6,000円',
    threads: [],
    therapists: therapistsWithPrefix
  };

  const filepath = `public/data/tokyo/${shop.ward}/${shop.areaEn}/urekaji_${shop.areaEn}.json`;
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${shop.areaJp}店 (ID: ${shop.id}) - ${filepath}`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${shop.areaJp}店エラー: ${error.message}`);
  }
});

console.log(`\n=== 結果 ===`);
console.log(`成功: ${successCount}/4店舗`);
console.log(`\n次のコマンドでshops.jsonを再生成してください:`);
console.log(`node regenerate_shops_json.js`);
console.log(`cp public/data/shops.json src/data/all_shops.json`);

