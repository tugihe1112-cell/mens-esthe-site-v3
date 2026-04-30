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

  try {
    // --- 1. E小町の完全削除 ---
    console.log(`🧹 「E小町」関連の全店舗およびキャストの削除を開始します...`);
    
    // 「小町」が含まれる店舗をすべて検索
    const resShops = await fetch(`${url}/rest/v1/shops?select=id,name&name=ilike.*小町*`, { headers });
    const ekomachiShops = await resShops.json();

    if (ekomachiShops && ekomachiShops.length > 0) {
      for (const shop of ekomachiShops) {
        console.log(`   🗑️  削除中: ${shop.name} (ID: ${shop.id})`);
        
        // 先にキャストを削除
        await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, {
          method: 'DELETE',
          headers: headers
        });
        
        // 店舗を削除
        await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'DELETE',
          headers: headers
        });
      }
      console.log(`   ✅ E小町の削除が完了しました。`);
    } else {
      console.log(`   ⚠️  E小町に該当する店舗が見つかりませんでした。`);
    }

    // --- 2. Laulimaのロゴ設定 ---
    console.log(`\n🚀 「Laulima」のロゴ設定を開始します...`);
    const laulimaLogo = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Laulima.png';
    
    const resLaulima = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await resLaulima.json();
    
    const laulimaTargets = allShops.filter(shop => 
      shop.name.toLowerCase().includes('laulima') || shop.name.includes('ラウリマ')
    );

    if (laulimaTargets.length > 0) {
      for (const target of laulimaTargets) {
        console.log(`   🖼️  ロゴ更新中: ${target.name} (ID: ${target.id})`);
        await fetch(`${url}/rest/v1/shops?id=eq.${target.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ image_url: laulimaLogo })
        });
      }
      console.log(`   ✅ Laulimaのロゴ設定が完了しました。`);
    } else {
      console.log(`   ⚠️  Laulimaが見つかりませんでした。`);
    }

    console.log(`\n🎊 すべての処理が終了しました。ブラウザをリロードして確認してください！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
