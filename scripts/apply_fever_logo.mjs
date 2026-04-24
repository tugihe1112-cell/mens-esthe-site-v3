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
    const logoUrl = "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/FEVER.png";
    console.log('🚀 FEVERのロゴを一括反映しています...');

    // brand_id が fever の店舗、または名前に FEVER を含む店舗を対象にします
    const res = await fetch(`${url}/rest/v1/shops?or=(brand_id.eq.fever,name.ilike.*FEVER*)`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ 
        image_url: logoUrl,
        logo_url: logoUrl 
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`✅ 成功！ ${data.length} 店舗にロゴを設定しました。`);
    } else {
      console.log('❌ エラーが発生しました:', await res.text());
    }
  } catch (err) {
    console.error('エラー:', err);
  }
}

run();
