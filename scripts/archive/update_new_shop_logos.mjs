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

  // 新規3店舗の検索キーワードとロゴURLのペア
  const logoSettings = [
    { 
      searchKeywords: ['mitsubachi', 'ミツバチ'], 
      logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/MITSUBACHI%20.png' 
    },
    { 
      searchKeywords: ['tokyopla', 'トキョプラ', 'ティープラス'], 
      logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/tokyoplus.png' 
    },
    { 
      searchKeywords: ['aroma glamour', 'アロマグラマー'], 
      logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/AROMA%20GLAMOUR.png' 
    }
  ];

  try {
    console.log(`🚀 新規3店舗のロゴ一括設定を開始します（全系列店対応版）...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    for (const setting of logoSettings) {
      // 複数のキーワードのいずれかに合致するすべての系列店を取得
      const targets = allShops.filter(shop => {
        const n = shop.name.toLowerCase();
        return setting.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
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

    console.log(`\n🎊 すべてのロゴ設定処理が終了しました。ブラウザをリロードして確認してください！`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
