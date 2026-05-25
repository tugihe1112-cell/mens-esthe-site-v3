const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['src/data', 'public/data'];

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    let changed = false;

    // 配列データ (all_shops.json等) か 単体オブジェクト (個別json) かで処理を分ける
    const shops = Array.isArray(json) ? json : [json];

    shops.forEach(s => {
      // 1. "city": "六本木" を "港区" に修正
      if (s.city === "六本木") {
        console.log(`🔧 修正: ${s.name} の住所を「六本木」→「港区」に変更`);
        s.city = "港区";
        // areaに六本木を追加
        if (Array.isArray(s.area)) {
          if (!s.area.includes("六本木")) s.area.push("六本木");
        } else {
          s.area = s.area ? [s.area, "六本木"] : ["六本木"];
        }
        changed = true;
      }

      // 2. "city": "中央区・新宿区..." のような複数都市を、最初の1つに絞る
      if (s.city && s.city.includes("・")) {
        const cities = s.city.split("・");
        const primaryCity = cities[0]; // 最初の都市を正とする
        console.log(`🔧 修正: ${s.name} の住所を「${s.city}」→「${primaryCity}」に統合`);
        
        s.city = primaryCity;
        // 残りの都市は area に逃がす
        const otherCities = cities.slice(1);
        if (Array.isArray(s.area)) {
          s.area = [...new Set([...s.area, ...otherCities])];
        } else {
          s.area = s.area ? [s.area, ...otherCities] : otherCities;
        }
        changed = true;
      }
      
      // ついでに undefined チェック
      if (!s.city) s.city = ""; 
    });

    if (changed) {
      // 元の形式（配列かオブジェクト）に合わせて保存
      const newContent = Array.isArray(json) ? JSON.stringify(shops, null, 2) : JSON.stringify(shops[0], null, 2);
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ 保存完了: ${filePath}`);
    }

  } catch (e) {
    // JSONパースエラーなどはスキップ
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.json')) {
      processFile(fullPath);
    }
  });
}

console.log("🧹 住所データの正規化を開始します...");
// index.js はJSファイルなので対象外（all_shops.jsonから生成される前提、または手動修正が必要だが今回はJSONを優先）
// src/data/all_shops.json を明示的に処理
if (fs.existsSync('src/data/all_shops.json')) processFile('src/data/all_shops.json');
walkDir('public/data');
console.log("🎉 完了しました！");
