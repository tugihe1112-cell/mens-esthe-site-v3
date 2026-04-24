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

  try {
    console.log('🔍 データベースから「Fairy」関連、または「名前なし店舗」の登録エリアを検索します...\n');
    
    // Fairy, フェアリー、または名前なし店舗 を検索
    const res = await fetch(`${url}/rest/v1/shops?or=(name.ilike.*Fairy*,name.ilike.*フェアリー*,name.ilike.*名前なし*)&select=id,name,prefecture,city,area`, { headers });
    const shops = await res.json();
    
    if (shops && shops.length > 0) {
      console.log('🎯 以下の店舗データが見つかりました：\n');
      shops.forEach(s => {
        console.log(`📌 ID: ${s.id}`);
        console.log(`   名前: ${s.name}`);
        console.log(`   登録エリア: ${s.prefecture || '未設定'} / ${s.city || '未設定'} / ${s.area || '未設定'}`);
        console.log('--------------------------------------------------');
      });
    } else {
      console.log('⚠️ 該当する店舗が見つかりませんでした。');
    }

  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
