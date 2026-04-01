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
    console.log("⏳ ハイグランデを検索してデータを反映中...");
    const headers = { 
      'apikey': key, 
      'Authorization': `Bearer ${key}`, 
      'Content-Type': 'application/json' 
    };
    
    // 1. ハイグランデのIDを特定
    const res = await fetch(`${url}/rest/v1/shops?name=like.*ハイグランデ*&select=id,name`, { headers });
    const data = await res.json();
    
    if (!data || data.length === 0) {
      console.log("❌ ハイグランデが見つかりませんでした。");
      return;
    }
    const shopId = data[0].id;
    
    // 2. いただいた文字列を「そのまま（改行も含めて）」セット
    const exactSystemString = `システム
SYSTEM
TimePrice70分・・・・・16,000円90分・・・・・20,000円120分・・・・・25,000円150分・・・・・30,000円`;

    const updateData = {
      schedule_url: "https://high-grande.jp/schedule.php",
      price_system: exactSystemString
    };
    
    // 3. Supabaseのデータを更新
    const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(updateData)
    });
    
    if (updateRes.ok) {
      console.log(`✅ 更新成功！ ${data[0].name} にデータを反映しました。`);
      console.log("\n--- 反映された出勤情報URL ---");
      console.log(updateData.schedule_url);
      console.log("\n--- 反映された料金システム ---");
      console.log(updateData.price_system);
      console.log("------------------------------");
    } else {
      console.error("❌ 更新失敗:", await updateRes.text());
    }
  };
  run();
} catch (e) {
  console.error("エラー:", e.message);
}
