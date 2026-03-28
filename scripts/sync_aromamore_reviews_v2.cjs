const fs = require('fs');
const path = require('path');

// アロマモア全店舗のパス
const targetFiles = [
  'src/data/tokyo/toshima/ikebukuro/aromamore.json',
  'src/data/tokyo/shinjuku/kabukicho/aromamore.json',
  'src/data/tokyo/chuo/ginza/aromamore.json',
  'src/data/tokyo/minato/roppongi/aromamore.json'
];

console.log("🔄 Starting Smart Deduplication & Sync...");

// 1. 全店舗からクチコミを収集し、「内容で」重複排除する
let uniqueReviewsMap = new Map();

targetFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(content);
    
    if (data.reviews && Array.isArray(data.reviews)) {
      data.reviews.forEach(review => {
        // IDではなく「中身」で署名を作る (セラピストID + ユーザーID + 日付)
        // ※これで「同じ内容なのにIDが違う」重複も排除できる
        const signature = `${review.therapistId}|${review.userId}|${review.date}`;
        
        // まだ登録されてなければ登録（＝最初の1個だけ採用）
        if (!uniqueReviewsMap.has(signature)) {
            uniqueReviewsMap.set(signature, review);
        }
      });
    }
  }
});

console.log(`📦 Condensed to ${uniqueReviewsMap.size} unique reviews (duplicates removed).`);

// 2. きれいになったリストを再配布
targetFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, 'utf8');
  let data = JSON.parse(content);

  const shopTherapists = data.therapists || [];
  
  // この店に必要なクチコミだけ抽出
  const relevantReviews = Array.from(uniqueReviewsMap.values()).filter(review => {
    return shopTherapists.includes(review.therapistId);
  });

  // 日付順にソート
  relevantReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

  // データ更新
  data.reviews = relevantReviews;
  data.reviewCount = relevantReviews.length;

  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  console.log(`✅ Fixed ${data.name} (${data.city}): Now has ${relevantReviews.length} reviews`);
});

console.log("🎉 Cleanup Complete!");
