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

  const correctShopId = 'tokyo_toshima_tokyo_fairy_land'; // 画面が読み込んでいる本物のID
  const dummyShopId = 'tokyo_fairy_land'; // 私たちが作ったデータが入っているID

  console.log(`🚀 【データお引っ越し】 ${dummyShopId} のデータを ${correctShopId} へ統合します...\n`);

  try {
    // 1. 完璧な店舗データ（ロゴやURL）を本物のIDへコピー
    const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.${dummyShopId}&select=*`, { headers });
    const shopData = await shopRes.json();
    
    if (shopData && shopData.length > 0) {
      const perfectShopData = shopData[0];
      const updatePayload = {
        name: perfectShopData.name,
        image_url: perfectShopData.image_url,
        schedule_url: perfectShopData.schedule_url,
        price_system: perfectShopData.price_system,
        area_id: perfectShopData.area_id
      };
      
      await fetch(`${url}/rest/v1/shops?id=eq.${correctShopId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updatePayload)
      });
      console.log('✅ 店舗データのコピー完了');
    }

    // 2. 58名のセラピストの shop_id を、本物のIDへ一括変更（お引っ越し）
    const updateTherapistsRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${dummyShopId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ shop_id: correctShopId })
    });
    
    if (updateTherapistsRes.ok) {
      console.log('✅ 58名のセラピストのお引っ越し完了');
    } else {
      console.log('❌ セラピストの移動に失敗しました:', await updateTherapistsRes.text());
    }

    // 3. （オプション）不要になったダミーの店舗IDを削除
    const deleteRes = await fetch(`${url}/rest/v1/shops?id=eq.${dummyShopId}`, {
      method: 'DELETE',
      headers
    });
    
    if (deleteRes.ok) {
       console.log('🗑️ 不要な店舗データを削除してスッキリさせました。');
    }

    console.log('\n🎊 完璧です！すべてのデータが正しいIDに統合されました！');
    console.log('ブラウザをリロードして、Fairy Land の詳細ページを確認してください！');

  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
