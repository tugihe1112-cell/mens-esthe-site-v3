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
    console.log('🔍 Tokyo Fairy Land のデータベース登録状況を確認します...');
    
    const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.tokyo_fairy_land&select=*`, { headers });
    const shopData = await shopRes.json();
    
    if (shopData && shopData.length > 0) {
      console.log('\n🏬 【店舗データはDBに存在します！】');
      console.log('現在のエリア情報:', {
        prefecture: shopData[0].prefecture,
        city: shopData[0].city,
        area: shopData[0].area
      });
      console.log('※ここが null だと、画面の一覧に出てこない可能性大です！');
    } else {
      console.log('\n❌ 【店舗データがDBにありません！】 APIで弾かれています。');
    }

    const tRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.tokyo_fairy_land&select=id,name`, { headers });
    const tData = await tRes.json();
    console.log(`\n👩‍🔧 セラピスト登録数: ${tData ? tData.length : 0} 名`);

  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
