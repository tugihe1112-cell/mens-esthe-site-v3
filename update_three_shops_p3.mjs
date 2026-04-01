import fs from 'fs';
import * as cheerio from 'cheerio';

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
      if (updateRes.ok) successCount++;
    }
    console.log(`✅ ${successCount}件の「${data[0].name}」の店舗データを更新しました！`);
    return data;
  };

  try {
    console.log("⏳ 3店舗のスケジュール・料金システムを更新中...\n");

    // 1. ダリアの更新
    const dahliaSystem = 
`70分　15,000円
100分　20,000円
120分　23,000円
150分　28,000円`;
    const dahliaShops = await updateShop(["ダリア", "DAHLIA"], { schedule_url: "https://gotandadahlia.com/schedule/", price_system: dahliaSystem });

    // 2. プラチナム東京の更新
    const platinumSystem = 
`75分　17,000円 → 15,000円
90分　20,000円 → 18,000円
120分　25,000円 → 23,000円
150分　30,000円 → 28,000円`;
    await updateShop(["プラチナム", "PLATINUM"], { schedule_url: "https://esthe-platinum.tokyo/schedule/", price_system: platinumSystem });

    // 3. Aroma Lunabelle の更新（画像から読み取り）
    const lunabelleSystem = 
`【デトックストリートメント】
90分　16,000円
120分　21,000円
150分　26,000円
180分　31,000円

【仰向けリンパ集中コース】
70分　14,000円`;
    await updateShop(["ルナベル", "Lunabelle"], { schedule_url: "https://aroma-lunabelle.com/", price_system: lunabelleSystem });

    // 🌟 ダリアのセラピスト画像スクレイピング（動画対応・アイコン無視版）
    if (dahliaShops && dahliaShops.length > 0) {
      console.log("\n🌐 ダリア公式サイトからセラピスト情報を取得中...");
      
      const response = await fetch('https://gotandadahlia.com/cast/');
      if (!response.ok) {
        console.log("⚠️ ダリアのキャスト一覧ページにアクセスできませんでした。");
        return;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      let allTherapists = [];

      $('.list__item').each((i, el) => {
        // 名前と年齢の抽出
        const rawName = $(el).find('article h3').text().trim();
        if (!rawName) return;
        const nameMatch = rawName.match(/^(.+?)\((\d+)\)$/);
        const name = nameMatch ? nameMatch[1].trim() : rawName;
        const age = nameMatch ? nameMatch[2].trim() : "";

        // 🚨 画像(または動画)の抽出。手前の装飾アイコンを無視して .ph の中だけを見る！
        let media_url = $(el).find('.ph img').attr('src');
        if (!media_url) {
          // 画像がなければ動画(video)タグを探す
          media_url = $(el).find('.ph video').attr('src');
        }

        if (media_url && !media_url.startsWith('http')) {
          media_url = `https://gotandadahlia.com${media_url.startsWith('/') ? '' : '/'}${media_url}`;
        }

        if (name && media_url) {
          allTherapists.push({ name, age, image_url: media_url });
        }
      });

      console.log(`✅ ${allTherapists.length}名のセラピスト（動画含む）を抽出しました！`);

      // データの投入
      for (const shop of dahliaShops) {
        if (allTherapists.length === 0) continue;
        console.log(`\n⏳ Shop ID: ${shop.id} にデータを投入中...`);
        
        await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });

        const insertData = allTherapists.map(t => ({
          name: t.name,
          age: t.age,
          image_url: t.image_url,
          shop_id: shop.id,
          id: `${shop.id}_${t.name}_${Math.random().toString(36).substr(2, 5)}`
        }));

        const res = await fetch(`${url}/rest/v1/therapists`, { method: 'POST', headers, body: JSON.stringify(insertData) });

        if (res.ok) {
          console.log(`✅ ${shop.id} への投入完了！`);
        } else {
          console.error(`❌ ${shop.id} への投入失敗:`, await res.text());
        }
      }
    }

    console.log("\n🎉 全ての店舗更新とダリアのキャスト復旧が完了しました！");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
