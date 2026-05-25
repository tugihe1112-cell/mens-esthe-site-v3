const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------
// ⚙️ 設定エリア
// ---------------------------------------------------------
const SOURCE_DIR = path.join(__dirname, 'public/data'); 
const OUTPUT_FILE = path.join(__dirname, 'src/data/all_shops.json');
// ★追加: セラピスト辞書ファイルの場所
const THERAPISTS_FILE = path.join(__dirname, 'src/data/therapists.json');

const IGNORE_LIST = [
  'all_shops.json', 'reviews.json', 'shop_requests.json', 
  '.DS_Store', 'public', 'src', 'node_modules', 'dist'
];

const locationMap = {
  'tokyo': '東京都', 'kanagawa': '神奈川県', 'saitama': '埼玉県', 'chiba': '千葉県', 'osaka': '大阪府', 'aichi': '愛知県', 'hokkaido': '北海道', 'fukuoka': '福岡県',
  'shinjuku': '新宿区', 'shibuya': '渋谷区', 'ikebukuro': '池袋', 'ueno': '上野', 'yokohama': '横浜', 'kawasaki': '川崎', 'nagoya': '名古屋', 'umeda': '梅田', 'namba': '難波', 'sapporo': '札幌', 'hakata': '博多', 'itabashi': '板橋区', 'togane': '東金市'
};

function translate(key) {
  if (IGNORE_LIST.includes(key)) return null;
  return locationMap[key] || key;
}

// ---------------------------------------------------------
// 📖 辞書の読み込み
// ---------------------------------------------------------
let therapistMap = {};
if (fs.existsSync(THERAPISTS_FILE)) {
  try {
    const raw = fs.readFileSync(THERAPISTS_FILE, 'utf8');
    therapistMap = JSON.parse(raw);
    console.log(`📚 Loaded therapist dictionary: ${Object.keys(therapistMap).length} entries`);
  } catch (e) {
    console.warn("⚠️ Failed to load therapists.json:", e.message);
  }
}

// 💡 セラピストデータの正規化ロジック (辞書ルックアップ機能付き)
function normalizeTherapists(shop) {
  let source = [];
  
  // 優先順位: threads(詳細) > therapists(IDリスト)
  if (shop.threads && Array.isArray(shop.threads) && shop.threads.length > 0) {
    source = shop.threads;
  } else if (shop.therapists && Array.isArray(shop.therapists) && shop.therapists.length > 0) {
    source = shop.therapists;
  }

  return source.map((item, index) => {
    // パターン1: 既にオブジェクト ({ id, name, ... })
    if (typeof item === 'object' && item !== null) {
      return {
        id: item.id || item.therapistId || `th_${shop.id}_${index}`,
        name: item.therapistName || item.name || item.title || "不明なセラピスト"
      };
    } 
    // パターン2: 文字列（ID）の場合 -> ★辞書から名前を引く！
    else if (typeof item === 'string') {
      const id = item;
      // 辞書にIDがあればその名前を使う。なければIDのまま。
      const name = therapistMap[id] ? therapistMap[id].name : id;
      
      return {
        id: id,
        name: name 
      };
    }
    return { id: `unknown_${index}`, name: "不明" };
  });
}

// メイン処理
let allShops = [];

function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (IGNORE_LIST.includes(file)) return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      let shop;
      try { shop = JSON.parse(fs.readFileSync(fullPath, 'utf8')); } catch (e) { return; }

      const parts = fullPath.split(path.sep);
      const dataIndex = parts.lastIndexOf('data');

      if (dataIndex !== -1 && parts.length > dataIndex + 2) {
        const prefectureRaw = parts[dataIndex + 1];
        const cityRaw = parts[dataIndex + 2];
        const prefecture = translate(prefectureRaw);
        const city = translate(cityRaw);
        
        if (!prefecture || !city) return;

        shop._fileLocation = [prefecture, city].filter(Boolean).join(' '); 
        shop._rawLocation = [prefectureRaw, cityRaw].filter(Boolean).join('_');
        const fileName = path.basename(file, '.json');
        
        const currentId = String(shop.id || "");
        if (!currentId || !currentId.startsWith(shop._rawLocation)) {
            shop.id = `${shop._rawLocation}_${fileName}`;
        }
        
        if (!shop.prefecture) shop.prefecture = prefecture;
        if (!shop.city) shop.city = city;

        // 正規化実行（辞書を使って名前解決）
        shop.therapists = normalizeTherapists(shop);
        allShops.push(shop);
      }
    }
  });
}

if (fs.existsSync(SOURCE_DIR)) {
  console.log(`🔄 Rebuilding all_shops.json from ${SOURCE_DIR}...`);
  scan(SOURCE_DIR);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allShops, null, 2));
  console.log(`✅ Completed. Output: ${OUTPUT_FILE}`);
  console.log(`📊 Total Shops: ${allShops.length}`);
} else {
  console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
}
