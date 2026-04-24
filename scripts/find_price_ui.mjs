import fs from 'fs';
import path from 'path';

function search(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === 'dist') continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) search(p);
    else if (p.endsWith('.jsx') || p.endsWith('.tsx')) {
      const text = fs.readFileSync(p, 'utf8');
      // PRICEという文字が含まれている箇所を探す
      if (text.includes('SHOP INFORMATION') || (text.includes('HOURS') && text.includes('PRICE'))) {
        const lines = text.split('\n');
        const idx = lines.findIndex(l => l.includes('PRICE'));
        if (idx !== -1) {
          console.log(`\n🎯 発見: ${p}`);
          console.log('--------------------------------------------------');
          console.log(lines.slice(Math.max(0, idx - 5), Math.min(lines.length, idx + 15)).join('\n'));
          console.log('--------------------------------------------------');
        }
      }
    }
  }
}
console.log('🔍 料金表のUIコードを探しています...');
search('src');
