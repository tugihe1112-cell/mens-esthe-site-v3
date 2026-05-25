const fs = require('fs');
const path = require('path');

// ==========================================
// 設定: 修正したい文字列ペア
// ==========================================
const REPLACEMENTS = {
  "tanimachi9": "谷町九丁目",
  "umeda": "梅田",
  "namba": "難波",
  "shinsaibashi": "心斎橋",
  "nihonbashi": "日本橋",
  "kyobashi": "京橋",
  "juso": "十三",
  "esaka": "江坂",
  "shin-osaka": "新大阪",
  
  // 東京エリアの残りカスも念のため
  "kitasenju": "北千住",
  "kinshicho": "錦糸町",
  "gotanda": "五反田"
};

// ==========================================
// 処理: 再帰的にディレクトリを探索して置換
// ==========================================
const targetDirs = ['src/data', 'public/data'];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // 全てのペアについて置換を実行
    Object.keys(REPLACEMENTS).forEach(key => {
      // 引用符で囲まれた部分だけを狙い撃ち (誤爆防止)
      // 例: "area": "tanimachi9" -> "area": "谷町九丁目"
      
      // 正規表現: "key" または 'key' を置換
      const regex = new RegExp(`(["'])${key}(["'])`, 'g');
      content = content.replace(regex, `$1${REPLACEMENTS[key]}$2`);
      
      // locations.js などの配列内の文字列も置換
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 修正しました: ${filePath}`);
    }
  } catch (e) {
    console.error(`エラー (${filePath}):`, e.message);
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
    } else if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.ts')) {
      processFile(fullPath);
    }
  });
}

console.log("🧹 データ大掃除を開始します...");
targetDirs.forEach(d => walkDir(d));
console.log("🎉 完了しました！");
