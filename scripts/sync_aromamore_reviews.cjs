const fs = require('fs');
const path = require('path');

// アロマモア全店舗のパス
const targetFiles = [
  'src/data/tokyo/toshima/ikebukuro/aromamore.json',
  'src/data/tokyo/shinjuku/kabukicho/aromamore.json',
  'src/data/tokyo/chuo/ginza/aromamore.json',
  'src/data/tokyo/minato/roppongi/aromamore.json'
];

console.log("🔄 Starting Review Syndication (Syncing)...");

// 1. 全店舗から「すべてのクチコミ」を収集する
let allReviewsMap = new Map(); // IDで重複排除するためMapを使う

targetFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(content);
    
    if (data.reviews && Array.isArray(data.reviews)) {
      data.reviews.forEach(review => {
        // クチコミIDをキーにして保存（最新のものを優先）
        allReviewsMap.set(review.id, review);
      });
    }
  }
});

console.log(`📦 Collected ${allReviewsMap.size} unique reviews from all shops.`);

// 2. 各店舗に「在籍セラピストのクチコミ」を配布する
targetFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, 'utf8');
  let data = JSON.parse(content);

  // この店にいるセラピストのリスト
  const shopTherapists = data.therapists || [];
  
  // この店に表示すべきクチコミをフィルタリング
  // 条件：そのクチコミの対象セラピストが、この店に在籍しているか？
  const relevantReviews = Array.from(allReviewsMap.values()).filter(review => {
    return shopTherapists.includes(review.therapistId);
  });

  // 日付順にソート（新しい順）
  relevantReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

  // データを更新
  data.reviews = relevantReviews;
  data.reviewCount = relevantReviews.length; // クチコミ数も更新

  // ファイルに書き戻す
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  console.log(`✅ Synced ${data.name} (${data.city}): ${relevantReviews.length} reviews`);
});

console.log("🎉 Synchronization Complete!");
