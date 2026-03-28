const fs = require('fs');
const path = require('path');

const SHOPS_PATH = 'public/data/shops.json';
const REVIEWS_PATH = 'public/data/reviews.json';

try {
  console.log("🔍 DATA INSPECTION STARTED");
  
  // 1. ファイル読み込み
  if (!fs.existsSync(SHOPS_PATH) || !fs.existsSync(REVIEWS_PATH)) {
    console.error("❌ データファイルが見つかりません");
    process.exit(1);
  }
  const shops = JSON.parse(fs.readFileSync(SHOPS_PATH, 'utf8'));
  const reviews = JSON.parse(fs.readFileSync(REVIEWS_PATH, 'utf8'));

  console.log(`- 店舗数: ${shops.length}`);
  console.log(`- 口コミ数: ${reviews.length}`);

  // 2. 店舗データの確認 (Group IDはあるか？)
  const shopWithGroup = shops.find(s => s.group_id);
  console.log("\n🏢 [店舗データのサンプル]");
  if (shopWithGroup) {
    console.log(`   ID:       ${shopWithGroup.id}`);
    console.log(`   Name:     ${shopWithGroup.name}`);
    console.log(`   GroupID:  ${shopWithGroup.group_id} (✅ 存在確認)`);
  } else {
    console.log("   ❌ group_id を持つ店舗が見つかりません！ロジックが破綻します。");
  }

  // 3. 口コミデータの確認 (構造はどうなっているか？)
  const reviewSample = reviews[0];
  console.log("\n📝 [口コミデータのサンプル]");
  if (reviewSample) {
    console.log(JSON.stringify(reviewSample, null, 2));
    
    // キーのチェック
    console.log("\n   ▼ キー確認:");
    console.log(`   - shop_id:       ${reviewSample.shop_id ? '✅ あり' : '❌ なし'}`);
    console.log(`   - therapistName: ${reviewSample.therapistName ? '✅ あり' : '❌ なし'}`);
    console.log(`   - group_id:      ${reviewSample.group_id ? '⚠️ あり(珍しい)' : '💡 なし (予想通り)'}`);
    console.log(`   - date:          ${reviewSample.date ? '✅ あり' : '❌ なし'}`);
    console.log(`   - createdAt:     ${reviewSample.createdAt ? '✅ あり' : '❌ なし'}`);
  } else {
    console.log("   口コミデータが空です。");
  }

  // 4. 実証実験: 「同じグループ・違う店舗」の口コミはあるか？
  if (shopWithGroup) {
    // 同じグループの店舗IDリスト
    const groupShopIds = shops
      .filter(s => s.group_id === shopWithGroup.group_id)
      .map(s => s.id);
    
    console.log(`\n🧪 [実証実験] グループ: ${shopWithGroup.group_id}`);
    console.log(`   所属店舗数: ${groupShopIds.length}`);

    // 口コミの中で、このグループに属するものを探す
    const groupReviews = reviews.filter(r => groupShopIds.includes(r.shop_id));
    console.log(`   このグループの総口コミ数: ${groupReviews.length}`);

    if (groupReviews.length > 0) {
      // 違う店舗IDの口コミが混ざっているか？
      const uniqueReviewShopIds = [...new Set(groupReviews.map(r => r.shop_id))];
      console.log(`   口コミがある店舗IDの種類: ${uniqueReviewShopIds.length} 個`);
      if (uniqueReviewShopIds.length > 1) {
        console.log("   ✨ 成功条件クリア: 複数店舗に口コミが分散しています。横断検索の効果あり！");
      } else {
        console.log("   ⚠️ 注意: 口コミが1店舗に集中しています。効果が見えにくいかも。");
      }
    }
  }

} catch (e) {
  console.error("エラー:", e);
}
