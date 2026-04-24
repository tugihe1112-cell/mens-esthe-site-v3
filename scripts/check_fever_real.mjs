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

  const shopId = "tokyo_toshima_ikebukuro_fever";
  
  console.log(`🔍 本物の店舗ID [${shopId}] のDBの中身を直接確認します...\n`);

  try {
    // 1. 店舗の画像が本当に登録されているか？
    const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}&select=name,image_url,logo_url`, { headers });
    const shopData = await shopRes.json();
    console.log('🏬 店舗データ:');
    console.log(shopData);

    // 2. セラピストが本当にこのIDで登録されているか？
    const tRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}&select=name,image_url`, { headers });
    const tData = await tRes.json();
    console.log(`\n👩‍🔧 セラピストデータ（登録数: ${tData ? tData.length : 0}名）:`);
    if (tData && tData.length > 0) {
      console.log('サンプル 1人目:', tData[0]);
    } else {
      console.log('⚠️ データが1件もありません！APIが弾かれています！');
    }
  } catch (err) {
    console.error('エラー:', err);
  }
}

run();
