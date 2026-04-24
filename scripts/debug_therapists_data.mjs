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

  const shopId = 'tokyo_fairy_land';

  console.log(`🔍 デバッグ: [${shopId}] のセラピストデータを取得します...\n`);

  try {
    const res = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}&select=name,image_url`, { headers });
    
    if (!res.ok) {
      console.error(`❌ エラー: データ取得失敗 (${res.status})`);
      return;
    }

    const therapists = await res.json();
    
    if (therapists && therapists.length > 0) {
      console.log(`✅ ${therapists.length} 名のデータを取得しました。\n`);
      console.log('📄 最初の3名の image_url を確認します:');
      
      for (let i = 0; i < Math.min(3, therapists.length); i++) {
        const t = therapists[i];
        console.log(`  - 名前: ${t.name}`);
        console.log(`    image_url: ${t.image_url === "" ? '"" (空文字列)' : t.image_url === null ? 'null' : `'${t.image_url}'`}`);
      }
    } else {
      console.log('⚠️ セラピストデータが1件も取得できませんでした。');
    }

  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
