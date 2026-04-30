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

  const logoSettings = [
    { search: 'ONE ROOM', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/ONE%20ROOM.png' },
    { search: '玉楼', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/gyokurou.png' },
    { search: 'Limited Spa', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Limited%20Spa.png' },
    { search: 'ピーチネクスト', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/peach%20next.png' },
    { search: 'Dejavu', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Dejavu%20TOKYO%20.png' }
  ];

  try {
    console.log(`🚀 店舗ロゴの一括設定を開始します（全系列店対応版）...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    for (const setting of logoSettings) {
      // find（1件）ではなく、filter（複数件）ですべての系列店を取得
      const targets = allShops.filter(s => 
        s.name.toLowerCase().includes(setting.search.toLowerCase())
      );

      if (targets.length > 0) {
        for (const target of targets) {
          console.log(`🖼️  更新中: ${target.name} (ID: ${target.id})`);
          
          const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${target.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ image_url: setting.logo })
          });

          if (patchRes.ok) {
            console.log(`   ✅ ロゴ設定完了`);
          } else {
            console.error(`   ❌ 更新失敗: ${patchRes.statusText}`);
          }
        }
      } else {
        console.log(`   ⚠️ 店舗が見つかりません: ${setting.search}`);
      }
    }

    console.log(`\n🎊 すべてのロゴ設定処理が終了しました。ブラウザをリロードして確認してください！`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
