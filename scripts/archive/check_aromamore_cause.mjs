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
    console.log(`🔍 データベースから「AROMA more (アロマモア)」を検索し、原因を調査します...\n`);

    // 全店舗を取得 (読み取り専用)
    const res = await fetch(`${url}/rest/v1/shops?select=*`, { headers });
    const allShops = await res.json();

    if (!allShops || allShops.length === 0) {
      console.log("⚠️ データが取得できませんでした。");
      return;
    }

    // 「アロマモア」または「AROMA more」が含まれる店舗を抽出
    const targetShops = allShops.filter(shop =>
      shop.name.includes('アロマモア') || shop.name.toLowerCase().includes('aroma more')
    );

    if (targetShops.length === 0) {
      console.log("⚠️ 該当する店舗が見つかりませんでした。");
      return;
    }

    console.log(`🚨 合計 ${targetShops.length} 件の「AROMA more」関連店舗を発見しました。\n`);

    // 各店舗の詳細と、紐づいているキャスト数を確認
    for (const shop of targetShops) {
      const castRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id`, { headers });
      const casts = await castRes.json();
      const castCount = casts ? casts.length : 0;

      console.log(`--------------------------------------------------`);
      console.log(`🏠 店舗名: ${shop.name}`);
      console.log(`🆔 店舗ID: ${shop.id}`);
      console.log(`🔗 サイトURL: ${shop.website_url || '未設定'}`);
      console.log(`👯‍♀️ 登録キャスト数: ${castCount} 名`);
    }

    console.log(`--------------------------------------------------\n`);
    console.log(`💡 【原因究明のポイント】`);
    console.log(`店舗IDの違いと、それぞれの「登録キャスト数」を見て統合方針を決めましょう！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
