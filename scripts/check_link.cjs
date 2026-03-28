const fs = require('fs');
const path = require('path');

const SHOPS_PATH = 'public/data/shops.json';
const THERAPISTS_PATH = 'public/data/therapists.json';

try {
  console.log("🔗 LINK CHECKER STARTED");

  const shops = JSON.parse(fs.readFileSync(SHOPS_PATH, 'utf8'));
  const therapists = JSON.parse(fs.readFileSync(THERAPISTS_PATH, 'utf8'));

  // 1. Loadingになっている例のセラピスト (向日葵らん)
  const targetTherapist = therapists.find(t => t.id === '77433-himawari-ran');

  if (!targetTherapist) {
    console.error("❌ ターゲットのセラピストが見つかりません（データ同期ミス？）");
    process.exit(1);
  }

  const targetShopId = targetTherapist.shop_id;
  console.log(`\n👩 セラピスト: ${targetTherapist.name}`);
  console.log(`👉 指名している店舗ID: "${targetShopId}"`);

  // 2. そのIDを持つ店は存在するか？
  const foundShop = shops.find(s => s.id === targetShopId);

  if (foundShop) {
    console.log(`✅ [OK] 店舗が見つかりました！`);
    console.log(`   店名: ${foundShop.name}`);
    console.log(`   ID:   ${foundShop.id}`);
    console.log("\n🤔 リンクは正常です。原因はフロントエンドのコードにある可能性があります。");
  } else {
    console.log(`❌ [NG] 店舗が見つかりません！`);
    console.log(`   セラピストは "${targetShopId}" を探していますが、shops.json にそのIDはありません。`);
    
    // 3. もしかしてIDが変わってる？ (店名で探してみる)
    // IDに含まれる店名キーワード (levechi_esthe) で検索
    const keyword = 'levechi';
    const candidate = shops.find(s => s.id.includes(keyword) || (s.name && s.name.includes('レベチ')));
    
    if (candidate) {
      console.log(`\n💡 ヒント: 似たような店ならありました！`);
      console.log(`   店名: ${candidate.name}`);
      console.log(`   現在のID: "${candidate.id}"`);
      console.log(`   (IDが食い違っています。これがLoadingの原因です)`);
    } else {
      console.log(`\n😱 ヒント: 店名検索でも見つかりません。店舗データ自体が欠落しています。`);
    }
  }

} catch (e) {
  console.error("エラー:", e);
}
