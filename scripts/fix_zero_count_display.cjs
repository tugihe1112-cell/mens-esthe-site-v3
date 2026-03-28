const fs = require('fs');
const path = require('path');

// 探索するディレクトリ
const targetDirs = ['src/components', 'src/pages'];

console.log('🔍 Scanning for outdated "shop.therapists" references...');

function scanAndFix(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanAndFix(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // 1. "shop.therapists.length" などの古い記述があるか？
      // (ただし、すでに修正済みのものは除外)
      if (content.includes('shop.therapists') && !content.includes('getTherapistsByShopId')) {
        
        console.log(`🔧 Fixing: ${file}`);

        // A. フックの導入 (useShopData がなければ追加)
        if (!content.includes('useShopData')) {
          // importを追加
          if (content.includes("from '../contexts/DataContext'")) {
             // すでにあるが useShopData がない場合 (稀)
             content = content.replace("import {", "import { useShopData,"); 
          } else {
             // 新規追加 (ファイルの先頭付近のimport群の最後に追加)
             content = content.replace(/(import .*?;\n)(?!import)/s, "$1import { useShopData } from '../contexts/DataContext.jsx';\n");
          }

          // コンポーネント内で const { getTherapistsByShopId } = useShopData(); を宣言
          // コンポーネントの定義行を探す (export default function... or const Name = ...)
          const compRegex = /(export default function \w+\s*\(.*?\)\s*\{|const \w+\s*=\s*\(.*?\)\s*=>\s*\{|function \w+\s*\(.*?\)\s*\{)/;
          content = content.replace(compRegex, (match) => {
            return `${match}\n  const { getTherapistsByShopId } = useShopData();`;
          });
        } else {
          // useShopDataはあるが getTherapistsByShopId を取り出していない場合
           if (!content.includes('getTherapistsByShopId')) {
             content = content.replace(/const \{([^}]+)\} = useShopData\(\);/, 'const {$1, getTherapistsByShopId} = useShopData();');
           }
        }

        // B. カウントロジックの置換
        // パターン: shop.therapists?.length または shop.therapists.length
        content = content.replace(/shop\.therapists\?\.length/g, 'getTherapistsByShopId(shop.id).length');
        content = content.replace(/shop\.therapists\.length/g, 'getTherapistsByShopId(shop.id).length');
        
        // パターン: shop.therapists 自体の参照 (mapなど)
        // 例: shop.therapists.map(...) -> getTherapistsByShopId(shop.id).map(...)
        content = content.replace(/shop\.therapists(?!\.)/g, 'getTherapistsByShopId(shop.id)');
        content = content.replace(/shop\.therapists\./g, 'getTherapistsByShopId(shop.id).');

        modified = true;
      }

      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated: ${filePath}`);
      }
    }
  });
}

targetDirs.forEach(d => scanAndFix(d));
console.log('🎉 Zero-count display issues have been patched.');
