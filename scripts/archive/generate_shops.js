const fs = require('fs');
const path = require('path');

// 1. 基本となるショップデータ（セラピスト全員含む）
const baseShop = {
  "id": 5014,
  "name": "東京メンズエステ 目黒 池袋",
  "prefecture": "東京都",
  "city": "", // ここを後で書き換えます
  "region": "関東エリア",
  "address": "", // ここを後で書き換えます
  "image": "/images/shops/tokyo_mensesthe.jpg",
  "rating": 4.6,
  "reviewCount": 0,
  "price": "90分 14,000円～",
  "hours": "11:00～翌4:00",
  "isPremium": false,
  "color": "from-emerald-400 to-teal-600",
  "tags": [],
  "websiteUrl": "https://tokyo-mensesthe.site/",
  "threads": []
};

// 2. セラピストリスト（全員分）
const therapists = [
  { name: "まりな", age: 25, t: "T162", b: "B88(E)" },
  { name: "さとみ", age: 24, t: "T159", b: "B86(D)" },
  { name: "ゆうこ", age: 26, t: "T163", b: "B90(F)" },
  { name: "まき", age: 23, t: "T160", b: "B87(E)" },
  { name: "あい", age: 27, t: "T165", b: "B89(F)" },
  { name: "佐藤あや", age: 32 },
  { name: "新垣めい", age: 32 },
  { name: "伊藤さや", age: 26 },
  { name: "綾瀬せな", age: 28 },
  { name: "本田まりな", age: 27 },
  { name: "広瀬あいり", age: 29 },
  { name: "椎名さくら", age: 29 },
  { name: "倉科あみ", age: 30 },
  { name: "朝比奈ゆずり", age: 33 },
  { name: "岡ゆかり", age: 27 },
  { name: "園崎しおん", age: 27 },
  { name: "秋山つき", age: 35 },
  { name: "白川らん", age: 30 },
  { name: "白鳥はなえ", age: 33 },
  { name: "水野まりさ", age: 35 },
  { name: "木村みゆう", age: 32 },
  { name: "花山さき", age: 32 },
  { name: "春日野うらら", age: 26 },
  { name: "望月りさ", age: 36 },
  { name: "佐倉ゆり", age: 47 },
  { name: "白金ゆき", age: 29 },
  { name: "朝倉みほ", age: 35 },
  { name: "水樹りか", age: 37 },
  { name: "有村かなえ", age: 33 },
  { name: "二葉つばさ", age: 39 },
  { name: "山咲すみれ", age: 34 },
  { name: "瀬戸ゆうか", age: 42 },
  { name: "川崎まゆ", age: 43 },
  { name: "水戸まどか", age: 41 },
  { name: "美咲こころ", age: 29 },
  { name: "白石あんじゅ", age: 40 },
  { name: "吉川りんか", age: 40 },
  { name: "アンジェリーナ フジモト", age: 36 },
  { name: "坂井のあ", age: 36 },
  { name: "柴咲みか", age: 32 }
];

// セラピストデータを整形して追加
baseShop.threads = therapists.map((t, index) => {
  const tags = [`${t.age}歳`];
  if (t.t) tags.push(t.t);
  if (t.b) tags.push(t.b);
  
  return {
    id: 501401 + index,
    therapistName: t.name,
    averageRating: 0,
    postCount: 0,
    tags: tags,
    averageDetailedRatings: { cleanliness: 0, appearance: 0, style: 0, service: 0, skill: 0, intensity: 0 },
    posts: []
  };
});

// 3. 書き出し先の定義（フォルダとエリア情報）
const targets = [
  { dir: 'public/data/tokyo/shinagawa/musashikoyama', city: '【品川区】武蔵小山', address: '東京都品川区' },
  { dir: 'public/data/tokyo/meguro/toritsudaigaku', city: '【目黒区】都立大学', address: '東京都目黒区' },
  { dir: 'public/data/tokyo/nakano/nakanosakaue', city: '【中野区】中野坂上', address: '東京都中野区' },
  { dir: 'public/data/tokyo/shinjuku/nishishinjuku', city: '【新宿区】西新宿', address: '東京都新宿区' }
];

// 4. ファイル生成実行
targets.forEach(target => {
  const shopData = { ...baseShop }; // データをコピー
  shopData.city = target.city;
  shopData.address = target.address;

  // ディレクトリがなければ作成
  if (!fs.existsSync(target.dir)){
      fs.mkdirSync(target.dir, { recursive: true });
  }

  // ファイル書き込み
  const filePath = path.join(target.dir, 'shops.json');
  fs.writeFileSync(filePath, JSON.stringify([shopData], null, 2), 'utf8');
  console.log(`Created: ${filePath} (${target.city})`);
});

