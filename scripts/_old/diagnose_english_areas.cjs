const fs = require('fs');
const path = require('path');

// 調査対象の横文字（スクリーンショットから抽出）
const TARGET_WORDS = [
  // 神奈川
  "atsugi", "honatsugi", "kawasaki", "yokohama", "fujisawa",
  // 埼玉
  "omiya", "kawagoe",
  // 愛知
  "nagoya", "sakae", "nishiki",
  // 兵庫
  "kobe", "himeji", "sannomiya",
  // 京都
  "kyoto", "nijo",
  // 福岡
  "hakata", "kokura",
  // 宮城
  "sendai"
];

const SEARCH_DIRS = ['src/data', 'public/data'];

console.log("🔍 データの汚染状況を調査します...\n");

function searchInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);
    
    // ヒットした単語を記録
    const hits = [];
    
    TARGET_WORDS.forEach(word => {
      // "city": "atsugi" や "area": "atsugi" のような形を探す
      // 誤検知を防ぐため、クォートで囲まれた完全一致をチェック
      const regex = new RegExp(`["']${word}["']`);
      if (regex.test(content)) {
        hits.push(word);
      }
    });

    if (hits.length > 0) {
      console.log(`⚠️ 発見: ${filePath}`);
      // 最初の数個だけ表示して詳細を示す
      console.log(`   --> 含まれている横文字: ${hits.slice(0, 5).join(", ")}${hits.length > 5 ? "..." : ""}`);
      
      // index.jsなどの巨大ファイルは行数も出すと分かりやすい
      if (filename === 'index.js' || filename === 'all_shops.json') {
         const lines = content.split('\n');
         let count = 0;
         lines.forEach((line, idx) => {
           if (count < 3 && hits.some(h => line.includes(`"${h}"`))) {
             console.log(`       Line ${idx+1}: ${line.trim().substring(0, 60)}...`);
             count++;
           }
         });
      }
      console.log(""); 
    }

  } catch (e) {
    // 読み込みエラーは無視
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.json')) {
      searchInFile(fullPath);
    }
  });
}

SEARCH_DIRS.forEach(d => walkDir(d));
console.log("調査完了。");
