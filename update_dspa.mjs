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

  const targetKeyword = "D-SPA"; // または "ディースパ"
  
  // 📝 写真の「赤い方」の料金プランをここに入力してください！
  const priceSystemText = `
〇〇min: 〇〇,000円
〇〇min: 〇〇,000円
〇〇min: 〇〇,000円
  `.trim();

  const updateData = {
    schedule_url: "https://spa-d.com/schedule",
    price_system: priceSystemText
  };

  try {
    console.log(`🔍 「${targetKeyword}」のスケジュールと料金システムを更新します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*D-SPA*,name.ilike.*ディースパ*)&select=id,name`, { headers });
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
      console.log("\n🎉 D-SPAの更新が完了しました！");
    } else {
      console.log(`⚠️ 「${targetKeyword}」に該当する店舗が見つかりませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
