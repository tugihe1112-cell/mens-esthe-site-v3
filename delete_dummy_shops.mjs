import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

  // 削除したい店舗のキーワード
  const targets = ["六本木メンズエステ", "LugarTOKYO", "lugar spa"];

  try {
    console.log("🧹 不要な店舗データをデータベースから完全に削除します...\n");

    for (const target of targets) {
      // 1. キーワードで店舗を検索
      const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(target)}*&select=id,name`, { headers });
      const shops = await res.json();

      if (shops && shops.length > 0) {
        for (const shop of shops) {
          console.log(`🗑️ 「${shop.name}」 (ID: ${shop.id}) を発見しました。削除処理を開始します...`);

          // 2. 制約エラーを防ぐため、紐づくセラピストとクチコミを先に削除
          await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });
          await fetch(`${url}/rest/v1/reviews?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });

          // 3. 店舗本体を削除
          const delRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, { method: 'DELETE', headers });

          if (delRes.ok) {
            console.log(` ✅ 削除完了しました！`);
          } else {
            console.error(` ❌ 削除に失敗しました: ${delRes.statusText}`);
          }
        }
      } else {
        console.log(` ℹ️ 「${target}」を含む店舗は見つかりませんでした（すでに削除済みの可能性があります）。`);
      }
    }

    console.log("\n🎉 お掃除が完了しました！ブラウザをリロードして確認してください！");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
