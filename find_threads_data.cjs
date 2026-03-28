const fs = require('fs');
const path = require('path');
const DATA_DIR = 'public/data';

console.log("🔍 'threads' または 'thread' にデータがある店舗を探します...\n");

function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(content);
        
        // threads (配列) があって、中身が入っているか？
        if (data.threads && Array.isArray(data.threads) && data.threads.length > 0) {
            console.log(`📂 発見 (threads配列): ${data.name}`);
            console.log(`   パス: ${fullPath}`);
            console.log(`   要素数: ${data.threads.length}`);
            
            // 中身の構造をチラ見せ
            const sample = data.threads[0];
            console.log("   ▼ 中身のサンプルキー:", Object.keys(sample));
            
            // もしこの中に 'therapists' があればビンゴ
            if (sample.therapists) {
                console.log(`   🎯 ビンゴ！ threads[0].therapists に ${sample.therapists.length} 件のデータあり`);
            }
            console.log("---------------------------------------------------");
        }
        
        // thread (オブジェクト) があるか？
        else if (data.thread && typeof data.thread === 'object') {
             console.log(`📂 発見 (threadオブジェクト): ${data.name}`);
             console.log(`   パス: ${fullPath}`);
             console.log("   ▼ 中身のキー:", Object.keys(data.thread));
             console.log("---------------------------------------------------");
        }

      } catch (e) {}
    }
  });
}

scan(DATA_DIR);
