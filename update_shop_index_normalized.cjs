const fs = require('fs');
const path = require('path');

// ■ 1. エリアと区・市の対応表（マスタデータ）
// これを使って、「恵比寿」と書いてあったら「渋谷区」に自動修正します。
const LOCATION_MAP = {
  // --- 東京 ---
  "恵比寿": "渋谷区", "渋谷": "渋谷区", "原宿": "渋谷区", "代々木": "渋谷区",
  "新宿": "新宿区", "歌舞伎町": "新宿区", "西新宿": "新宿区", "高田馬場": "新宿区",
  "池袋": "豊島区", "大塚": "豊島区",
  "六本木": "港区", "赤坂": "港区", "新橋": "港区", "麻布十番": "港区",
  "銀座": "中央区", "日本橋": "中央区",
  "秋葉原": "千代田区", "神田": "千代田区",
  "上野": "台東区", "浅草": "台東区", "鶯谷": "台東区",
  "錦糸町": "墨田区",
  "五反田": "品川区", "目黒": "目黒区", "自由が丘": "目黒区",
  "蒲田": "大田区",
  "吉祥寺": "武蔵野市", "立川": "立川市", "八王子": "八王子市", "町田": "町田市",
  "北千住": "足立区", "綾瀬": "足立区",

  // --- 神奈川 ---
  "横浜": "横浜市", "関内": "横浜市", "新横浜": "横浜市", "鶴見": "横浜市",
  "川崎": "川崎市", "武蔵小杉": "川崎市", "溝の口": "川崎市",
  "藤沢": "藤沢市", "本厚木": "厚木市", "海老名": "海老名市",

  // --- 埼玉 ---
  "大宮": "さいたま市", "浦和": "さいたま市", "西川口": "川口市", "川越": "川越市",

  // --- 千葉 ---
  "千葉": "千葉市", "船橋": "船橋市", "西船橋": "船橋市", "柏": "柏市", "松戸": "松戸市",

  // --- 大阪 ---
  "梅田": "大阪市", "北新地": "大阪市", "新大阪": "大阪市", "十三": "大阪市",
  "難波": "大阪市", "心斎橋": "大阪市", "日本橋": "大阪市", "天王寺": "大阪市", "京橋": "大阪市",
  "堺": "堺市", "堺東": "堺市", "江坂": "吹田市",

  // --- 名古屋 ---
  "名古屋": "名古屋市", "名駅": "名古屋市", "栄": "名古屋市", "錦": "名古屋市", "金山": "名古屋市",
  "豊橋": "豊橋市",

  // --- 福岡 ---
  "博多": "福岡市", "中洲": "福岡市", "天神": "福岡市",
  "小倉": "北九州市", "久留米": "久留米市",

  // --- 北海道・宮城 ---
  "札幌": "札幌市", "すすきの": "札幌市",
  "仙台": "仙台市", "国分町": "仙台市"
};

// データの場所
const dataDir = path.join(__dirname, 'public/data');
const outputFile = path.join(__dirname, 'src/data/index.js');

const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (file.endsWith('.json') && !file.startsWith('.')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
};

try {
  console.log('🔄 データを読み込み、構造を統一しています...');
  
  if (!fs.existsSync(dataDir)) {
    console.error('❌ public/data フォルダが見つかりません');
    process.exit(1);
  }

  const allFiles = getAllFiles(dataDir);
  const shops = {};
  let successCount = 0;
  let fixedCount = 0;

  allFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (!content.trim()) return;

      const rawData = JSON.parse(content);
      // 配列でも単体でも配列にする
      const dataList = Array.isArray(rawData) ? rawData : [rawData];

      dataList.forEach(data => {
        // ID生成
        if (!data.id) {
          const fileName = path.basename(filePath, '.json');
          const parentDir = path.basename(path.dirname(filePath));
          data.id = `${parentDir}_${fileName}`;
        }
        const shopId = String(data.id);

        // ■■■ データ補正ロジック ■■■
        
        // 1. cityが「エリア名(恵比寿など)」になっていたら、自動修正する
        if (LOCATION_MAP[data.city]) {
          // もしareaが空なら、今のcity(恵比寿)をareaに移す
          if (!data.area || data.area === data.city) {
            data.area = data.city;
          }
          // cityを正しい区・市(渋谷区)に書き換える
          data.city = LOCATION_MAP[data.area] || LOCATION_MAP[data.city];
          fixedCount++;
        }

        // 2. areaがなくて、cityが正しい区の場合、areaは「指定なし」にするか、ディレクトリ名から推測
        if (!data.area && data.city) {
           // 簡易的にディレクトリ名をエリアとする手もあるが、一旦そのまま
        }

        // データを登録
        shops[shopId] = data;
        successCount++;
      });

    } catch (err) {
      console.error(`❌ 読み込み失敗: ${filePath}`, err.message);
    }
  });

  // src/data/index.js を書き出し
  const fileContent = `// 自動生成ファイル: ${new Date().toLocaleString()}
// 登録店舗数: ${successCount}
// 自動補正数: ${fixedCount} (エリア名→区名への変換など)

export const allShops = ${JSON.stringify(shops, null, 2)};
`;

  fs.writeFileSync(outputFile, fileContent, 'utf8');
  
  console.log('------------------------------------------------');
  console.log(`✅ 完了！ データの統一が完了しました。`);
  console.log(`📊 登録店舗数: ${successCount} 件`);
  console.log(`🔧 構造を自動修正した店舗数: ${fixedCount} 件`);
  console.log('------------------------------------------------');

} catch (err) {
  console.error('致命的なエラー:', err);
}
