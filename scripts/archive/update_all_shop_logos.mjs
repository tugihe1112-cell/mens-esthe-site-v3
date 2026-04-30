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

  // 登録名に合わせた検索キーワードとロゴURLのペア
  const logoSettings = [
    { search: 'ONE ROOM', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/ONE%20ROOM.png' },
    { search: '玉楼', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/gyokurou.png' },
    { search: 'Limited Spa', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Limited%20Spa.png' },
    { search: 'ピーチネクスト', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/peach%20next.png' },
    { search: 'Dejavu', logo: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Dejavu%20TOKYO%20.png' }
  ];

  try {
    console.log(`🚀 店舗ロゴの一括設定を開始します...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=id,name`, { headers });
    const allShops = await res.json();

    for (const setting of logoSettings) {
      const target = allShops.find(s => 
        s.name.toLowerCase().includes(setting.search.toLowerCase())
      );

      if (target) {
        console.log(`🖼️  更新中: ${target.name} (ID: ${target.id})`);
        
        // カラム名を image_url に修正して更新
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
      } else {
        console.log(`   ⚠️ 店舗が見つかりません: ${setting.search}`);
      }
    }

    console.log(`\n🎊 すべてのロゴ設定処理が終了しました。`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
