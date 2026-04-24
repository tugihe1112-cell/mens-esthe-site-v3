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

  try {
    console.log("🔍 「温故知新」の登録状況をチェックしています...\n");
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*温故知新*&select=id,name,schedule_url,price_system`, { headers });
    const json = await res.json();

    if (json && json.length > 0) {
      console.log("✅ 以下の店舗が見つかりました！\n");
      json.forEach(shop => {
        console.log(`🏠 店舗名: ${shop.name}`);
        console.log(`🆔 ID: ${shop.id}`);
        console.log(`🔗 スケジュールURL: ${shop.schedule_url ? shop.schedule_url : '❌ 未設定'}`);
        console.log(`💰 料金システム:\n${shop.price_system ? shop.price_system.split('\n').map(line => `   ${line}`).join('\n') : '   ❌ 未設定'}`);
      });
    } else {
      console.log("⚠️ 「温故知新」という名前の店舗は見つかりませんでした。");
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
