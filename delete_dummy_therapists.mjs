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

  // 削除対象とする「肩書きだけのダミー枠」のリスト（計9名分）
  const dummyNames = [
    "国宝級超SSS級美女",
    "SSS級美乳美女",
    "輝くアイドル級",
    "至宝の極上美女",
    "モデル級極上Fcup",
    "SS級清純極み乙女",
    "SSS級Gcup美女",
    "清純アイドル級美女",
    "超SS級モデル系美女"
  ];

  try {
    console.log("⏳ データベースから「メンズエステ恵比寿」の店舗IDを取得中...");
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*メンズエステ恵比寿*&select=id,name`, { headers });
    const targetShops = await shopRes.json();

    if (!targetShops || targetShops.length === 0) {
      console.log("❌ 店舗が見つかりませんでした。");
      return;
    }

    for (const shop of targetShops) {
      console.log(`\n🔍 ${shop.name} のダミー枠を検索中...`);
      
      const res = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
      const therapists = await res.json();

      // 登録されているセラピストの中から、ダミーリストに一致する子だけを抽出
      const toDelete = therapists.filter(t => dummyNames.includes(t.name));

      if (toDelete.length === 0) {
        console.log(`✅ 削除対象のダミー枠は見つかりませんでした。`);
        continue;
      }

      let deletedCount = 0;
      for (const t of toDelete) {
        const delRes = await fetch(`${url}/rest/v1/therapists?id=eq.${t.id}`, { method: 'DELETE', headers });
        if (delRes.ok) {
          console.log(`🗑️ 削除完了: ${t.name}`);
          deletedCount++;
        }
      }
      console.log(`✨ ${shop.name} から ${deletedCount}件 のダミー枠を完全に削除しました！`);
    }

    console.log("\n🎉 全ての作業が完了しました！ブラウザをリロードして確認してください。");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
