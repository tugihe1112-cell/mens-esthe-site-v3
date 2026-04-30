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

  // 4店舗の検索キーワードとロゴURLのペア
  const logoSettings = [
    { 
      searchKeywords: ['aroma mrs', 'アロマミセス'], 
      logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/AROMA%20MRS.png' 
    },
    { 
      searchKeywords: ['elterastokyo', 'elterastokyo', 'エルテラス'], 
      logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/eltrelas.png' 
    },
    { 
      searchKeywords: ['grand chariot', 'グランシャリオ'], 
      logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/GRAND%20CHARIOT.png' 
    },
    { 
      searchKeywords: ['r.sスパ', 'rsスパ', 'rs-spa'], 
      logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/R.sspa.png' 
    }
  ];

  try {
    console.log(`🚀 4店舗のロゴ一括設定を開始します（全系列店対応版）...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    for (const setting of logoSettings) {
      // 指定されたキーワードに合致する店舗を抽出
      const targets = allShops.filter(shop => {
        const n = shop.name.toLowerCase();
        // IDが直通でわかっているものや、キーワードに部分一致するものを対象とする
        return setting.searchKeywords.some(keyword => n.includes(keyword.toLowerCase())) || 
               (setting.searchKeywords.includes('rs-spa') && shop.id === 'tokyo_shinjuku_takadanobaba_rs-spa');
      });

      if (targets.length > 0) {
        for (const target of targets) {
          console.log(`🖼️  更新中: ${target.name} (ID: ${target.id})`);
          
          const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${target.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ image_url: setting.logo })
          });

          if (patchRes.ok) {
            console.log(`   ✅ ロゴ設定完了`);
          } else {
            console.error(`   ❌ 更新失敗: ${patchRes.statusText}`);
          }
        }
      } else {
        console.log(`   ⚠️ 店舗が見つかりません: ${setting.searchKeywords[0]}`);
      }
    }

    console.log(`\n🎊 ロゴ設定処理が終了しました。ブラウザをリロードして確認してください！`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
