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
    console.log("🔍 成功した62名のデータを抽出中...");
    const castsRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.tokyo_shibuya_aromatiamo`, { headers });
    const casts = await castsRes.json();

    if (!casts || casts.length === 0) {
      console.log("❌ データが見つかりません。");
      return;
    }

    console.log("🌐 サイト上に表示されている本当の「TIAMO」を探しています...");
    // 英語のTIAMOで検索して、表記揺れ（ティアモ/ティアーモ）を全て拾う
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*TIAMO*&select=id,name`, { headers });
    const shops = await shopRes.json();

    for (const shop of shops) {
      if (shop.id === 'tokyo_shibuya_aromatiamo') continue; // コピー元はスキップ

      console.log(`\n⏳ ${shop.name} へデータをコピー中...`);

      // 一旦空にする
      await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });

      // データを整形して流し込む
      const insertData = casts.map(c => {
        const { id, created_at, ...rest } = c; // 古いIDなどを削除
        return {
          ...rest,
          shop_id: shop.id,
          id: `${shop.id}_${c.name}_${Math.random().toString(36).substr(2, 5)}` // 新しいIDを発行
        };
      });

      const res = await fetch(`${url}/rest/v1/therapists`, { method: 'POST', headers, body: JSON.stringify(insertData) });
      if (res.ok) {
        console.log(`✅ コピー完了！`);
      } else {
        console.error(`❌ コピー失敗:`, await res.text());
      }
    }
    console.log("\n🎉 すべてのTIAMO店舗に女の子のデータが反映されました！ブラウザをご確認ください！");
  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
