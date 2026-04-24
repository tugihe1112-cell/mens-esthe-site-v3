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
      
      // 'logo' または SupabaseのストレージURLの断片 を含む行を抽出
      if (text.toLowerCase().includes('logo') || text.includes('shop-logos')) {
        const lines = text.split('\n');
        const idx = lines.findIndex(l => l.toLowerCase().includes('logo') || l.includes('shop-logos'));
        if (idx !== -1) {
          console.log(`\n🎯 発見: ${p}`);
          console.log('--------------------------------------------------');
          console.log(lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 5)).join('\n'));
          console.log('--------------------------------------------------');
        }
      }
    }
  }
}
console.log('🔍 プロジェクト内のロゴ設定（過去の仕様）を探しています...');
search('src');
