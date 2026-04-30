import fs from 'fs';
import path from 'path';

function search(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) search(p);
    else if (p.endsWith('.jsx') || p.endsWith('.tsx')) {
      const text = fs.readFileSync(p, 'utf8');
      if (text.includes('shop.')) {
        let lines = text.split('\n');
        let matched = false;
        lines.forEach((line, i) => {
          // 画像やセラピスト人数に関わりそうな変数名を探す
          if (line.includes('shop.') && (
              line.includes('image') || 
              line.includes('logo') || 
              line.includes('photo') || 
              line.includes('length') || 
              line.includes('cast') || 
              line.includes('therapist')
          )) {
            if (!matched) console.log('\n📄 ' + p);
            console.log('   行' + (i+1) + ': ' + line.trim());
            matched = true;
          }
        });
      }
    }
  });
}

console.log('🔍 店舗カードが要求している変数名を調査します...');
search('src/components');
search('src/pages');
