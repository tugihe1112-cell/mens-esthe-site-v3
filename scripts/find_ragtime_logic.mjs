import fs from 'fs';
import path from 'path';

function search(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === 'dist') continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) search(p);
    else if (p.endsWith('.jsx') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.ts')) {
      const text = fs.readFileSync(p, 'utf8');
      
      // ragtimeが含まれているファイルを探し出す
      if (text.toLowerCase().includes('ragtime')) {
        const lines = text.split('\n');
        // ragtimeの文字がある行の前後を広めに抽出して、HTML（JSX）の構造を見る
        const idx = lines.findIndex(l => l.toLowerCase().includes('ragtime'));
        if (idx !== -1) {
          console.log(`\n🎯 【お手本コード発見】: ${p}`);
          console.log('--------------------------------------------------');
          console.log(lines.slice(Math.max(0, idx - 5), Math.min(lines.length, idx + 10)).join('\n'));
          console.log('--------------------------------------------------');
        }
      }
    }
  }
}
console.log('🔍 「ラグタイム（ragtime）」の完璧なロゴ実装コードを探しています...');
search('src');
