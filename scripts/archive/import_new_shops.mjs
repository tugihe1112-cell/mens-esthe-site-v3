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

  // --- 追加・更新する店舗データの定義 ---
  const newShops = [
    {
      id: 'tokyo_shinagawa_gotanda_yuru_spa',
      name: 'ゆるスパ 五反田店',
      area_id: 'tokyo_shinagawa_gotanda',
      website_url: 'https://yuru-spa.com/gotanda/',
      schedule_url: 'https://yuru-spa.com/gotanda/schedule/',
      price_system: '70分 13,000円 / 90分 15,000円 / 120分 20,000円 / 150分 26,000円 / 180分 33,500円 / 240分 48,500円'
    },
    {
      id: 'tokyo_setagaya_futakotamagawa_menes_group',
      name: 'メンエスグループ 二子玉川',
      area_id: 'tokyo_setagaya_futakotamagawa',
      website_url: 'https://www.futakotamagawa-mens-esthe.com/',
      schedule_url: 'https://www.futakotamagawa-mens-esthe.com/schedule/',
      price_system: '70分 14,000円 / 90分 18,000円 / 110分 22,000円'
    }
  ];

  try {
    console.log(`🚀 店舗データの追加・更新を開始します...\n`);

    for (const shop of newShops) {
      console.log(`🔍 「${shop.name}」をチェック中...`);

      // 1. 既存店舗かどうかの確認
      const checkRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, { headers });
      const existingShop = await checkRes.json();

      if (existingShop && existingShop.length > 0) {
        // 2. 既存の場合は情報を更新 (PATCH)
        console.log(`   📝 既存のデータが見つかりました。情報を更新します。`);
        const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify(shop)
        });
        if (updateRes.ok) {
           console.log(`   ✅ 更新成功！`);
        } else {
           console.error(`   ❌ 更新失敗: ${updateRes.statusText}`);
        }
      } else {
        // 3. 新規の場合は追加 (POST)
        console.log(`   ✨ 新規店舗です。データを追加します。`);
        const insertRes = await fetch(`${url}/rest/v1/shops`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify([shop])
        });
        if (insertRes.ok) {
           console.log(`   ✅ 追加成功！`);
        } else {
           console.error(`   ❌ 追加失敗: ${insertRes.statusText}`);
        }
      }
    }

    console.log(`\n🎊 店舗データの処理が完了しました！次はキャストデータの登録スクリプトをご用意しますか？`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
