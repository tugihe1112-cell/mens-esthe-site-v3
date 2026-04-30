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

  // --- 汎用: 店舗データ更新関数 ---
  const updateShop = async (searchQueries, updateData) => {
    let data = [];
    for (const query of searchQueries) {
      const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(query)}*&select=id,name`, { headers });
      const json = await res.json();
      if (json && json.length > 0) {
        data = json;
        break; // 見つかったらループ終了
      }
    }
    
    if (data.length === 0) {
      console.log(`❌ 「${searchQueries[0]}」が見つかりませんでした。`);
      return null;
    }

    let successCount = 0;
    for (const shop of data) {
      const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(updateData)
      });
      if (updateRes.ok) {
        console.log(`✅ ${shop.name} の更新に成功しました。`);
        successCount++;
      } else {
        console.error(`❌ ${shop.name} の更新に失敗しました。`);
      }
    }
    return data;
  };

  try {
    console.log("⏳ 3店舗のスケジュール・料金システムを更新中...\n");

    // 1. エステの王様
    const kingSystem = 
`80分　18,000円 → OPEN割引 16,000円
100分　22,000円 → OPEN割引 20,000円
120分　26,000円 → OPEN割引 24,000円`;
    await updateShop(["エステの王様"], { schedule_url: "https://www.estheking.jp/schedule/", price_system: kingSystem });

    console.log("-----------------------");

    // 2. 大人のやすらぎSPA
    // 両店のリンクを改行付きで設定
    const otonaScheduleUrls = 
`【恵比寿店 予約】
https://www.otonaspa-tokyo.com/reserve?shop_id=10
【銀座店 予約】
https://www.otonaspa-tokyo.com/reserve?shop_id=12`;

    const otonaSystem = 
`【大人のやすらぎトリートメント】
リラックス＆ボディメンテナンス 90分　17,000円(税込)
リラックス＆ボディメンテナンス 120分　21,000円(税込)
リラックス＆ボディメンテナンス 150分　27,000円(税込)
リラックス＆ボディメンテナンス 180分　32,000円(税込)`;

    // 恵比寿店と銀座店の両方に同じ内容をセット
    await updateShop(["大人のやすらぎ", "やすらぎSPA"], { schedule_url: otonaScheduleUrls, price_system: otonaSystem });

    console.log("-----------------------");

    // 3. SALON BLANCA (サロンブランカ)
    const blancaSystem = 
`75min　¥15,000
90min　¥18,000
105min　¥21,000
120min　¥24,000
150min　¥30,000
180min　¥36,000
210min　¥42,000
240min　¥48,000
270min　¥56,000
300min　¥64,000`;

    // 本体のURL(website_url)も同時に更新
    await updateShop(["SALON BLANCA", "ブランカ"], { 
      website_url: "https://salon-blanca.jp/",
      schedule_url: "https://salon-blanca.jp/scheduleAll.html", 
      price_system: blancaSystem 
    });

    console.log("\n🎉 全ての店舗データ更新が完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
