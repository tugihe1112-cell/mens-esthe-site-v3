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
    console.log(`🔍 「lux time」のお手本データと、対象2店舗の現状をデータベースから直接確認します...\n`);
    
    // 全店舗データを取得
    const res = await fetch(`${url}/rest/v1/shops?select=*`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ 店舗データが取得できませんでした。");
      return;
    }

    // lux time、昭和リフレッシュ館、GOKUJOU を抽出
    const targets = allShops.filter(s => {
      const n = (s.name || '').toLowerCase();
      return n.includes('lux') || n.includes('昭和') || n.includes('goku') || n.includes('極嬢');
    });

    if (targets.length === 0) {
      console.log("⚠️ 該当する店舗が見つかりませんでした。");
    } else {
      targets.forEach(s => {
        console.log(`--------------------------------------------------`);
        console.log(`【店舗名】 ${s.name}`);
        console.log(`【ID】 ${s.id}`);
        console.log(`【ブランドID】 ${s.brand_id || 'なし'}`);
        console.log(`【ロゴURL】 ${s.image_url || s.logo_url || 'なし'}`);
        console.log(`【料金システム】\n${s.price_system || 'なし'}`);
      });
      console.log(`--------------------------------------------------`);
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
