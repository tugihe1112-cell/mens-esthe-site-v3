const fs = require('fs');

const corrections = {
  'public/data/tokyo/chuo/ginza/aromamore.json': 'tokyo_chuo_ginza_aromamore',
  'public/data/tokyo/shinjuku/kabukicho/aromamore.json': 'tokyo_shinjuku_kabukicho_aromamore',
  'public/data/tokyo/toshima/ikebukuro/aromamore.json': 'tokyo_toshima_ikebukuro_aromamore'
};

console.log("🔧 アロマモアのID修正を開始します...");

Object.keys(corrections).forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const shop = Array.isArray(data) ? data[0] : data;

    if (shop.id !== corrections[filePath]) {
      console.log(`  ✏️  修正: ${filePath}`);
      console.log(`      ${shop.id} => ${corrections[filePath]}`);
      shop.id = corrections[filePath];
      const newData = Array.isArray(data) ? [shop] : shop;
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
    } else {
      console.log(`  ✅ OK: ${filePath}`);
    }
  }
});
console.log("完了。");
