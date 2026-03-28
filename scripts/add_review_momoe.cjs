const fs = require('fs');
const path = require('path');

const targetFile = 'src/data/tokyo/toshima/ikebukuro/aromamore.json';
const fullPath = path.join(process.cwd(), targetFile);

// 修正版クチコミデータ（辛口評価・ユーザー名シンプル化）
const newReview = {
  "id": "r_aromamore_momoe_001",
  "shopId": "tokyo_toshima_ikebukuro_aromamore",
  "shopName": "AROMA more (アロマモア)",
  "therapistId": "aromamore_桃愛りこ",
  "therapistName": "桃愛 りこ",
  "userId": "u_taka_esthe_99",
  "userName": "タカ", 
  "isLocal": false,
  "rating": 3.2, 
  "course": "90分19000円＋OP1万円",
  "detailedRatings": {
    "looks": 3.5,
    "style": 4.0,
    "service": 3.0,
    "massage": 3.0,
    "intimacy": 3.0
  },
  "tags": [
    "高身長",
    "スレンダー",
    "美脚",
    "美人系",
    "20代後半"
  ],
  "content": "【セラピストのスタイル】\nスラッと背が高く細身でありながら出るとこ出ている感じです。胸もお尻もちょうど良いサイズ感で、張りがあってプリッとしていてとてもいいです。肌も綺麗でスベスベです。\n\n【セラピストの容姿】\n写真と大きく印象が変わるわけではありません。小顔で綺麗な顔です。強いて言うなら写真よりはややキツめな印象かもしれませんが、後悔するほどの違いはないかと。\n\n【施術の流れ】\nシャワー、紙パンツへの着替えが済むと、あぐらでのマッサージから始まります。ディープリンパ50分つけた影響か、はじめから鼠径部へのアプローチが多く、手つきもフェザータッチでいやらしく責められるので、あぐらの時点で興奮してしまいます。\n\nあぐらのあとは仰向けでした。顔に胸を押し当ててくれたり、顔の前にお尻を突き出してくれたりしました。寛容度は高いと思われます。\n\n仰向けのあとはうつ伏せ→カエル足→四つん這いの流れです。いずれも積極的に責められ興奮が止まりませんでした。\n\n【再訪の有無】\n次行ったらもっと寛容になっている期待も込めて再訪ありです。他にも気になる子が多いのでタイミング次第になるかもですが…。",
  "date": "2024-02-14T20:00:00Z"
};

try {
  // ファイル読み込み
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${targetFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  let data;
  
  try {
    data = JSON.parse(content);
  } catch (e) {
    console.error("❌ JSON Parse Error:", e);
    process.exit(1);
  }

  console.log(`Processing: ${targetFile}`);

  // 1. therapists 配列にIDを追加（なければ）
  if (!data.therapists) data.therapists = [];
  if (!data.therapists.includes(newReview.therapistId)) {
    data.therapists.push(newReview.therapistId);
    console.log(`✅ Added therapist ID: ${newReview.therapistId}`);
  } else {
    console.log(`ℹ️ Therapist ID already exists.`);
  }

  // 2. reviews 配列にクチコミを上書き保存
  if (!data.reviews) data.reviews = [];
  
  // IDが一致する既存レビューを探す
  const existingIdx = data.reviews.findIndex(r => r.id === newReview.id);
  
  if (existingIdx >= 0) {
    data.reviews[existingIdx] = newReview; // 上書き
    console.log(`✅ Updated existing review (Lower Rating): ${newReview.id}`);
  } else {
    data.reviews.push(newReview); // 新規
    console.log(`✅ Added new review: ${newReview.id}`);
  }

  // 書き込み
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  console.log(`🎉 Successfully saved to ${targetFile}`);

} catch (err) {
  console.error("❌ Error:", err);
}
