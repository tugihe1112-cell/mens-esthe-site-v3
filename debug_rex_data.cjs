const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'src/data/all_shops.json');
console.log(`📂 データファイル: ${FILE_PATH}`);

try {
    const rawData = fs.readFileSync(FILE_PATH, 'utf8');
    const allData = JSON.parse(rawData);
    
    // データが配列かオブジェクトかで処理を分ける
    const shops = Array.isArray(allData) ? allData : Object.values(allData);
    console.log(`📊 全店舗数: ${shops.length}`);

    // Rex池袋店を探す
    const targetId = "tokyo_toshima_ikebukuro_rex";
    const shop = shops.find(s => s.id === targetId);

    if (!shop) {
        console.log(`❌ 店舗ID "${targetId}" がファイル内に見つかりません！`);
        process.exit(1);
    }

    console.log(`\n✅ 店舗発見: ${shop.name}`);
    console.log(`   - ID: ${shop.id}`);
    
    // threads（セラピストリスト）の状態チェック
    if (!shop.threads) {
        console.log(`❌ 異常: "threads" プロパティが存在しません！`);
        console.log(`   👉 持っているキー一覧: ${Object.keys(shop).join(", ")}`);
    } else if (!Array.isArray(shop.threads)) {
        console.log(`❌ 異常: "threads" が配列ではありません (型: ${typeof shop.threads})`);
    } else {
        console.log(`ℹ️ "threads" 配列の長さ: ${shop.threads.length} 件`);
        
        if (shop.threads.length === 0) {
            console.log(`❌ 異常: 配列はありますが、中身が空っぽ(0人)です。`);
            // もしかして別の場所にいる？
            console.log(`   👉 他のキーに入っていないか確認: ${Object.keys(shop).join(", ")}`);
        } else {
            console.log(`✅ 正常: セラピストデータが含まれています。`);
            console.log(`   - 1人目: ${shop.threads[0].therapistName} (ID: ${shop.threads[0].id})`);
        }
    }

} catch (e) {
    console.error("エラー:", e.message);
}
