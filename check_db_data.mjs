import fs from 'fs';

try {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');

  if (!url || !key) {
    console.error("❌ .envからSupabaseの接続情報が読み込めません。");
    process.exit(1);
  }

  const checkData = async () => {
    console.log("⏳ Supabaseの実際のデータを照会中...\n");
    const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
    
    // ハイグランデという名前を含む店舗を検索
    const res = await fetch(`${url}/rest/v1/shops?name=like.*ハイグランデ*&select=name,website_url,raw_data`, { headers });
    const data = await res.json();
    
    if (data && data.length > 0) {
      console.log("=== 🔍 実際のデータベースの値（ハイグランデ） ===");
      data.forEach(shop => {
        console.log(`■ 店舗名: ${shop.name}`);
        console.log(`- website_url: ${shop.website_url}`);
        console.log(`- raw_data.schedule_url: ${shop.raw_data?.schedule_url}`);
        console.log(`- raw_data.website: ${shop.raw_data?.website}`);
        console.log("===============================================");
      });
    } else {
      console.log("❌ 「ハイグランデ」のデータが見つかりませんでした。");
    }
  };
  checkData();
} catch (e) {
  console.error("エラーが発生しました:", e.message);
}
