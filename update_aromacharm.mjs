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

  const targetKeyword = "AromaCharm"; // または "アロマチャーム"
  const updateData = {
    schedule_url: "https://aromacharm.net/schedule/",
    price_system: "70分: 14,000円\n90分: 18,000円\n120分: 24,000円\n150分: 30,000円"
  };

  try {
    console.log(`🔍 「${targetKeyword}」のスケジュールと料金システムを更新します...\n`);

    // "AromaCharm" または "アロマチャーム" を含む店舗を検索
    const res = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*AromaCharm*,name.ilike.*アロマチャーム*)&select=id,name`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      for (const shop of shops) {
        console.log(`🏠 店舗: ${shop.name} (ID: ${shop.id}) を更新中...`);

        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify(updateData)
        });

        if (patchRes.ok) {
          console.log(` ✅ 更新完了！`);
        } else {
          console.error(` ❌ 更新に失敗しました: ${patchRes.statusText}`);
        }
      }
      console.log("\n🎉 AromaCharmの更新が完了しました！");
    } else {
      console.log(`⚠️ 「${targetKeyword}」に該当する店舗が見つかりませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
