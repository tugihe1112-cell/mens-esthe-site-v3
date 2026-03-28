const fs = require('fs');
const path = require('path');
const DATA_DIR = 'public/data';

console.log("🔍 「メンズパスタイム」のデータ構造を解析します...\n");

function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        // 文字列検索でヒットするファイルを対象にする
        if (content.includes("メンズパスタイム") || content.includes("Men's Pastime")) {
            const data = JSON.parse(content);
            console.log(`📂 発見しました: ${fullPath}`);
            
            // 中身のキー（項目名）を一覧表示
            console.log("🔑 データのキー一覧:", Object.keys(data));

            // もし "thread" というキーがあれば、その中身も確認
            if (data.thread) {
                console.log("\n⚠️ 'thread' キーが見つかりました！中身を確認します:");
                console.log("   threadの中のキー:", Object.keys(data.thread));
                if (data.thread.therapists) {
                    console.log(`   thread.therapists の数: ${data.thread.therapists.length}`);
                }
            } else {
                // threadがない場合、直下のtherapistsを確認
                if (data.therapists) {
                    console.log(`ℹ️ 直下の therapists の数: ${data.therapists.length}`);
                } else {
                    console.log("❌ 直下に therapists がありません。");
                }
            }
            console.log("\n---------------------------------------------------");
        }
      } catch (e) {}
    }
  });
}

scan(DATA_DIR);
