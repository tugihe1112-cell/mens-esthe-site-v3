const fs = require('fs');
const path = require('path');

// === 置換リスト（スクリーンショットに出ている英字を網羅） ===
const REPLACEMENTS = {
  // 千葉県
  "funabashi": "船橋",
  "nishifunabashi": "西船橋",
  "narita": "成田",
  "togane": "東金",
  "tsudanuma": "津田沼",
  "kashiwa": "柏",
  "matsudo": "松戸",
  "chiba": "千葉",

  // 大阪府
  "awaza": "阿波座",
  "sakaihigashi": "堺東",
  "esaka": "江坂",
  "juso": "十三",
  "kyobashi": "京橋",
  "temmabashi": "天満橋",
  "tanimachi9": "谷町九丁目",
  "nihonbashi": "日本橋",
  "nipponbashi": "日本橋", // 表記揺れ対応
  "namba": "難波",
  "shinsaibashi": "心斎橋",
  "umeda": "梅田",
  "kitashinchi": "北新地",
  "higobashi": "肥後橋",
  "honmachi": "本町",
  "tennoji": "天王寺",
  "shin-osaka": "新大阪",
  "shinosaka": "新大阪", // 表記揺れ
  "minamimorimachi": "南森町",
  "doyama": "堂山",
  "fukushima": "福島",
  "kitahama": "北浜",
  "matsuyamachi": "松屋町",
  "minamisenba": "南船場",
  "nagahoribashi": "長堀橋",
  "nishinakajima": "西中島",
  "sakuragawa": "桜川",
  "suita": "吹田",
  "takatsuki": "高槻",
  "higashimikuni": "東三国",
  "nagahoribashi_matsuyamachi": "長堀橋・松屋町",
  "sakaisujihonmachi": "堺筋本町",

  // その他・共通
  "dispatch": "出張",
  "undefined": "未設定"
};

// 探索ディレクトリ
const TARGET_DIRS = ['src/data', 'public/data'];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    let changed = false;

    Object.keys(REPLACEMENTS).forEach(eng => {
      const jp = REPLACEMENTS[eng];
      
      // 正規表現で "area": "funabashi" や "city": "funabashi" を狙い撃ち
      // クォートで囲まれている部分だけを置換することで、コードの変数名などを壊さないようにする
      const regex = new RegExp(`(["'])${eng}(["'])`, 'g');
      
      if (regex.test(content)) {
        content = content.replace(regex, `$1${jp}$2`);
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 修正: ${filePath}`);
    }
  } catch (e) {
    console.error(`エラー ${filePath}: ${e.message}`);
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
    } else if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.ts')) {
      processFile(fullPath);
    }
  });
}

console.log("🧹 残っている英字データのクリーニングを開始します...");
TARGET_DIRS.forEach(d => walkDir(d));
console.log("🎉 完了しました！");
