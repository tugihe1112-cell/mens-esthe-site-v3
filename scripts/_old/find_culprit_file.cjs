const fs = require('fs');
const path = require('path');

// 検索するディレクトリ
const searchDirs = ['src', 'public'];
const targetString = "tanimachi9";

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
    } else if (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(targetString)) {
          console.log(`🎯 発見！ "${targetString}" はこのファイルにいます:`);
          console.log(`   --> ${fullPath}`);
          
          // ついでにその行を表示
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes(targetString)) {
              console.log(`       (Line ${idx + 1}): ${line.trim().substring(0, 100)}...`);
            }
          });
        }
      } catch (e) {
        // 読み込みエラーは無視
      }
    }
  });
}

console.log(`�� プロジェクト内から "${targetString}" を捜索中...`);
searchDirs.forEach(d => searchInDir(d));
console.log("---------------------------------------------------");
