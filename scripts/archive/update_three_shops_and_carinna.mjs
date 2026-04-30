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

  // --- 店舗データ更新関数 ---
  const updateShop = async (searchName, updateData) => {
    console.log(`\n⏳ 「${searchName}」を検索中...`);
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*${encodeURIComponent(searchName)}*&select=id,name`, { headers });
    const data = await res.json();
    
    if (!data || data.length === 0) {
      console.log(`❌ 「${searchName}」が見つかりませんでした。`);
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
    return data; // 対象の店舗配列を返す
  };

  try {
    // 1. リオラ
    const lioraSystem = 
`70分コース　16,000円 → 超特割で15,000円
90分コース　20,000円 → 超特割で19,000円
100分コース　21,000円 → 超特割で20,000円
120分コース　26,000円 → 超特割で25,000円`;
    await updateShop("リオラ", { schedule_url: "https://liora2024.com/schedule", price_system: lioraSystem });

    // 2. ベルリリー
    const belleSystem = 
`90分　22,000円 → オープニング20,000円
120分　28,000円 → オープニング26,000円
150分　34,000円 → オープニング32,000円`;
    await updateShop("ベルリリー", { schedule_url: "https://shibuya-belle-lily.com/schedule.php", price_system: belleSystem });

    // 3. Carinna (カリナ)
    const carinnaSystem = 
`90min　通常 22,000円 → 20,000円
120min　通常 27,000円 → 25,000円
150min　通常 32,000円 → 30,000円`;
    const carinnaShops = await updateShop("Carinna", { schedule_url: "https://carinna-azabu.com/schedule/", price_system: carinnaSystem });

    // 🌟 Carinnaのセラピスト画像の取得と更新
    if (carinnaShops && carinnaShops.length > 0) {
      console.log("\n🌐 Carinnaの公式サイトからセラピスト情報を取得中...");
      
      let allTherapists = [];
      const pages = [
        'https://carinna-azabu.com/cast/',
        'https://carinna-azabu.com/cast/page/2/' // 2ページ目も網羅
      ];

      for (const pageUrl of pages) {
        console.log(`📄 取得中: ${pageUrl}`);
        const response = await fetch(pageUrl);
        if (!response.ok) continue;
        const html = await response.text();
        const $ = cheerio.load(html);

        $('.therapist-box').each((i, el) => {
          const name = $(el).find('.name a').text().trim() || $(el).find('.name').text().trim();
          
          // SNSアイコン(Twitter等)を除外し、正しいプロフィール画像のURLを抽出
          let image_url = "";
          $(el).find('.photo a').each((idx, aTag) => {
            const href = $(aTag).attr('href') || "";
            if (href.includes('/cast/')) {
              image_url = $(aTag).find('img').attr('src');
            }
          });

          // 年齢、身長、カップ数の抽出
          let age = "", tall = "", cup = "";
          const dateText = $(el).find('.date').text();
          
          const ageMatch = dateText.match(/AGE\s*(\d+)/i);
          if (ageMatch) age = ageMatch[1];
          
          const tMatch = dateText.match(/T\s*(\d+)/i);
          if (tMatch) tall = tMatch[1];
          
          const cupMatch = dateText.match(/\(([A-Z])\)/i);
          if (cupMatch) cup = cupMatch[1];

          if (name && image_url) {
            allTherapists.push({ name, age, tall, cup, image_url });
          }
        });
      }

      console.log(`✅ ${allTherapists.length}名のセラピストを検知しました。`);

      // データの投入処理 (Carinnaの全クローンに対して)
      for (const shop of carinnaShops) {
        if (allTherapists.length === 0) continue;
        console.log(`\n⏳ Shop ID: ${shop.id} にデータを投入中...`);
        
        // 古いデータを削除
        await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });

        // 新しいデータを投入
        const insertData = allTherapists.map(t => ({
          ...t,
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

    console.log("\n🎉 すべての店舗更新とスクレイピングが完了しました！");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
