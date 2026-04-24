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
    console.log(`🔍 データベースの shops テーブルの構造を確認します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?limit=1`, { headers });
    const data = await res.json();

    if (!data || data.length === 0) {
      console.log("⚠️ データが空のため、構造が確認できませんでした。");
      return;
    }

    console.log(`✅ shops テーブルのカラム（項目）一覧:`);
    const columns = Object.keys(data[0]);
    columns.forEach(col => console.log(` - ${col}`));

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
