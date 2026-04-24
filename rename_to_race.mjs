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
    console.log(`🔍 データベースから誤って登録された「GRACE」を検索し、「RACE」へ修正します...\n`);

    // 「GRACE」または「グレース」を含む店舗を検索
    const res = await fetch(`${url}/rest/v1/shops?select=id,name&or=(name.ilike.*GRACE*,name.ilike.*グレース*)`, { headers });
    const targetShops = await res.json();

    if (!targetShops || targetShops.length === 0) {
      console.log("⚠️ 修正対象の店舗が見つかりませんでした。");
      return;
    }

    for (const shop of targetShops) {
      // 店名を「RACE (レイス)」に変更
      const newName = "RACE (レイス)";
      
      console.log(`📝 更新中: [旧] ${shop.name} ➡️ [新] ${newName} (ID: ${shop.id})`);

      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ name: newName })
      });

      if (patchRes.ok) {
        console.log(`   ✅ 店名の修正が完了しました。`);
      } else {
        console.error(`   ❌ 修正失敗: ${patchRes.statusText}`);
      }
    }

    console.log(`\n🎊 すべての修正が完了しました！サイト上で「RACE (レイス)」になっているか確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
