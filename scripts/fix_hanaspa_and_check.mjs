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
    // --- ① & ②: 名前とWebサイトURLの一括更新 ---
    console.log('🚀 1. 店舗名とOfficial WebsiteのURLを更新します...');
    
    // 「極嬢」または「HANASPA」が含まれる店舗をすべて取得
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*極嬢*&select=id,name`, { headers });
    let targets = await shopRes.json();
    
    if (!targets || targets.length === 0) {
      // 既にHANASPAに変わっているかもしれないので再検索
      const shopRes2 = await fetch(`${url}/rest/v1/shops?name=ilike.*HANASPA*&select=id,name`, { headers });
      targets = await shopRes2.json();
    }

    if (targets && targets.length > 0) {
      for (const shop of targets) {
        await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            name: "HANASPA (ハナスパ) 旧GOKUJOU 極嬢",
            website_url: "https://esthe-hanaspa.com/"
          })
        });
        console.log(` ✅ 更新完了: ${shop.id}`);
      }
    } else {
      console.log(' ⚠️ 対象の店舗が見つかりませんでした。');
    }

    // --- ③: セラピストの登録状況を調査 ---
    console.log('\n🔍 2. セラピストが表示されない原因を調査します...');
    
    if (targets && targets.length > 0) {
      for (const shop of targets) {
        const tRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`, { headers });
        const therapists = await tRes.json();
        
        console.log(`--------------------------------------------------`);
        console.log(`【店舗ID】 ${shop.id}`);
        console.log(`【セラピスト登録数】 ${therapists ? therapists.length : 0} 名`);
        if (therapists && therapists.length > 0) {
          console.log(`【サンプル】 ${therapists[0].name}, ${therapists[1]?.name || ''}...`);
        }
      }
      console.log(`--------------------------------------------------`);
      console.log(`💡 もし「大森店(omori)」には44名いて、他の店舗が0名になっている場合、画面で0名の店舗ページを開いているのが原因です！`);
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
