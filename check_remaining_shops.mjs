import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  try {
    console.log(`🔍 データベースに登録されている店舗名を事前に確認します...\n`);

    // 全店舗を取得してJavaScriptで柔軟に検索
    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    console.log("========================================");
    console.log("① 「Tokyo Aroma Este (東京アロマエステ)」の候補");
    console.log("========================================");
    const tokyoAromaShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return (n.includes('tokyo') && n.includes('aroma')) || 
             (n.includes('東京') && n.includes('アロマ')) ||
             n.includes('tokyoaroma');
    });
    if (tokyoAromaShops.length > 0) {
      tokyoAromaShops.forEach(s => console.log(`  - 店舗名: ${s.name} (ID: ${s.id})`));
    } else {
      console.log("  ⚠️ 該当しそうな店舗は見つかりませんでした。");
    }

    console.log("\n========================================");
    console.log("② 「東京メンズエステ (TokyoMensEsthe)」の候補");
    console.log("========================================");
    const tokyoMenesShops = allShops.filter(shop => {
      const n = shop.name.toLowerCase();
      return n.includes('東京メンズエステ') || 
             n.includes('tokyomensesthe') ||
             n.includes('東京メンズ');
    });
    if (tokyoMenesShops.length > 0) {
      tokyoMenesShops.forEach(s => console.log(`  - 店舗名: ${s.name} (ID: ${s.id})`));
    } else {
      console.log("  ⚠️ 該当しそうな店舗は見つかりませんでした。");
    }

    console.log("\n💡 ターミナルに表示された結果をそのまま教えてください！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
