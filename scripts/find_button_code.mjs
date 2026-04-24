import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      searchDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // ボタンの文字やURL変数名が含まれているファイルを探す
      if (content.includes('OFFICIAL WEBSITE') || content.includes('出勤情報')) {
         const lines = content.split('\n');
         const idx = lines.findIndex(l => l.includes('OFFICIAL WEBSITE') || l.includes('出勤情報'));
         
         if (idx !== -1) {
           console.log(`\n🎯 発見: ${fullPath}`);
           console.log('--------------------------------------------------');
           const start = Math.max(0, idx - 15);
           const end = Math.min(lines.length, idx + 20);
           console.log(lines.slice(start, end).join('\n'));
           console.log('--------------------------------------------------');
         }
      }
    }
  }
}

console.log('🔍 ボタンを描画しているReactコードを検索します...');
searchDir('src');
