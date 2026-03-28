const fs = require('fs');
const path = require('path');

// === 全国翻訳リスト (調査結果に基づき網羅) ===
const REPLACEMENTS = {
  // ■ 神奈川県
  "honatsugi": "本厚木",
  "atsugi": "厚木",
  "ebina": "海老名",
  "fujisawa": "藤沢",
  "inadazutsumi": "稲田堤",
  "isezaki": "伊勢佐木",
  "isezakicho": "伊勢佐木町",
  "kamiooka": "上大岡",
  "kannai": "関内",
  "kawasaki": "川崎",
  "mizonokuchi": "溝の口",
  "mukogaoka_yuen": "向ヶ丘遊園",
  "mukogaokayuen": "向ヶ丘遊園",
  "musashikosugi": "武蔵小杉",
  "noborito": "登戸",
  "nogecho": "野毛町",
  "sagamihara": "相模原",
  "fuchinobe": "淵野辺",
  "sakuragicho": "桜木町",
  "shinyokohama": "新横浜",
  "shinyurigaoka": "新百合ヶ丘",
  "totsuka": "戸塚",
  "tsunashima": "綱島",
  "yokohama": "横浜",

  // ■ 埼玉県
  "kawagoe": "川越",
  "kawaguchi": "川口",
  "kuki": "久喜",
  "omiya": "大宮",
  "minamiurawa": "南浦和",
  "saitama-minami": "南浦和",
  "urawa": "浦和",
  "warabi": "蕨",

  // ■ 愛知県
  "gifu": "岐阜",
  "hisaya": "久屋大通",
  "ichinomiya": "一宮",
  "ichinomiyahon": "一宮本町",
  "ichinomiyamae": "一宮駅前",
  "imaike": "今池",
  "izumi": "泉",
  "kariya": "刈谷",
  "kokusai_center": "国際センター",
  "marunouchi_nagoya": "丸の内",
  "meiekiminami": "名駅南",
  "nagono": "那古野",
  "nagoya": "名古屋",
  "nishiki": "錦",
  "noritake": "則武",
  "osu": "大須",
  "shinsakae": "新栄",
  "takaoka": "高岡",
  "tsurumai": "鶴舞",
  "yabacho": "矢場町",
  "sakae": "栄",

  // ■ 兵庫県
  "asahidori": "旭通",
  "himeji": "姫路",
  "kanocho": "加納町",
  "kobe": "神戸",
  "motomachi": "元町",
  "ninomiya": "二宮",
  "sannomiya": "三宮",

  // ■ 京都府
  "kyoto_omiya": "大宮",
  "kyoto_station": "京都駅",
  "nijo": "二条",
  "senbon_sanjo": "千本三条",
  "shijo_nishinotoin": "四条西洞院",

  // ■ 滋賀県
  "hikone": "彦根",
  "kusatsu": "草津",
  "otsu_station": "大津駅",

  // ■ 宮城県
  "sendai": "仙台",

  // ■ 静岡県
  "mishima": "三島",
  "numazu": "沼津",

  // ■ 福岡県
  "hakata": "博多",
  "kokura": "小倉",
  "kurume": "久留米"
};

const TARGET_DIRS = ['src/data', 'public/data'];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    Object.keys(REPLACEMENTS).forEach(eng => {
      const jp = REPLACEMENTS[eng];
      // "area": "atsugi" のようなクォート付き文字列を狙い撃ち
      const regex = new RegExp(`(["'])${eng}(["'])`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `$1${jp}$2`);
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 翻訳完了: ${filePath}`);
    }
  } catch (e) {
    console.error(`エラー: ${e.message}`);
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

console.log("🌏 全国のエリア名翻訳を開始します...");
TARGET_DIRS.forEach(d => walkDir(d));
console.log("🎉 すべての翻訳が完了しました！");
