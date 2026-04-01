import fs from 'fs';

try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');

  const run = async () => {
    console.log("⏳ すべてのハイグランデを検索中...");
    const headers = { 
      'apikey': key, 
      'Authorization': `Bearer ${key}`, 
      'Content-Type': 'application/json' 
    };
    
    // ハイグランデを「すべて」取得
    const res = await fetch(`${url}/rest/v1/shops?name=like.*ハイグランデ*&select=id,name`, { headers });
    const data = await res.json();
    
    console.log(`\n🔍 データベース内に ${data.length} 件のハイグランデを発見しました。全て更新します！`);
    
    const exactSystemString = `システム\nSYSTEM\nTimePrice70分・・・・・16,000円90分・・・・・20,000円120分・・・・・25,000円150分・・・・・30,000円`;

    const updateData = {
      schedule_url: "https://high-grande.jp/schedule.php",
      price_system: exactSystemString
    };
    
    // 発見した全てのハイグランデを更新する
    for (const shop of data) {
      await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(updateData)
      });
      console.log(`✅ ID: ${shop.id} のデータを更新しました！`);
    }
    console.log("\n🎉 全てのクローン店舗の更新が完了しました！ブラウザをリロードしてください。");
  };
  run();
} catch (e) {
  console.error("エラー:", e.message);
}
