const fs = require('fs');
const path = require('path');

const OUTPUT_LIST = 'src/data/all_shops.json';
const OUTPUT_DETAILS = 'src/data/brand_details.json';
const DATA_DIR = 'public/data';
const THERAPISTS_FILE = 'src/data/therapists.json';

console.log("🚀 Dual-View Build (Ver.11 最終版): 再構築を開始します...");

let masterTherapists = {};
if (fs.existsSync(THERAPISTS_FILE)) {
    try {
        masterTherapists = JSON.parse(fs.readFileSync(THERAPISTS_FILE, 'utf8'));
        console.log(`📚 マスタセラピスト: ${Object.keys(masterTherapists).length}件読み込み`);
    } catch (e) {
        console.error("⚠️ セラピスト名簿の読み込みに失敗しました:", e.message);
    }
}

const locationMap = {
    "tokyo": "東京都", "kanagawa": "神奈川県", "saitama": "埼玉県", 
    "chiba": "千葉県", "aichi": "愛知県", "osaka": "大阪府",
    "fukui": "福井県", "shiga": "滋賀県", "shizuoka": "静岡県", "miyagi": "宮城県",
    "minato": "港区", "chuo": "中央区", "shinjuku": "新宿区", 
    "toshima": "豊島区", "shibuya": "渋谷区", "adachi": "足立区",
    "arakawa": "荒川区", "chiyoda": "千代田区", "koto": "江東区",
    "meguro": "目黒区", "nerima": "練馬区", "ota": "大田区",
    "setagaya": "世田谷区", "shinagawa": "品川区", "suginami": "杉並区",
    "sumida": "墨田区", "taito": "台東区",
    "musashino": "武蔵野", "tachikawa": "立川", "tama": "多摩", "toyosu": "豊洲",
    "funabashi": "船橋", "matsudo": "松戸", "kashiwa": "柏", 
    "narita": "成田", "togane": "東金", "nishifunabashi": "西船橋",
    "kuki": "久喜", "saitama-minami": "さいたま南",
    "atsugi": "厚木", "kawasaki": "川崎", "sagamihara": "相模原", "yokohama": "横浜",
    "nagoya": "名古屋", "naka": "中区", "kita": "北区", 
    "nishi": "西区", "higashi": "東区", "minami": "南区",
    "sakae": "栄", "nishiki": "錦", "meieki": "名駅", 
    "kanayama": "金山", "fushimi": "伏見", "chikusa": "千種",
    "umeda": "梅田", "namba": "難波", "shinsaibashi": "心斎橋",
    "tennoji": "天王寺", "kyobashi": "京橋",
    "roppongi": "六本木", "ginza": "銀座", "ikebukuro": "池袋"
};

const EXCLUDED_DIRS = new Set(['data', 'public', 'src', 'node_modules']);

const translate = (key) => {
    if (!key) return "";
    const lower = key.toLowerCase();
    if (EXCLUDED_DIRS.has(lower)) return "";
    return locationMap[lower] || key;
};

const rawShops = [];
function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);
        const shop = Array.isArray(data) ? data[0] : data;
        if (!shop.name) return;
        
        const parts = fullPath.split(path.sep);
        if (parts.length >= 4) {
             shop._rawLocation = {
                 prefecture: parts[parts.length - 4],
                 city: parts[parts.length - 3],
                 area: parts[parts.length - 2]
             };
             shop._fileLocation = {
                 prefecture: translate(parts[parts.length - 4]),
                 city: translate(parts[parts.length - 3]),
                 area: translate(parts[parts.length - 2]),
                 address: shop.address
             };
        }
        
        if ((!shop.therapists || shop.therapists.length === 0) && shop.threads && Array.isArray(shop.threads)) {
            shop.therapists = shop.threads;
            console.log(`🔄 threads変換: ${shop.name} (${shop.threads.length}人)`);
        }

        rawShops.push(shop);
      } catch (e) {
        console.error(`⚠️ ファイル読み込みエラー: ${fullPath}`, e.message);
      }
    }
  });
}
scan(DATA_DIR);

console.log(`📦 スキャン完了: ${rawShops.length}店舗`);

const normalizeBrandName = (name) => {
    if (!name) return "Unknown";
    return name
        .replace(/\s*(六本木|銀座|池袋|渋谷|新宿|上野|横浜|大阪|名古屋|栄|錦|千種|伏見|梅田|難波|心斎橋|天王寺|京橋)店?$/g, '')
        .replace(/[（(].*[）)]/g, '')
        .replace(/\s+/g, '')
        .trim();
};

const generateAddress = (loc) => {
    const parts = [loc.prefecture, loc.city, loc.area].filter(p => p && p.trim());
    if (!loc.address || loc.address === "不明" || loc.address.length < 5 || /^[a-zA-Z]+$/.test(loc.address)) {
        return parts.length > 0 ? `${parts.join('')}周辺` : "不明";
    }
    return loc.address;
};

const brandMap = new Map();
rawShops.forEach(shop => {
    const brandKey = normalizeBrandName(shop.name);
    if (!brandMap.has(brandKey)) brandMap.set(brandKey, []);
    brandMap.get(brandKey).push(shop);
});

const searchList = [];
const brandDetails = {};
const usedIds = new Set(); 

brandMap.forEach((shops, brandKey) => {
    const brandId = `brand_${Buffer.from(brandKey).toString('hex').slice(0, 12)}`;
    
    const mergedData = { 
        id: brandId,
        name: brandKey,
        locations: [],
        therapists: [],
        searchKeywords: [],
        mainImage: shops[0].mainImage,
        description: shops[0].description
    };

    const therapistMap = new Map();

    shops.forEach(shop => {
        if (shop._fileLocation) {
            const { prefecture, city, area } = shop._fileLocation;
            [area, city, prefecture].forEach(loc => {
                if (loc && loc.trim()) {
                    mergedData.searchKeywords.push(loc);
                }
            });

            const exists = mergedData.locations.some(l => 
                l.area === area && l.city === city && l.prefecture === prefecture
            );
            
            if (!exists && (area || city || prefecture)) {
                mergedData.locations.push({
                    ...shop._fileLocation,
                    address: generateAddress(shop._fileLocation)
                });
            }
        }
        
        if (shop.therapists && Array.isArray(shop.therapists)) {
            shop.therapists.forEach(t => {
                let therapistData = null;
                
                if (typeof t === 'string') {
                    therapistData = masterTherapists[t];
                    if (!therapistData) {
                        console.warn(`⚠️  ID未発見: ${t} in ${shop.name}`);
                    }
                } 
                else if (typeof t === 'object' && t !== null) {
                    therapistData = t;
                }

                if (therapistData) {
                    const realName = therapistData.name || therapistData.therapistName;
                    if (realName) {
                        const unifiedData = {
                            ...therapistData,
                            name: realName,
                            id: therapistData.id || `${realName}_${therapistData.age || 'unknown'}`
                        };
                        const tKey = unifiedData.id;
                        if (!therapistMap.has(tKey)) {
                            therapistMap.set(tKey, unifiedData);
                        }
                    }
                }
            });
        }
    });
    
    mergedData.therapists = Array.from(therapistMap.values());
    brandDetails[brandId] = mergedData;
    
    if (mergedData.therapists.length > 0) {
        console.log(`✅ ${brandKey}: ${mergedData.therapists.length}人`);
    }

    shops.forEach((shop, index) => {
        const { therapists, ...lightShop } = shop;
        
        let uniqueId = String(shop.id);
        
        if (usedIds.has(uniqueId)) {
            const suffix = shop._rawLocation?.area ? `_${shop._rawLocation.area}` : `_${index}`;
            uniqueId = `${shop.id}${suffix}`;
        }
        
        let counter = 1;
        while (usedIds.has(uniqueId)) { 
            uniqueId = `${shop.id}_${counter++}`; 
        }
        usedIds.add(uniqueId);

        const overwriteLocation = {};
        let displayName = lightShop.name;
        
        if (shop._fileLocation) {
            const { prefecture, city, area } = shop._fileLocation;
            
            if (prefecture) overwriteLocation.prefecture = prefecture;
            if (city) overwriteLocation.city = city;
            if (area) overwriteLocation.area = area;
            
            overwriteLocation.address = generateAddress(shop._fileLocation);
            
            if (area && !displayName.includes(area)) {
                displayName = `${displayName} ${area}店`;
            }
        }

        const listItem = {
            ...lightShop,
            ...overwriteLocation,
            name: displayName,
            id: uniqueId,
            brandId: brandId
        };
        searchList.push(listItem);
    });
});

Object.values(brandDetails).forEach(brand => {
    brand.searchKeywords = [...new Set(brand.searchKeywords.filter(k => k && k.trim()))];
});

fs.writeFileSync(OUTPUT_LIST, JSON.stringify(searchList, null, 2));
fs.writeFileSync(OUTPUT_DETAILS, JSON.stringify(brandDetails, null, 2));

console.log(`\n✅ 完了: ${searchList.length}件の店舗、${Object.keys(brandDetails).length}ブランドを生成しました`);

const totalTherapists = Object.values(brandDetails).reduce((sum, b) => sum + b.therapists.length, 0);
console.log(`�� セラピスト総数: ${totalTherapists}人`);
