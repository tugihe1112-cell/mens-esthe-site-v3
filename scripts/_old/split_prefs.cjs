const fs = require('fs');
const path = require('path');

const dataRoot = path.join(__dirname, 'public/data');

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (item.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      
      if (data.prefecture && data.prefecture.includes('・')) {
        const prefs = data.prefecture.split('・');
        
        prefs.forEach((pref, index) => {
          const newPref = pref.trim();
          const newData = { ...data, prefecture: newPref };
          // 元のファイル名が shop.json なら、2つ目は shop-2.json にする
          const newFileName = index === 0 ? item : item.replace('.json', `-${index + 1}.json`);
          const newPath = path.join(dir, newFileName);
          
          fs.writeFileSync(newPath, JSON.stringify(newData, null, 2));
          console.log(`✅ ${newPref} 用にファイルを切り出しました: ${newFileName}`);
        });

        // 元の「・」入りのファイルを削除（これで"その他"が消える）
        fs.unlinkSync(fullPath);
      }
    }
  });
}

scan(dataRoot);
