import fs from 'fs';

try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');

  const checkData = async () => {
    console.log("⏳ Supabaseから raw_data の schedule_url を抽出中...\n");
    const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
    
    // データを取り出して確認します
    const res = await fetch(`${url}/rest/v1/shops?select=name,raw_data&limit=300`, { headers });
    const data = await res.json();
    
    if (data && data.length > 0) {
      const hasSchedule = data.filter(d => d.raw_data && d.raw_data.schedule_url).slice(0, 30);
      
      console.log("=== 🔍 スクレイピング済みの出勤URL サンプル ===");
      if (hasSchedule.length === 0) {
        console.log("⚠️ raw_data内にschedule_urlを持っている店舗が1件もありませんでした。（過去の遺産はゼロです）");
      } else {
        hasSchedule.forEach(shop => {
          console.log(`■ ${shop.name}\n  URL: ${shop.raw_data.schedule_url}\n`);
        });
      }
      console.log("===============================================");
    }
  };
  checkData();
} catch (e) {
  console.error("エラーが発生しました:", e.message);
}
