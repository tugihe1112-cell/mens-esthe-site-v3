const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data';

// 集計用変数
const stats = {
  totalTherapists: 0,
  patterns: {}, 
  shopsWithoutBrand: [],
  idCollisions: {} 
};

// IDのパターンを判定する関数
function getPatternType(id) {
  if (!id) return 'NO_ID';
  if (String(id).match(/^[0-9]+-[0-9]+$/)) return 'NUMERIC_HYPHEN (ex: 1035-1)';
  if (String(id).match(/^[0-9]+$/)) return 'NUMERIC_ONLY (ex: 123)';
  if (String(id).includes('_')) return 'UNDERSCORE_STRING (ex: brand_name)';
  return 'OTHER_STRING';
}

console.log("🔍 データ構造の徹底調査を開始します...\n");

function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);
        const shop = Array.isArray(data) ? data[0] : data;

        if (shop.therapists && Array.isArray(shop.therapists)) {
          shop.therapists.forEach(t => {
            if (typeof t === 'string') {
              recordPattern('ALREADY_NORMALIZED (String ID)', t, shop);
            } else {
              stats.totalTherapists++;
              const pattern = getPatternType(t.id);
              recordPattern(pattern, t.id, shop, t.name);
            }
          });
        }
      } catch (e) {
        console.error(`Error reading ${fullPath}:`, e.message);
      }
    }
  });
}

function recordPattern(type, id, shop, name) {
  if (!stats.patterns[type]) {
    stats.patterns[type] = { count: 0, samples: [] };
  }
  stats.patterns[type].count++;
  
  if (stats.patterns[type].samples.length < 3) {
    stats.patterns[type].samples.push({
      id: id,
      name: name,
      shop: shop.name,
      brandId: shop.brandId || 'なし'
    });
  }
}

if (fs.existsSync(DATA_DIR)) {
  scan(DATA_DIR);
} else {
  console.log(`❌ ディレクトリが見つかりません: ${DATA_DIR}`);
}

console.log("📊 IDパターン調査結果レポート");
console.log("===================================================");
console.log(`総セラピスト数 (オブジェクト形式): ${stats.totalTherapists}`);
console.log("===================================================\n");

Object.keys(stats.patterns).forEach(type => {
  const data = stats.patterns[type];
  console.log(`🔹 パターン: [ ${type} ]`);
  console.log(`   件数: ${data.count}`);
  console.log(`   サンプル:`);
  data.samples.forEach(s => {
    console.log(`     - ID: ${String(s.id).padEnd(25)} | 名前: ${s.name} | 店舗: ${s.shop}`);
  });
  console.log("---------------------------------------------------");
});
