const fs = require('fs');
const path = require('path');

// 検索対象のディレクトリ
const TARGET_DIRS = ['src'];
// 検索する拡張子
const TARGET_EXTS = ['.js', '.jsx', '.ts', '.tsx'];

function searchInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchInDir(fullPath);
      }
    } else if (TARGET_EXTS.includes(path.extname(file))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // フィルターロジックがありそうな行を探す
      // キーワード: filter, therapists, bust, age, some
      if (content.includes('therapists') && (content.includes('filter') || content.includes('some'))) {
        console.log(`\n📄 ファイル: ${fullPath}`);
        console.log("---------------------------------------------------");
        
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          // 関連する行だけ表示（前後も含めると分かりやすいが、まずは該当行のみ）
          if ((line.includes('therapists') || line.includes('bust') || line.includes('age')) && 
              (line.includes('filter') || line.includes('some') || line.includes('map') || line.includes('>'))) {
            console.log(`${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

console.log("🔍 フィルターロジックの構造解析を開始します...");
TARGET_DIRS.forEach(d => searchInDir(d));
console.log("\n✅ 解析完了");
