const fs = require('fs');

// ウルレア巣鴨のファイルパス
const TARGET_FILE = 'public/data/tokyo/toshima/sugamo/ulrare_sugamo.json';

try {
    if (!fs.existsSync(TARGET_FILE)) {
        console.error("❌ ファイルが見つかりません:", TARGET_FILE);
        process.exit(1);
    }

    const shop = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
    console.log(`📂 対象店舗: ${shop.name}`);
    console.log(`   現在のセラピスト数: ${shop.therapists ? shop.therapists.length : 0}`);

    // 強制的にテストデータを注入
    shop.therapists = [
        {
            "id": "test_01",
            "therapistName": "テスト花子",
            "age": "20",
            "types": ["癒やし系", "スレンダー"],
            "image": "/images/no_image.png"
        },
        {
            "id": "test_02",
            "therapistName": "サンプル愛",
            "age": "25",
            "types": ["美人", "モデル級"],
            "image": "/images/no_image.png"
        }
    ];

    fs.writeFileSync(TARGET_FILE, JSON.stringify(shop, null, 2));
    console.log(`✅ テスト用セラピスト2名を注入しました！`);

} catch (e) {
    console.error("❌ エラーが発生しました:", e);
}
