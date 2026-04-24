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
    console.log('🚀 店舗のロゴ画像（HANASPA / 昭和リフレッシュ館）を一括更新します...\n');

    // --- 1. HANASPA のロゴ更新 ---
    console.log('🌸 HANASPAのロゴを更新中...');
    const hanaspaRes = await fetch(`${url}/rest/v1/shops?brand_id=eq.hanaspa&select=id,name`, { headers });
    const hanaspaShops = await hanaspaRes.json();
    const hanaspaLogo = "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/HANA%20SPA.png";

    if (hanaspaShops && hanaspaShops.length > 0) {
      for (const shop of hanaspaShops) {
        await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ image_url: hanaspaLogo, logo_url: hanaspaLogo })
        });
        console.log(` ✅ ${shop.name} にロゴを設定しました！`);
      }
    } else {
      console.log(' ⚠️ HANASPAの店舗が見つかりませんでした。');
    }

    // --- 2. 昭和リフレッシュ館 のロゴ更新 ---
    console.log('\n🏮 昭和リフレッシュ館のロゴを更新中...');
    const showaRes = await fetch(`${url}/rest/v1/shops?name=ilike.*昭和リフレッシュ*&select=id,name`, { headers });
    const showaShops = await showaRes.json();
    const showaLogo = "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/shouwanorifresh.png";

    if (showaShops && showaShops.length > 0) {
      for (const shop of showaShops) {
        await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ image_url: showaLogo, logo_url: showaLogo })
        });
        console.log(` ✅ ${shop.name} にロゴを設定しました！`);
      }
    } else {
      console.log(' ⚠️ 昭和リフレッシュ館の店舗が見つかりませんでした。');
    }

    console.log('\n🎊 完璧です！すべての店舗にロゴがセットされました。');
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
