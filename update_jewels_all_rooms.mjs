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

  const scheduleUrl = "https://aroma-jewels.jp/schedule";
  const priceSystemText = "60分コース: 14,000円\n70分オールあおむけコース: 18,000円\n90分コース: 18,000円\n120分コース: 23,000円\n150分コース: 28,000円";

  try {
    console.log(`🔍 「Aroma Jewels」の全ルームにスケジュールと料金システムを更新します...\n`);

    // "Jewel" または "ジュエル" を含む店舗をすべて検索
    const res = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*Jewel*,name.ilike.*ジュエル*)&select=id,name`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      let updateCount = 0;
      for (const shop of shops) {
        console.log(`🏠 ヒット店舗: ${shop.name}`);

        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ 
            schedule_url: scheduleUrl,
            price_system: priceSystemText
          })
        });

        if (patchRes.ok) {
          console.log(` ✅ 更新完了！`);
          updateCount++;
        } else {
          console.error(` ❌ 更新に失敗しました: ${patchRes.statusText}`);
        }
      }
      console.log(`\n🎉 計 ${updateCount} 店舗の Aroma Jewels の更新が完了しました！ブラウザをリロードしてください！`);
    } else {
      console.log(`⚠️ データベースに「Jewel」や「ジュエル」を含む店舗が見つかりませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
