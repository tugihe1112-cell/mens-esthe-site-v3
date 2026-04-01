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
    console.log("⏳ データベースから「プラチナム」に関連する店舗を検索中...");
    
    // 名前に「プラチナム」または「Platinum」が含まれる店舗を広範囲に検索
    const res = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*プラチナム*,name.ilike.*Platinum*)&select=id,name`, { headers });
    const shops = await res.json();

    if (!shops || shops.length === 0) {
      console.log("❌ 「プラチナム」という名前の店舗がデータベースに見つかりませんでした。店舗名を確認してください。");
      return;
    }

    console.log(`✅ ${shops.length}件の店舗が見つかりました: ${shops.map(s => s.name).join(', ')}`);

    const platinumSystem = 
`75分 17,000円 → 15,000円
90分 20,000円 → 18,000円
120分 25,000円 → 23,000円
150分 30,000円 → 28,000円`;

    const updateData = {
      schedule_url: "https://esthe-platinum.tokyo/schedule/",
      price_system: platinumSystem
    };

    console.log("\n🔗 データを更新中...");

    for (const shop of shops) {
      const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(updateData)
      });

      if (updateRes.ok) {
        console.log(`✅ ${shop.name} (ID: ${shop.id}) の更新に成功しました。`);
      } else {
        console.error(`❌ ${shop.name} の更新に失敗しました:`, await updateRes.text());
      }
    }

    console.log("\n🎉 プラチナム東京のデータ更新が完了しました！ブラウザで確認してください。");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
