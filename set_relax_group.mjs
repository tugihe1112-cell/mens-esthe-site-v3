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

  const targetShopIds = [
    'tokyo_minato_shinbashi_relax_tokyo',
    'tokyo_shinagawa_gotanda_relax'
  ];

  try {
    console.log(`🔗 品川と新橋の「RELAX」に共通のグループIDを設定します...\n`);

    for (const shopId of targetShopIds) {
      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ group_id: 'relax_group' })
      });

      if (patchRes.ok) {
        console.log(`   ✅ ID: ${shopId} に group_id: 'relax_group' を設定しました`);
      } else {
        console.error(`   ❌ 設定失敗: ${patchRes.statusText}`);
      }
    }

    console.log(`\n🎊 データベースの紐付けが完了しました！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
