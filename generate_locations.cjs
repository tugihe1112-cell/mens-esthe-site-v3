const fs = require('fs');
const path = require('path');

const dataRoot = path.join(__dirname, 'public/data');
const locationsFile = path.join(__dirname, 'src/data/locations.js');

const WARDS = {};
const LOCATION_DATA = {};
const cityToJapanese = {};

const ALL_PREFS = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県",
  "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

ALL_PREFS.forEach(p => WARDS[p] = []);

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (item.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const p = data.prefecture;
      const c = data.city;
      
      if (p && ALL_PREFS.includes(p)) {
        if (!WARDS[p].includes(c)) WARDS[p].push(c);
        if (!LOCATION_DATA[c]) LOCATION_DATA[c] = [];
        if (Array.isArray(data.area)) {
          data.area.forEach(a => {
            if (!LOCATION_DATA[c].includes(a)) LOCATION_DATA[c].push(a);
            cityToJapanese[a] = a; 
          });
        }
        cityToJapanese[c] = c;
      }
    }
  });
}

scan(dataRoot);

// 現在のプログラムが期待している「WARD_GROUPS」という名前で書き出す
const content = `
export const WARD_GROUPS = [
  { region: "北海道・東北", prefs: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] },
  { region: "関東", prefs: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"] },
  { region: "中部・北陸", prefs: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"] },
  { region: "関西", prefs: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] },
  { region: "中国・四国", prefs: ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"] },
  { region: "九州・沖縄", prefs: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"] }
];

export const WARDS = ${JSON.stringify(WARDS, null, 2)};
export const LOCATION_DATA = ${JSON.stringify(LOCATION_DATA, null, 2)};
export const cityToJapanese = ${JSON.stringify(cityToJapanese, null, 2)};
`;

fs.writeFileSync(locationsFile, content, 'utf8');
console.log('✅ WARD_GROUPS 形式でメニューを再生成しました。');
