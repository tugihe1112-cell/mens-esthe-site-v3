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

  // 更新したい店舗のキーワードとロゴURLのリスト
  const updateTasks = [
    {
      shopName: 'ゆるスパ',
      searchKeywords: ['ゆるスパ', 'yuruspa'],
      logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/yuruspa.png'
    },
    {
      shopName: 'メンエスグループ',
      searchKeywords: ['メンエスグループ', 'メンエス グループ'],
      logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/menesgroup.png'
    }
  ];

  try {
    console.log(`🚀 複数店舗のロゴ一括設定を開始します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // タスクごとに処理を実行
    for (const task of updateTasks) {
      console.log(`\n========================================`);
      console.log(`🎯 対象: ${task.shopName} の更新を開始`);
      console.log(`========================================`);

      const targets = allShops.filter(shop => {
        const n = shop.name.toLowerCase();
        return task.searchKeywords.some(keyword => n.includes(keyword.toLowerCase()));
      });

      if (targets.length > 0) {
        for (const target of targets) {
          console.log(`🖼️  更新中: ${target.name} (ID: ${target.id})`);
          
          const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${target.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ image_url: task.logo })
          });

          if (patchRes.ok) {
            console.log(`   ✅ ロゴ設定完了`);
          } else {
            console.error(`   ❌ 更新失敗: ${patchRes.statusText}`);
          }
        }
      } else {
        console.log(`   ⚠️ 店舗が見つかりません: ${task.searchKeywords.join(' または ')}`);
      }
    }

    console.log(`\n🎊 全てのロゴ設定処理が終了しました。ブラウザをリロードして確認してください！`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
