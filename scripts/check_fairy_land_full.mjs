import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

  try {
    console.log('🔍 Tokyo Fairy Land (ID: tokyo_fairy_land) の現在の全データを取得します...\n');
    
    const res = await fetch(`${url}/rest/v1/shops?id=eq.tokyo_fairy_land&select=*`, { headers });
    const shopData = await res.json();
    
    if (shopData && shopData.length > 0) {
      console.log('🏬 【現在の店舗データ（生データ）】');
      console.log(shopData[0]);
    } else {
      console.log('⚠️ 店舗データが見つかりませんでした。');
    }

  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
