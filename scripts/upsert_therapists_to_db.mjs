import fs from 'fs';

async function run() {
  // 1. 環境変数の取得（確実な手動パース）
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' };

  if (!url || !key) {
    console.error('❌ .envの読み込みに失敗しました。');
    return;
  }

  // 2. Reactが使っている「正しいID」
  const targetShopIds = [
    'tokyo_shinagawa_gotanda_yuru_spa',
    'tokyo_setagaya_futakotamagawa_mens_esthe_group' // ← Reactが認識している正しいID
  ];

  console.log(`🚀 Supabaseの therapists テーブルへ直接Upsertを開始します...`);

  try {
    // 3. ローカルの完全なキャスト図鑑を読み込む
    const therapistsRaw = JSON.parse(fs.readFileSync('public/data/therapists.json', 'utf8'));
    const allTherapists = Array.isArray(therapistsRaw) ? therapistsRaw : therapistsRaw.therapists;

    for (const shopId of targetShopIds) {
      console.log(`\n📝 ターゲット: ${shopId}`);
      
      // 対象店舗のキャストだけを抽出（念のためプレフィックスで判定）
      const targetCasts = allTherapists.filter(t => t.id.startsWith(shopId));
      
      if (targetCasts.length === 0) {
        console.log(`⚠️ ローカルJSONに ${shopId} のキャストが見つかりません。`);
        continue;
      }

      console.log(`   → ${targetCasts.length} 名のデータをSupabaseへ送信中...`);

      let successCount = 0;
      let errorCount = 0;

      // 4. SupabaseへUpsert
      for (const cast of targetCasts) {
        const payload = {
          id: cast.id,
          shop_id: shopId, // Reactが検索に使うIDを強制セット
          name: cast.name,
          image_url: cast.image || cast.image_url || "",
          raw_data: { age: cast.age, size: cast.T || cast.size, sns: cast.sns }
        };

        const res = await fetch(`${url}/rest/v1/therapists`, {
          method: 'POST', // Prefer: resolution=merge-duplicates があるのでUpsertになる
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          successCount++;
        } else {
          console.error(`   ❌ ${cast.name} の送信エラー:`, await res.text());
          errorCount++;
        }
      }

      console.log(`   ✅ 送信完了（成功: ${successCount}名 / 失敗: ${errorCount}名）`);
    }

    console.log(`\n🎉 すべてのUpsert処理が完了しました！`);
    console.log(`👉 アプリケーション（ブラウザ）をリロードして確認してください。`);

  } catch (e) {
    console.error("❌ エラーが発生しました:", e.message);
  }
}

run();
