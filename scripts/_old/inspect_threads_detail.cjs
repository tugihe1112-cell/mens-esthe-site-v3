const fs = require('fs');
// ファイルパスはさっき見つかったものを指定
const FILE_PATH = 'public/data/tokyo/toshima/ikebukuro/mens_pastime_ikebukuro.json';

try {
    const content = fs.readFileSync(FILE_PATH, 'utf8');
    const data = JSON.parse(content);
    
    console.log("🔍 'threads' の中身を解析中...");

    if (!data.threads) {
        console.log("❌ threads キーがありません（あれ？）");
    } else if (Array.isArray(data.threads)) {
        console.log(`ℹ️ threads は配列です (要素数: ${data.threads.length})`);
        
        if (data.threads.length > 0) {
            console.log("▼ 最初の要素の中身:");
            console.log(JSON.stringify(data.threads[0], null, 2).slice(0, 500) + "...");
            
            // もしこの中に 'therapists' があったらビンゴ
            if (data.threads[0].therapists) {
                 console.log("\n🎯 ビンゴ！ threads[0].therapists が見つかりました！");
                 console.log(`   数: ${data.threads[0].therapists.length}`);
            }
        }
    } else if (typeof data.threads === 'object') {
        console.log("ℹ️ threads はオブジェクトです。キーを確認:");
        console.log(Object.keys(data.threads));
        
        if (data.threads.therapists) {
             console.log("\n🎯 ビンゴ！ threads.therapists が見つかりました！");
        }
    } else {
        console.log("❓ threads は謎の型です:", typeof data.threads);
    }

} catch (e) {
    console.error("エラー:", e.message);
}
