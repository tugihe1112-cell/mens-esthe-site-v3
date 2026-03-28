const fs = require('fs');

console.log('ウルレア巣鴨 2店舗のJSONファイル作成開始...\n');

// セラピストデータ
const therapists = [
  {"id": "arimoto-mio", "name": "有本みお", "age": 24, "height": 162, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "sakuma-juri", "name": "咲真じゅり", "age": 26, "height": 155, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "kurosaki-mone", "name": "黒崎もね", "age": 22, "height": 160, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "fujisaki-kanon", "name": "藤咲かのん", "age": 27, "height": 153, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "sato-hina", "name": "佐藤ひな", "age": 26, "height": 157, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "shiina-hiyori", "name": "椎名ひより", "age": 24, "height": 163, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "aise-miyu", "name": "愛瀬みゆ", "age": 25, "height": 165, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "yanagi-yura", "name": "柳ゆら", "age": 23, "height": 160, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "kato-ayako", "name": "加藤あやこ", "age": 23, "height": 165, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "tachibana-kotone", "name": "橘ことね", "age": 21, "height": 160, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "kuroba-kibi", "name": "黒羽きび", "age": 27, "height": 0, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "oshima-minato", "name": "大島みなと", "age": 25, "height": 155, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "iwato-suzume", "name": "岩戸すずめ", "age": 24, "height": 158, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "sakura-eri", "name": "咲良えり", "age": 23, "height": 163, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "sakurai-rin", "name": "桜井りん", "age": 20, "height": 160, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "yukino-shizuku", "name": "雪乃しずく", "age": 21, "height": 165, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "ono-maika", "name": "大野まいか", "age": 25, "height": 164, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "hongo-haruna", "name": "本郷はるな", "age": 26, "height": 157, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "kagura-hana", "name": "神楽はな", "age": 23, "height": 160, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "haruhi-rinon", "name": "春陽りのん", "age": 23, "height": 165, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "kisaki-ruka", "name": "妃咲るか", "age": 22, "height": 155, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "shiraishi-risa", "name": "白石りさ", "age": 28, "height": 160, "bust": 0, "cup": "H", "waist": 0, "hip": 0},
  {"id": "arimura-yukina", "name": "有村ゆきな", "age": 28, "height": 146, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "hinata-rumi", "name": "日向るみ", "age": 22, "height": 160, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "amatsuka-yuri", "name": "天使ゆうり", "age": 20, "height": 164, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "shiratori-aki", "name": "白鳥あき", "age": 27, "height": 154, "bust": 0, "cup": "H", "waist": 0, "hip": 0},
  {"id": "okonogi-maria", "name": "小此木まりあ", "age": 29, "height": 170, "bust": 0, "cup": "H", "waist": 0, "hip": 0},
  {"id": "himekawa-momona", "name": "姫川ももな", "age": 20, "height": 153, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "moriya-miya", "name": "守屋みや", "age": 21, "height": 152, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "karaku-meru", "name": "華楽める", "age": 23, "height": 168, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "yuzuki-komachi", "name": "柚木こまち", "age": 25, "height": 150, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "yakura-yuri", "name": "矢倉ゆり", "age": 25, "height": 157, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "narumiya-mimi", "name": "成宮みみ", "age": 22, "height": 160, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "minami-sana", "name": "美波さな", "age": 22, "height": 164, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "minemoto-anna", "name": "峰本あんな", "age": 20, "height": 155, "bust": 0, "cup": "B", "waist": 0, "hip": 0},
  {"id": "tsubaki-nozomi", "name": "椿のぞみ", "age": 27, "height": 157, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "kawaei-hikari", "name": "川栄ひかり", "age": 19, "height": 150, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "shirose-rena", "name": "白瀬れな", "age": 21, "height": 156, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "momose-miruku", "name": "桃瀬みるく", "age": 25, "height": 160, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "yuina-mitsuki", "name": "結奈みつき", "age": 29, "height": 159, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "konoka-ichika", "name": "心花いちか", "age": 21, "height": 161, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "mori-mana", "name": "森まな", "age": 21, "height": 161, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "konose-hime", "name": "恋瀬ひめ", "age": 20, "height": 162, "bust": 0, "cup": "B", "waist": 0, "hip": 0},
  {"id": "tada-arisu", "name": "多田ありす", "age": 24, "height": 158, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "yuzuriha-ami", "name": "楪あみ", "age": 24, "height": 156, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "kanae-natsuki", "name": "叶なつき", "age": 24, "height": 160, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "mashiro-rii", "name": "真白りい", "age": 24, "height": 160, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "saito-ria", "name": "斉藤りあ", "age": 24, "height": 154, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "koizora-renka", "name": "恋空れんか", "age": 25, "height": 155, "bust": 0, "cup": "", "waist": 0, "hip": 0},
  {"id": "naruse-hinata", "name": "成瀬ひなた", "age": 23, "height": 147, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "yabuki-serina", "name": "矢吹せりな", "age": 20, "height": 161, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "takagi-yuna", "name": "高木ゆうな", "age": 28, "height": 154, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "aino-moa", "name": "愛乃もあ", "age": 21, "height": 159, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "suzumine-ririka", "name": "涼峰りりか", "age": 22, "height": 157, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "asuka-nami", "name": "明日花なみ", "age": 25, "height": 150, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "hanano-mai", "name": "花野まい", "age": 24, "height": 160, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "seto-hazuki", "name": "瀬戸はづき", "age": 20, "height": 155, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "ousaki-kohana", "name": "桜咲こはな", "age": 20, "height": 164, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "koizumi-kanata", "name": "小泉かなた", "age": 25, "height": 159, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "sakuragi-momo", "name": "桜木もも", "age": 22, "height": 163, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "amamiya-urara", "name": "雨宮うらら", "age": 23, "height": 168, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "otori-kobato", "name": "鳳こばと", "age": 23, "height": 0, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "amano-moe", "name": "天野もえ", "age": 24, "height": 158, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "midoriya-koharu", "name": "翠谷こはる", "age": 20, "height": 158, "bust": 0, "cup": "I", "waist": 0, "hip": 0},
  {"id": "kisaragi-run", "name": "如月るん", "age": 20, "height": 158, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "aitsuki-amu", "name": "藍月あむ", "age": 21, "height": 156, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "tsukiyama-sara", "name": "月山さら", "age": 20, "height": 156, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "hakozaki-aika", "name": "箱崎あいか", "age": 24, "height": 170, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "asahina-mii", "name": "朝比奈みい", "age": 22, "height": 0, "bust": 0, "cup": "A", "waist": 0, "hip": 0},
  {"id": "takashiro-riona", "name": "高城りおな", "age": 24, "height": 165, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "hoshikawa-umi", "name": "星川うみ", "age": 25, "height": 167, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "shinonome-nagi", "name": "東雲なぎ", "age": 20, "height": 160, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "kannagi-saku", "name": "巫さく", "age": 23, "height": 164, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "nagase-mirei", "name": "永瀬みれい", "age": 19, "height": 170, "bust": 0, "cup": "H", "waist": 0, "hip": 0},
  {"id": "amane-rinka", "name": "天音りんか", "age": 25, "height": 159, "bust": 0, "cup": "J", "waist": 0, "hip": 0},
  {"id": "megami-yume", "name": "女神ゆめ", "age": 22, "height": 156, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "ayase-kuina", "name": "綾瀬くいな", "age": 28, "height": 151, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "shimizu-seina", "name": "清水せいな", "age": 22, "height": 155, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "kujo-mikoto", "name": "九条みこと", "age": 23, "height": 160, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "izumi-ren", "name": "泉れん", "age": 23, "height": 165, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "aikawa-noa", "name": "相川のあ", "age": 19, "height": 150, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "nagahama-mao", "name": "長濱まお", "age": 20, "height": 154, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "hoshimiya-ai", "name": "星宮あい", "age": 21, "height": 158, "bust": 0, "cup": "F", "waist": 0, "hip": 0},
  {"id": "nekomiya-runa", "name": "猫宮るな", "age": 24, "height": 153, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "miyawaki-an", "name": "宮脇あん", "age": 25, "height": 163, "bust": 0, "cup": "D", "waist": 0, "hip": 0},
  {"id": "morinaga-cocoa", "name": "森永ここあ", "age": 25, "height": 155, "bust": 0, "cup": "E", "waist": 0, "hip": 0},
  {"id": "tsukishima-koko", "name": "月島ここ", "age": 22, "height": 159, "bust": 0, "cup": "G", "waist": 0, "hip": 0},
  {"id": "shiromoto-saya", "name": "城本さや", "age": 19, "height": 155, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "yoshino-nana", "name": "吉野なな", "age": 24, "height": 157, "bust": 0, "cup": "C", "waist": 0, "hip": 0},
  {"id": "misaki-uta", "name": "三咲うた", "age": 24, "height": 0, "bust": 0, "cup": "C", "waist": 0, "hip": 0}
];

// 店舗情報
const shops = [
  { id: 60389, areaJp: '巣鴨', areaEn: 'sugamo' },
  { id: 60390, areaJp: '大塚', areaEn: 'otsuka' }
];

const station = '巣鴨駅、大塚駅';

let successCount = 0;

shops.forEach(shop => {
  // セラピストIDにプレフィックスを追加
  const therapistsWithPrefix = therapists.map(t => ({
    ...t,
    id: `${shop.id}-${t.id}`
  }));

  const data = {
    id: shop.id,
    name: 'ウルレア巣鴨（旧リベア）',
    prefecture: '東京都',
    city: '豊島区',
    area: shop.areaJp,
    address: `東京都豊島区${shop.areaJp}（詳細は要確認）`,
    image: '/images/shops/no_image.jpg',
    rating: 0,
    reviewCount: 0,
    price: '70分13,000円～',
    hours: '営業時間要確認',
    isPremium: false,
    tags: [],
    websiteUrl: 'https://ulrare.net/',
    nearestStation: station,
    description: '基本コース: 70分13,000円 / 90分18,000円 / 120分24,000円 / 150分30,000円 / プレミアコース: 110分33,000円 / 150分41,000円 / 180分46,000円 / ウルレアコース: 90分23,000円 / 指名料: 写真指名1,000円・本指名1,000円',
    threads: [],
    therapists: therapistsWithPrefix
  };

  const filepath = `public/data/tokyo/toshima/${shop.areaEn}/ulrare_${shop.areaEn}.json`;
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${shop.areaJp}店 (ID: ${shop.id}) - ${filepath}`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${shop.areaJp}店エラー: ${error.message}`);
  }
});

console.log(`\n=== 結果 ===`);
console.log(`成功: ${successCount}/2店舗`);
console.log(`\n次のコマンドでshops.jsonを再生成してください:`);
console.log(`node regenerate_shops_json.js`);
console.log(`cp public/data/shops.json src/data/all_shops.json`);

