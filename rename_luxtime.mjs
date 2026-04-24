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
    console.log(`🔍 データベースから「Luxtime」関連店舗を検索し、店名を修正します...\n`);

    // Luxtimeを含む店舗を取得
    const res = await fetch(`${url}/rest/v1/shops?select=id,name&name=ilike.*Luxtime*`, { headers });
    const targetShops = await res.json();

    if (!targetShops || targetShops.length === 0) {
      console.log("⚠️ 該当する店舗が見つかりませんでした。");
      return;
    }

    for (const shop of targetShops) {
      // 「Luxtime」の部分を「ラグタイム lux time」に置換
      let newName = shop.name.replace(/Luxtime/ig, 'ラグタイム lux time');
      
      console.log(`📝 更新中: [変更前] ${shop.name} ➡️ [変更後] ${newName} (ID: ${shop.id})`);

      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ name: newName })
      });

      if (patchRes.ok) {
        console.log(`   ✅ 店名変更完了`);
      } else {
        console.error(`   ❌ 更新失敗: ${patchRes.statusText}`);
      }
    }

    console.log(`\n🎊 店名の修正が完了しました！ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
