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
  const deleteShopId = 'tokyo_shinjuku_yotsuya_sanchome_e_komachi';
  const keepShopId = 'tokyo_chiyoda_yotsuya_e_komachi';

  try {
    console.log(`🧹 重複している「E小町」の整理を開始します...\n`);

    // 1. 重複店舗（四谷三丁目店）の削除
    const delRes = await fetch(`${url}/rest/v1/shops?id=eq.${deleteShopId}`, {
      method: 'DELETE',
      headers: headers
    });

    if (delRes.ok) {
      console.log(`   ✅ 不要な重複店舗（四谷三丁目店）を完全に削除しました`);
    } else {
      console.error(`   ❌ 削除失敗: ${delRes.statusText}`);
    }

    // 2. 残す店舗（四谷店）の名前を綺麗にリネーム
    const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${keepShopId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ name: 'E小町 四谷店' })
    });

    if (patchRes.ok) {
      console.log(`   ✅ メイン店舗の名前を「E小町 四谷店」に整理しました`);
    } else {
      console.error(`   ❌ リネーム失敗: ${patchRes.statusText}`);
    }

    console.log(`\n🎊 処理が完了しました！ブラウザで再読み込みして確認してみてください。`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
