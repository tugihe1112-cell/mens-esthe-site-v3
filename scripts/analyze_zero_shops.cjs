const fs = require('fs');
const path = require('path');

const BACKUP_PATH = 'src/data/therapists.json.bak_ghosts';
const CURRENT_PATH = 'public/data/therapists.json';
const SHOPS_PATH = 'public/data/shops.json';

try {
  console.log("📉 ZERO THERAPIST ANALYSIS");

  if (!fs.existsSync(BACKUP_PATH)) {
    console.error("❌ バックアップファイルが見つかりません。比較できません。");
    process.exit(1);
  }

  const oldTherapists = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
  const newTherapists = JSON.parse(fs.readFileSync(CURRENT_PATH, 'utf8'));
  const shops = JSON.parse(fs.readFileSync(SHOPS_PATH, 'utf8'));

  // 1. 店舗ごとの人数集計
  const countTherapists = (list) => {
    const counts = {};
    list.forEach(t => {
      const sid = t.shop_id;
      counts[sid] = (counts[sid] || 0) + 1;
    });
    return counts;
  };

  const oldCounts = countTherapists(oldTherapists);
  const newCounts = countTherapists(newTherapists);

  // 2. 「0人になった店舗」を特定
  const zeroShops = [];
  shops.forEach(shop => {
    const oldC = oldCounts[shop.id] || 0;
    const newC = newCounts[shop.id] || 0;

    // 「元々はいたのに、今は0人になった」店を探す
    if (oldC > 0 && newC === 0) {
      // その店から消えたセラピストの名前を調べる
      const vanishedMembers = oldTherapists
        .filter(t => t.shop_id === shop.id)
        .map(t => t.name);
      
      zeroShops.push({
        name: shop.name,
        id: shop.id,
        before: oldC,
        vanishedNames: vanishedMembers // 消えた人たちの名前リスト
      });
    }
  });

  console.log(`\n🔍 0人になってしまった店舗数: ${zeroShops.length} 店舗`);

  if (zeroShops.length > 0) {
    console.log("\n📊 消えたデータの正体（サンプル5件）:");
    zeroShops.slice(0, 5).forEach(s => {
      console.log(`\n🏢 店名: ${s.name}`);
      console.log(`   - 削除前: ${s.before}名`);
      // 名前が「不明なセラピスト」ばかりかチェック
      const ghosts = s.vanishedNames.filter(n => n === '不明なセラピスト' || n === 'Unknown').length;
      const reals = s.vanishedNames.length - ghosts;
      
      console.log(`   - 内訳: 亡霊 ${ghosts}名 / 正常 ${reals}名`);
      
      if (reals > 0) {
        console.log(`   ⚠️ 警告: 正常な名前が含まれています！ -> ${s.vanishedNames.filter(n => n !== '不明なセラピスト').join(', ')}`);
      } else {
        console.log(`   ✅ 正常: ゴミデータのみ削除されました。`);
      }
    });

    // 全体統計
    const totalVanishedReals = zeroShops.reduce((acc, s) => {
      return acc + s.vanishedNames.filter(n => n !== '不明なセラピスト' && n !== 'Unknown').length;
    }, 0);

    console.log("\n=========================================");
    if (totalVanishedReals === 0) {
      console.log("✅ 安心してください。0人になった店は、元々「不明なセラピスト」しかいない店でした。");
      console.log("   これは正常なクリーニング結果です。");
      console.log("   対策: これら「空っぽの店」をサイト一覧から非表示にすれば解決です。");
    } else {
      console.log(`🚨 重大インシデント: ${totalVanishedReals} 名の「正常な名前」を持つセラピストが誤って消されています！`);
      console.log("   対策: 直ちにバックアップから復元する必要があります。");
    }
  } else {
    console.log("0人になった店舗はありません。");
  }

} catch (e) {
  console.error("エラー:", e);
}
