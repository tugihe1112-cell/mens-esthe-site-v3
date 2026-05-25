const fs = require('fs');

// 修正対象のファイルパス
const filePaths = [
  'src/data/all_shops.json', 
  'src/data/shops.json',
  'public/data/shops.json'
];

// 変換リスト (検出された文字列 -> 正しい日本語)
const replacements = {
  // 検出されたデータ
  "saitama/saitama-minami/minamiurawa": "南浦和",
  "tokyo/adachi/kitasenju": "北千住",
  "tokyo/adachi/takenotsuka": "竹ノ塚",
  "tokyo/adachi/ushida": "牛田",
  "tokyo/arakawa/nippori": "日暮里",
  "tokyo/koto/kameido": "亀戸",
  "tokyo/minato/shinbashi": "新橋",
  "tokyo/shinagawa/gotanda": "五反田",
  "tokyo/sumida/kinshicho": "錦糸町",
  "tokyo/sumida/ryougoku": "両国",
  "tokyo/taito/ueno": "上野",
  
  // ユーザー指摘分・その他予測されるもの
  "tanimachi9": "谷町九丁目",
  "umeda": "梅田",
  "namba": "難波",
  "shinsaibashi": "心斎橋",
  "nihonbashi": "日本橋",
  "kyobashi": "京橋",
  "juso": "十三",
  "esaka": "江坂",
  "shin-osaka": "新大阪"
};

filePaths.forEach(path => {
  if (fs.existsSync(path)) {
    try {
      const raw = fs.readFileSync(path, 'utf8');
      let shops = JSON.parse(raw);
      let count = 0;

      shops = shops.map(shop => {
        let changed = false;

        // areaの修正 (文字列または配列)
        if (shop.area) {
          if (Array.isArray(shop.area)) {
            shop.area = shop.area.map(a => {
              if (replacements[a]) {
                changed = true;
                return replacements[a];
              }
              return a;
            });
          } else {
            if (replacements[shop.area]) {
              shop.area = replacements[shop.area];
              changed = true;
            }
          }
        }

        // cityの修正 (もしあれば)
        if (shop.city && replacements[shop.city]) {
          shop.city = replacements[shop.city];
          changed = true;
        }

        if (changed) count++;
        return shop;
      });

      if (count > 0) {
        fs.writeFileSync(path, JSON.stringify(shops, null, 2));
        console.log(`✅ ${path}: ${count}件のデータを修正しました。`);
      } else {
        console.log(`ℹ️ ${path}: 修正対象のデータはありませんでした。`);
      }

    } catch (e) {
      console.error(`❌ ${path} の読み込みエラー:`, e);
    }
  }
});

console.log("\n🎉 クリーニング完了！ ブラウザで表示を確認してください。");
