const fs = require('fs');
const path = require('path');

const TARGET_FILE = 'src/data/all_shops.json';

// 町名 -> 行政区 のマッピング定義
const CITY_MAPPING = {
  // キタエリア
  "梅田": "大阪市北区",
  "北新地": "大阪市北区",
  "堂山": "大阪市北区",
  "中津": "大阪市北区",
  "天満": "大阪市北区",
  "南森町": "大阪市北区",
  "北区": "大阪市北区", // 念のため統一

  // ミナミエリア
  "日本橋": "大阪市中央区",
  "難波": "大阪市中央区",
  "心斎橋": "大阪市中央区",
  "南船場": "大阪市中央区",
  "長堀橋": "大阪市中央区",
  "松屋町": "大阪市中央区",
  "堺筋本町": "大阪市中央区",
  "谷町九丁目": "大阪市天王寺区",
  "上本町": "大阪市天王寺区",
  "中央区": "大阪市中央区",

  // その他大阪市内
  "京橋": "大阪市都島区",
  "十三": "大阪市淀川区",
  "新大阪": "大阪市淀川区",
  "西中島南方": "大阪市淀川区",
  "阿波座": "大阪市西区",
  "肥後橋": "大阪市西区",
  "本町": "大阪市西区", // 中央区の場合もあるが西区寄りも多い
  "天王寺": "大阪市天王寺区",

  // 大阪市外
  "江坂": "吹田市",
  "堺東": "堺市",
  "堺": "堺市"
};

try {
  if (!fs.existsSync(TARGET_FILE)) {
    console.log("❌ ファイルが見つかりません");
    process.exit(1);
  }

  const shops = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
  let changedCount = 0;

  shops.forEach(shop => {
    // 現在のcityがマッピング対象かチェック
    // データによっては "梅田" だったり "大阪府梅田" だったりする可能性も考慮
    // ここでは単純に完全一致または含む場合で判定
    
    let currentCity = shop.city || "";
    
    // マッピングにあるキーが city に含まれていれば書き換え
    // (例: "梅田" -> "大阪市北区")
    const matchKey = Object.keys(CITY_MAPPING).find(key => currentCity === key || currentCity.includes(key));
    
    if (matchKey) {
      const newCity = CITY_MAPPING[matchKey];
      
      // すでに正しいcityならスキップ
      if (currentCity !== newCity) {
        console.log(`🔧 修正: ${shop.name} (${currentCity}) -> ${newCity}`);
        
        // 元のcity名をarea（詳細エリア）に移動・追加
        if (!shop.area) shop.area = [];
        if (!Array.isArray(shop.area)) shop.area = [shop.area];
        
        // "梅田" などの元の地名をタグとして残す
        // ただし "北区" -> "大阪市北区" のように意味が同じならタグ追加は不要かもだが、念のため残す
        if (!shop.area.includes(matchKey)) {
          shop.area.push(matchKey);
        }

        // cityを更新
        shop.city = newCity;
        // prefectureも念のため大阪府に
        shop.prefecture = "大阪府";
        
        changedCount++;
      }
    }
  });

  if (changedCount > 0) {
    fs.writeFileSync(TARGET_FILE, JSON.stringify(shops, null, 2));
    console.log(`\n🎉 合計 ${changedCount} 件の大阪データを正規化しました！`);
    
    // index.jsの更新は前回同様
    const indexFile = 'src/data/index.js';
    const indexContent = `import allShops from './all_shops.json';\nexport { allShops };\n`;
    fs.writeFileSync(indexFile, indexContent);
    
  } else {
    console.log("✅ 修正が必要なデータはありませんでした。");
  }

} catch (e) {
  console.error("エラーが発生しました:", e);
}
