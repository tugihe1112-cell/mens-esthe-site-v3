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

  // AromaLysのロゴURL
  const logoUrl = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/AromaLys%20.png';

  try {
    console.log(`🚀 「AromaLys」のロゴ設定を再実行します...\n`);

    // "AromaLys"という文字列が含まれる店舗を大文字小文字区別せずに検索
    const res = await fetch(`${url}/rest/v1/shops?select=id,name&name=ilike.*AromaLys*`, { headers });
    const targetShops = await res.json();

    if (!targetShops || targetShops.length === 0) {
      console.log("⚠️ 「AromaLys」を含む店舗が見つかりませんでした。店名が異なっている可能性があります。");
      return;
    }

    for (const shop of targetShops) {
      console.log(`🖼️  更新中: ${shop.name} (ID: ${shop.id})`);
      
      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ image_url: logoUrl })
      });

      if (patchRes.ok) {
        console.log(`   ✅ ロゴ設定完了`);
      } else {
        console.error(`   ❌ 更新失敗: ${patchRes.statusText}`);
      }
    }

    console.log(`\n🎊 処理が終了しました。ブラウザをリロードして確認してください！`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
