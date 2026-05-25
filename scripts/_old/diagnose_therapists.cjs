const fs = require('fs');
const path = require('path');

const THERAPISTS_FILE = 'src/data/therapists.json';
const DATA_DIR = 'public/data';

console.log("🔍 セラピストデータのリンク切れ診断を開始します...\n");

let masterKeys = new Set();
try {
    const master = JSON.parse(fs.readFileSync(THERAPISTS_FILE, 'utf8'));
    masterKeys = new Set(Object.keys(master));
    console.log(`📖 マスター名簿: ${masterKeys.size} 名のデータをロード済み`);
} catch (e) {
    console.error("❌ マスター名簿 (src/data/therapists.json) が読み込めません！");
    process.exit(1);
}

let brokenShops = 0;
let totalMissingTherapists = 0;

function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const shop = JSON.parse(content);
        
        if (!shop.therapists || !Array.isArray(shop.therapists) || shop.therapists.length === 0) return;
        if (typeof shop.therapists[0] !== 'string') return;

        const missingIds = [];
        shop.therapists.forEach(id => {
            if (!masterKeys.has(id)) {
                missingIds.push(id);
            }
        });

        if (missingIds.length > 0) {
            brokenShops++;
            totalMissingTherapists += missingIds.length;
            console.log(`⚠️  [欠損] ${shop.name}`);
            console.log(`    場所: ${fullPath}`);
            console.log(`    不明なID: ${missingIds.slice(0, 3).join(', ')}${missingIds.length > 3 ? '...' : ''}`);
            console.log('---------------------------------------------------');
        }

      } catch (e) {}
    }
  });
}

console.log("\n📋 調査結果:");
scan(DATA_DIR);

console.log(`\n=============================================`);
if (brokenShops === 0) {
    console.log("✅ リンク切れはありません。全てのIDが名簿に存在します。");
} else {
    console.log(`❌ 合計 ${brokenShops} 店舗でリンク切れが見つかりました。`);
    console.log(`   (名簿に載っていないIDが ${totalMissingTherapists} 件あります)`);
}
