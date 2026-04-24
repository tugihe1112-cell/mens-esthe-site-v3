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

  console.log('🔍 正常な店舗（lynx等）と Fairy Land のデータを比較します...\n');

  try {
    // 1. お手本となる正常な店舗を探す (lynx)
    let refShopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*lynx*&select=*`, { headers });
    let refShops = await refShopRes.json();

    // 見つからなければ luxtime を探す
    if (!refShops || refShops.length === 0) {
      refShopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*lux*&select=*`, { headers });
      refShops = await refShopRes.json();
    }

    if (!refShops || refShops.length === 0) {
       console.log('⚠️ 比較対象の店舗(lynx, lux)が見つかりません。');
       return;
    }
    const refShop = refShops[0];

    // 2. Fairy Land を取得
    const fairyRes = await fetch(`${url}/rest/v1/shops?id=eq.tokyo_fairy_land&select=*`, { headers });
    const fairyShop = (await fairyRes.json())[0];

    console.log('🏬 【店舗データ構造の比較】');
    console.log(`⭕️ 正常店舗 [${refShop.name}]:`);
    console.log(`   - 🔑 image_url: ${refShop.image_url}`);
    console.log(`   - 🔑 image: ${refShop.image}`); 
    
    console.log(`\n❌ Fairy Land:`);
    console.log(`   - 🔑 image_url: ${fairyShop.image_url}`);
    console.log(`   - 🔑 image: ${fairyShop.image}`);
    
    console.log('\n--------------------------------------------------\n');

    console.log('👩‍🔧 【セラピストデータ構造の比較 (先頭1名)】');
    const refTRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${refShop.id}&limit=1`, { headers });
    const refT = (await refTRes.json())[0];

    const fairyTRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.tokyo_fairy_land&limit=1`, { headers });
    const fairyT = (await fairyTRes.json())[0];

    if(refT) {
        console.log(`⭕️ 正常店舗キャスト [${refT.name}]:`);
        console.log(`   - 🔑 image_url: ${refT.image_url}`);
        console.log(`   - 🔑 image: ${refT.image}`);
    }
    if(fairyT) {
        console.log(`\n❌ Fairy Landキャスト [${fairyT.name}]:`);
        console.log(`   - 🔑 image_url: ${fairyT.image_url}`);
        console.log(`   - 🔑 image: ${fairyT.image}`);
    }

    console.log('\n💡 【チェックポイント】');
    console.log('正常な店舗が「image」カラムにURLを持っていて、Fairy Landが「image_url」にしか持っていない場合、それがエラーの決定的な原因です。');

  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
