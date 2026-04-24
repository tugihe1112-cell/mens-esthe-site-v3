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
    console.log('🚀 【最終手段】SQLクエリで強制的にロゴ画像（image_url）を書き換えます...\n');

    // HANASPA 用の SQL (brand_id が hanaspa のものすべて)
    const sqlHanaspa = `
      UPDATE shops 
      SET image_url = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/HANA%20SPA.png' 
      WHERE brand_id = 'hanaspa';
    `;

    // 昭和リフレッシュ館用の SQL (名前に昭和リフレッシュが含まれるものすべて)
    const sqlShowa = `
      UPDATE shops 
      SET image_url = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/shouwanorifresh.png' 
      WHERE name ILIKE '%昭和リフレッシュ%';
    `;

    console.log('--- 実行するSQL ---');
    console.log(sqlHanaspa);
    console.log(sqlShowa);
    console.log('-------------------\n');

    // SQLを直接実行するためのRPC呼び出し（もしRPCがない場合はRESTで全件上書き）
    console.log('🌸 HANASPAのロゴをREST APIで強制上書きします...');
    const hanaspaRes = await fetch(`${url}/rest/v1/shops?brand_id=eq.hanaspa`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ 
        image_url: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/HANA%20SPA.png'
      })
    });
    
    if (hanaspaRes.ok) {
       console.log(' ✅ HANASPAの画像URLを強制セットしました！');
    } else {
       console.log(' ❌ HANASPAのエラー:', await hanaspaRes.text());
    }

    console.log('🏮 昭和リフレッシュ館のロゴをREST APIで強制上書きします...');
    const showaRes = await fetch(`${url}/rest/v1/shops?name=ilike.*昭和リフレッシュ*`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ 
        image_url: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/shouwanorifresh.png'
      })
    });

    if (showaRes.ok) {
       console.log(' ✅ 昭和リフレッシュ館の画像URLを強制セットしました！');
    } else {
       console.log(' ❌ 昭和のエラー:', await showaRes.text());
    }

    console.log('\n🎊 もし上記で ❌ が出た場合は、Supabaseの画面から先ほど表示した SQL を直接実行してください！');

  } catch (err) {
    console.error('エラー:', err);
  }
}

run();
