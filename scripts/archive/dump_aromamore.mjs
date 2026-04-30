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
    // アロマモア4店舗の全データを取得
    const res = await fetch(`${url}/rest/v1/shops?id=in.(tokyo_chuo_ginza_aromamore,tokyo_minato_roppongi_aromamore,tokyo_toshima_ikebukuro_aromamore,tokyo_shinjuku_kabukicho_aromamore)`, { headers });
    const shops = await res.json();
    
    console.log(JSON.stringify(shops, null, 2));
    
    console.log(`\n💡 この出力結果を教えてくれ！原因のカラムを特定して、すぐに直す書き換えコードを出す。`);
  } catch (error) {
    console.error("エラー:", error);
  }
}
run();
