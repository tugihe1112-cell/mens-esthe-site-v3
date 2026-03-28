const fs = require('fs');
const path = require('path');

console.log('🚚 Starting Data Migration (src -> public)...');

const srcDir = 'src/data';
const publicDir = 'public/data';

// public/data フォルダがなければ作る
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// コピーするファイル一覧
const files = ['all_shops.json', 'therapists.json', 'reviews.json', 'version.json'];

files.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(publicDir, file);

  if (fs.existsSync(srcPath)) {
    // データを読み込んでそのままコピー
    const data = fs.readFileSync(srcPath);
    fs.writeFileSync(destPath, data);
    console.log(`✅ Reflected: ${file}`);
  } else {
    console.log(`⚠️ Skipped: ${file} (Not found in src)`);
  }
});

console.log('🎉 Migration Complete!');
