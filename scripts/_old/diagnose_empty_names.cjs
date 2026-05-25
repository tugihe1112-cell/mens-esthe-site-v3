const fs = require('fs');
const path = require('path');

const THERAPISTS_FILE = 'src/data/therapists.json';
const DATA_DIR = 'public/data';

console.log("🔍 「名前が空っぽ」のセラピストデータを捜索中...\n");

// 1. マスター名簿を読み込み
let masterTherapists = {};
try {
    masterTherapists = JSON.parse(fs.readFileSync(THERAPISTS_FILE, 'utf8'));
} catch (e) {
    console.error("❌ マスター名簿が読み込めません");
    process.exit(1);
}

// 2. 店舗データをスキャン
let suspiciousShops = 0;

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
        
        if (!shop.therapists || !Array.isArray(shop.therapists)) return;

        const emptyNameTherapists = [];

        shop.therapists.forEach(t => {
            // ID指定(文字列)の場合
            if (typeof t === 'string') {
                const data = masterTherapists[t];
                // データはあるが、名前がない、または "名無し" などの場合
                if (data && (!data.name || data.name.trim() === "" || data.name === "名無し" || data.name === "Unknown")) {
                    emptyNameTherapists.push(`${t} (マスタ登録名: "${data.name || '空'}")`);
                }
            } 
            // オブジェクト直接指定の場合
            else if (typeof t === 'object') {
                 if (!t.name || t.name.trim() === "") {
                     emptyNameTherapists.push("直接埋め込みデータ (名前なし)");
                 }
            }
        });

        if (emptyNameTherapists.length > 0) {
            suspiciousShops++;
            console.log(`⚠️  [名前欠損] ${shop.name}`);
            console.log(`    場所: ${fullPath}`);
            console.log(`    該当セラピスト: ${emptyNameTherapists.slice(0, 3).join(', ')}`);
            console.log('---------------------------------------------------');
        }

      } catch (e) {}
    }
  });
}

scan(DATA_DIR);

if (suspiciousShops === 0) {
    console.log("✅ 名前が空のデータは見つかりませんでした。");
} else {
    console.log(`\n❌ 合計 ${suspiciousShops} 店舗で「名前のないセラピスト」が見つかりました。`);
}
