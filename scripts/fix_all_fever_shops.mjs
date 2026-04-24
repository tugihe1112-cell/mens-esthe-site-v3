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
    console.log('🚀 データベースに存在する「すべてのFEVER候補」を根こそぎ検索します...');
    const logoUrl = "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/FEVER.png";
    
    // IDにfeverを含む、名前にFEVERを含む、brand_idがfever、または名前なし店舗
    const res = await fetch(`${url}/rest/v1/shops?or=(id.ilike.*fever*,name.ilike.*FEVER*,brand_id.eq.fever,name.ilike.*名前なし*)&select=id,name`, { headers });
    const shops = await res.json();
    
    if (shops && shops.length > 0) {
      console.log(`\n🎯 ${shops.length}店舗を発見しました！すべてFEVERとして統一・上書きします。`);
      
      for (const s of shops) {
        console.log(`  🔄 処理中: ${s.name} (ID: ${s.id})`);
        
        await fetch(`${url}/rest/v1/shops?id=eq.${s.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ 
            name: "FEVER",
            image_url: logoUrl,
            brand_id: "fever",
            schedule_url: "https://esthe-fever.com/schedule/",
            price_system: "60min 12,000yen\n90min 16,000yen\n120min 21,000yen"
          })
        });
      }
      console.log('\n🎊 完璧です！発見した全店舗にFEVERのロゴ・名前・ブランドIDを叩き込みました！');
    } else {
      console.log('⚠️ 対象となる店舗が見つかりませんでした。');
    }

  } catch (err) {
    console.error('エラー:', err);
  }
}

run();
