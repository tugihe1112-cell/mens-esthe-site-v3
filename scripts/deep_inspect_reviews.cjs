const fs = require('fs');
const path = require('path');

const DATA_DIR = 'public/data';
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

try {
  console.log("🔍 REVIEW DATA DEEP INSPECTION START");

  // 1. 他に「review」っぽいファイルがないか探す
  const files = fs.readdirSync(DATA_DIR);
  const reviewFiles = files.filter(f => f.toLowerCase().includes('review') && f !== 'reviews.json');
  
  if (reviewFiles.length > 0) {
    console.log(`\n⚠️ 発見！他にも口コミファイルがあるようです:`);
    reviewFiles.forEach(f => console.log(`   - ${f}`));
  } else {
    console.log("\n✅ ファイルレベル: 'reviews.json' 以外に怪しいファイルはありません。");
  }

  // 2. reviews.json の中身を全件スキャン
  if (fs.existsSync(REVIEWS_FILE)) {
    const reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
    console.log(`\n📊 reviews.json の総件数: ${reviews.length} 件`);

    // 全ユニークキーを収集
    const allKeys = new Set();
    const detailedRatingKeys = new Set();
    
    // パターン分析用
    const formats = {};

    reviews.forEach((r, index) => {
      // トップレベルのキー収集
      Object.keys(r).forEach(k => allKeys.add(k));

      // detailedRatings の中身収集
      if (r.detailedRatings) {
        Object.keys(r.detailedRatings).forEach(k => detailedRatingKeys.add(k));
      }

      // フォーマットの指紋を作成 (キーの組み合わせ)
      const fingerprint = Object.keys(r).sort().join(',');
      if (!formats[fingerprint]) {
        formats[fingerprint] = { count: 0, sample: r, index };
      }
      formats[fingerprint].count++;
    });

    console.log("\n🔑 [トップレベル] 使われている全キー一覧:");
    console.log([...allKeys].sort().join(', '));

    console.log("\n⭐️ [詳細評価] detailedRatings の中身キー一覧:");
    console.log([...detailedRatingKeys].sort().join(', '));

    // 3. 構造パターンの分析結果
    const patternKeys = Object.keys(formats);
    if (patternKeys.length > 1) {
      console.log(`\n🚨 警告: データ構造が ${patternKeys.length} 種類混在しています！`);
      
      patternKeys.forEach((fp, idx) => {
        const data = formats[fp];
        console.log(`\n--- パターン ${idx + 1} (${data.count}件) ---`);
        console.log(`   キー: ${fp}`);
        // 違いがわかりやすいように、特徴的な部分を表示
        if (data.sample.detailedRatings) {
          console.log(`   詳細評価: ${JSON.stringify(data.sample.detailedRatings)}`);
        } else {
          console.log(`   詳細評価: ❌ なし`);
        }
        if (data.sample.content) {
          console.log(`   本文: ${data.sample.content.substring(0, 30)}...`);
        }
      });
    } else {
      console.log("\n✅ 全データの構造は統一されています。");
    }

  } else {
    console.log("❌ reviews.json が見つかりません。");
  }

} catch (e) {
  console.error("エラー:", e);
}
