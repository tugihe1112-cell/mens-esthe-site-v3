const fs = require('fs');

try {
  const shops = JSON.parse(fs.readFileSync("src/data/all_shops.json", "utf8"));
  const therapists = JSON.parse(fs.readFileSync("src/data/therapists.json", "utf8"));

  console.log("\n🏥 --- リンダスパ追跡診断 ---");

  // 店舗検索 (Linda または リンダ を含む)
  const shop = shops.find(s => s.name.includes("Linda") || s.name.includes("リンダ"));

  if (!shop) {
    console.log("❌ 店舗データに「リンダスパ」が見つかりません。");
    process.exit(0);
  }

  console.log(`🏠 店舗名: ${shop.name}`);
  console.log(`🔑 店舗ID: "${shop.id}" (これを探します)`);

  // セラピスト検索 (完全一致)
  const exactMatch = therapists.filter(t => t.shop_id === shop.id);
  console.log(`✅ 紐付け成功 (shop_idが完全一致): ${exactMatch.length} 人`);

  if (exactMatch.length === 0) {
    console.log("\n⚠️ 【原因】IDが一致していません。");
    
    // ヒント：似ているIDを持っているセラピストを探す
    const similar = therapists.find(t => t.shop_id && t.shop_id.includes("linda")); // 大文字小文字無視なしでとりあえず検索
    if (similar) {
      console.log(`👀 発見: セラピスト側のIDは "${similar.shop_id}" になっています。`);
      console.log(`   店舗ID "${shop.id}" と違います。これが原因です。`);
    } else {
      // もっと広く探す
      const looseMatch = therapists.find(t => JSON.stringify(t).toLowerCase().includes("linda"));
      if (looseMatch) {
        console.log(`👀 発見: データ内に "linda" という文字はありますが、shop_id が結びついていません。`);
        console.log(`   セラピストID: ${looseMatch.id}, shop_id: ${looseMatch.shop_id}`);
      } else {
        console.log("❌ セラピストデータの中に linda の痕跡がありません。データ欠損の可能性があります。");
      }
    }
  } else {
    console.log("\n🎉 データは正常です。");
    console.log("   それでも画面が0人なら、原因は「publicフォルダへの反映忘れ」です。");
    console.log("   npm run migrate を実行すれば直ります。");
  }

} catch (e) {
  console.error("エラー:", e.message);
}
