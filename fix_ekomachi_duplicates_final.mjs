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

  // ログから判明したID
  const deleteShopId = 'tokyo_shinjuku_yotsuya_e_komachi';
  const keepShopId = 'tokyo_chiyoda_yotsuya_e_komachi';

  try {
    console.log(`🧹 重複している「E小町」の最終整理を開始します...\n`);

    // 1. 重複店舗（E小町 (いいこまち)）の削除
    console.log(`   ▶ 削除対象: E小町 (いいこまち) (ID: ${deleteShopId})`);
    const delRes = await fetch(`${url}/rest/v1/shops?id=eq.${deleteShopId}`, {
      method: 'DELETE',
      headers: headers
    });

    if (delRes.ok) {
      console.log(`      ✅ 削除完了`);
    } else {
      console.error(`      ❌ 削除失敗: ${delRes.statusText}`);
    }

    // 2. 念のため残す店舗の名前が「E小町 四谷店」になっているか確認＆更新
    console.log(`\n   ▶ 残す店舗: E小町 四谷店 (ID: ${keepShopId})`);
    const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${keepShopId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ name: 'E小町 四谷店' })
    });

    if (patchRes.ok) {
      console.log(`      ✅ 店舗名の確認・更新完了`);
    } else {
      console.error(`      ❌ 更新失敗: ${patchRes.statusText}`);
    }

    console.log(`\n🎊 処理が完了しました！ブラウザで再読み込みして、「E小町 四谷店」が1つだけになっているか確認してください。`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
