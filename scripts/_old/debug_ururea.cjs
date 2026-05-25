const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data';
const THERAPISTS_FILE = 'src/data/therapists.json';
const TARGET_NAME = "ウルレア"; // 検索対象

console.log(`🔍 「${TARGET_NAME}」のデータ不整合を調査します...\n`);

// 1. マスタ読み込み
let masterTherapists = {};
try {
    masterTherapists = JSON.parse(fs.readFileSync(THERAPISTS_FILE, 'utf8'));
    console.log(`📚 セラピスト名簿: 読み込み完了 (${Object.keys(masterTherapists).length}件)`);
} catch (e) {
    console.error("❌ 名簿読み込み失敗");
}

// 2. 店舗ファイルを探して診断
function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(TARGET_NAME)) {
            const shop = JSON.parse(content);
            console.log(`\n📂 発見したファイル: ${fullPath}`);
            console.log(`   店名: ${shop.name}`);

            // データ構造チェック
            const therapists = shop.therapists || [];
            const threads = shop.threads || [];
            
            console.log(`   - shop.therapists: ${Array.isArray(therapists) ? therapists.length : 'なし'} 件`);
            console.log(`   - shop.threads:    ${Array.isArray(threads) ? threads.length : 'なし'} 件`);

            // セラピスト詳細チェック
            if (Array.isArray(therapists) && therapists.length > 0) {
                console.log(`\n   🕵️‍♀️ セラピストデータの詳細診断:`);
                therapists.forEach((t, i) => {
                    if (i >= 5) return; // 最初の5件だけ表示
                    
                    if (typeof t === 'string') {
                        const exists = !!masterTherapists[t];
                        console.log(`     [${i+1}] ID: "${t}" -> 名簿に存在するか: ${exists ? "✅ YES" : "❌ NO"}`);
                        if (!exists) {
                             console.log(`        (原因: このIDが therapists.json に登録されていません)`);
                        }
                    } else if (typeof t === 'object') {
                        console.log(`     [${i+1}] オブジェクトデータ (名前: ${t.name || t.therapistName || "なし"}) -> ✅ OK`);
                    }
                });
            } else if (Array.isArray(threads) && threads.length > 0) {
                 console.log(`\n   💡 ヒント: threads にデータがあります。スクリプト(Ver.17)なら救出できるはずです。`);
            } else {
                 console.log(`\n   ❌ 原因: 元データにセラピスト情報が一切ありません。`);
            }
        }
      } catch (e) {}
    }
  });
}

scan(DATA_DIR);
