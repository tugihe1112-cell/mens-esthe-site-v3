const fs = require('fs');

console.log("🔍 ロケーションデータの形式検査を開始...");

try {
    const shops = JSON.parse(fs.readFileSync('src/data/all_shops.json', 'utf8'));
    
    const prefStats = {};
    const citySamples = {};

    shops.forEach(s => {
        // 都道府県の集計
        const pref = s.prefecture || "未定義";
        prefStats[pref] = (prefStats[pref] || 0) + 1;

        // 市区町村のサンプル収集 (各都道府県につき最初の5件)
        if (!citySamples[pref]) citySamples[pref] = new Set();
        if (citySamples[pref].size < 5 && s.city) {
            citySamples[pref].add(s.city);
        }
    });

    console.log("\n📊 都道府県データの出現回数 (上位):");
    Object.entries(prefStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([pref, count]) => {
            console.log(`   - "${pref}": ${count}店舗`);
        });

    console.log("\n🏙️ 市区町村データのサンプル (形式確認):");
    Object.entries(citySamples).slice(0, 5).forEach(([pref, cities]) => {
        console.log(`   [${pref}]: ${Array.from(cities).join(", ")}`);
    });

} catch (e) {
    console.error("⚠️ データ読み込みエラー:", e.message);
}
