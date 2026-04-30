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
    console.log(`🔍 データベースの項目名（カラム）を調査します...\n`);
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*Tokyo%20Aroma%20Este*&limit=1`, { headers });
    const shops = await res.json();

    if (shops && shops.length > 0) {
      console.log(`✅ 取得した店舗: ${shops[0].name}`);
      console.log(`\n👇【この下の結果をコピペして教えてください！】👇`);
      console.log(Object.keys(shops[0]).join(", "));
      console.log(`👆====================================👆\n`);
      
      // 現在登録されているリンクの中身も念のため表示
      console.log(`💡 現在のデータの中身:`);
      console.log(shops[0]);
    } else {
      console.log(`⚠️ 店舗が取得できませんでした。`);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
