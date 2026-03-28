const fs = require('fs');
const path = require('path');
const DATA_DIR = 'public/data';

console.log("🔍 「メンズパスタイム」全店舗のデータ生存確認中...\n");

let foundCount = 0;

function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        // ファイル名か中身に「メンズパスタイム」が含まれるか
        if (file.includes('mens_pastime') || content.includes('メンズパスタイム')) {
            const data = JSON.parse(content);
            const shopName = data.name || "不明";
            
            // 1. 直下の therapists
            const directCount = (data.therapists && Array.isArray(data.therapists)) ? data.therapists.length : 0;
            
            // 2. threads の中の therapists (隠し部屋)
            let threadCount = 0;
            if (data.threads && Array.isArray(data.threads)) {
                threadCount = data.threads.length;
            } else if (data.thread && typeof data.thread === 'object') {
                // threadオブジェクトの場合のカウント（構造によるが、とりあえず1扱いか中身を見る）
                threadCount = 1; 
            }

            console.log(`🏢 店舗名: ${shopName}`);
            console.log(`   パス: ${fullPath}`);
            console.log(`   - 直下のリスト(therapists): ${directCount} 人`);
            console.log(`   - 隠しリスト(threads)     : ${threadCount} 人`);
            
            if (directCount === 0 && threadCount === 0) {
                console.log("   ❌ データなし (空っぽです)");
            } else {
                console.log("   ✅ データあり");
            }
            console.log("---------------------------------------------------");
            foundCount++;
        }
      } catch (e) {}
    }
  });
}

scan(DATA_DIR);

if (foundCount === 0) {
    console.log("⚠️ 「メンズパスタイム」のデータファイル自体が見つかりませんでした。");
}
