const fs = require('fs');

console.log("🔍 セラピストデータ構造の検査を開始します...");

try {
    const shops = JSON.parse(fs.readFileSync('src/data/all_shops.json', 'utf8'));
    
    let totalTherapists = 0;
    let keyStats = {};
    let hasPostsCount = 0;
    let sampleTherapist = null;

    shops.forEach(shop => {
        if (shop.therapists && Array.isArray(shop.therapists)) {
            shop.therapists.forEach(t => {
                totalTherapists++;
                
                // キーの出現頻度を集計
                Object.keys(t).forEach(key => {
                    keyStats[key] = (keyStats[key] || 0) + 1;
                });

                // posts（口コミ/日記）の有無
                if (t.posts && Array.isArray(t.posts) && t.posts.length > 0) {
                    hasPostsCount++;
                }

                // サンプルデータの取得（最初の1人だけ）
                if (!sampleTherapist) sampleTherapist = t;
            });
        }
    });

    console.log(`\n📊 検査結果: 全 ${shops.length} 店舗中`);
    console.log(`👨‍⚕️ 総セラピスト数: ${totalTherapists} 名`);
    console.log("\n🔑 キーの出現回数 (上位):");
    Object.entries(keyStats)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => {
            console.log(`   - ${key}: ${count}回`);
        });

    console.log(`\n📝 口コミ(posts)あり: ${hasPostsCount} 名`);
    
    console.log("\n📄 データサンプル (1件):");
    console.log(JSON.stringify(sampleTherapist, null, 2));

} catch (e) {
    console.error("⚠️ エラー:", e.message);
}
