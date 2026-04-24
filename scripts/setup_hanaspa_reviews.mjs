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
    // 1. DBの brand_id を一括設定
    console.log('🔗 1. 全店舗を「HANASPA」ブランドとして連結（brand_idを付与）します...');
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*HANASPA*&select=id`, { headers });
    const targetShops = await shopRes.json();

    if (targetShops && targetShops.length > 0) {
      for (const shop of targetShops) {
        await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ brand_id: "hanaspa" }) // ここでクチコミ吸収のヘソを繋ぐ！
        });
      }
      console.log(`✅ ${targetShops.length} 店舗の brand_id を "hanaspa" に統一しました！`);
    } else {
      console.log('⚠️ 対象店舗が見つかりませんでした。');
    }

    // 2. React側のクチコミ吸収ロジックの確認
    console.log('\n🔍 2. React側のクチコミ吸収ロジックを解析中...');
    const filePath = 'src/pages/ShopDetailPage.jsx';
    if (fs.existsSync(filePath)) {
      const lines = fs.readFileSync(filePath, 'utf8').split('\n');
      const reviewIdx = lines.findIndex(l => l.includes('supabase') && l.includes('reviews'));
      
      if (reviewIdx !== -1) {
        console.log(`\n📄 【ShopDetailPage.jsx のクチコミ取得部分】`);
        console.log('--------------------------------------------------');
        console.log(lines.slice(Math.max(0, reviewIdx - 5), Math.min(lines.length, reviewIdx + 15)).join('\n'));
        console.log('--------------------------------------------------');
      } else {
        console.log('⚠️ クチコミを取得しているコードが自動で見つかりませんでした。');
      }
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
