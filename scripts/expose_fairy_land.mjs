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

  console.log('🔍 データベース内の「Fairy Land」の真の姿を全て暴きます...\n');

  try {
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*Fairy*&select=id,name,image_url`, { headers });
    const shops = await res.json();
    
    if (shops.length === 0) {
      console.log('店舗が見つかりません。');
      return;
    }

    for (const shop of shops) {
      console.log(`🏬 店舗名: ${shop.name}`);
      console.log(`   🔑 ID: ${shop.id}`);
      console.log(`   🖼 ロゴURL: ${shop.image_url}`);
      
      const tRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=name,image_url`, { headers });
      const therapists = await tRes.json();
      console.log(`   👩‍🔧 紐づいているセラピスト数: ${therapists.length} 名`);
      
      if (therapists.length > 0) {
        console.log(`   [サンプル] ${therapists[0].name}: ${therapists[0].image_url}`);
      }
      console.log('--------------------------------------------------');
    }

  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
