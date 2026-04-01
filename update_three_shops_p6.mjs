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
        break;
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

    // 1. Sweet Mist (スウィートミスト)
    const sweetMistSystem = 
`【STANDARD course】
90min　¥18,000 → ¥16,000
120min　¥24,000 → ¥22,000
150min　--------- ¥28,000
180min　--------- ¥33,000`;
    const sweetMistShops = await updateShop(["Sweet Mist", "スウィートミスト"], { 
      website_url: "https://sweet-mist.tokyo/",
      schedule_url: "https://sweet-mist.tokyo/staff.php", 
      price_system: sweetMistSystem 
    });

    console.log("-----------------------");

    // 2. HaTaEsu (ハタエス)
    const hataesuSystem = 
`🆕Short 60分 (平日17:30スタートまで)　12,000円
Short 75分　16,000円
Standard 90分　18,000円
Premium 120分　24,000円
Long 150分　30,000円`;
    await updateShop(["HaTaEsu", "ハタエス"], { schedule_url: "https://hataesu.com/week.cgi", price_system: hataesuSystem });

    console.log("-----------------------");

    // 3. A5 SPA (エーゴスパ)
    const a5spaSystem = 
`90分コース　19,000円
120分コース　23,000円
150分コース　29,000円`;
    await updateShop(["A5 SPA", "エーゴスパ"], { schedule_url: "https://www.a5spa.com/schedule/", price_system: a5spaSystem });

    // 🌟 Sweet Mist のセラピスト画像スクレイピング
    if (sweetMistShops && sweetMistShops.length > 0) {
      console.log("\n🌐 Sweet Mist の公式サイトからセラピスト情報を取得中...");
      
      const response = await fetch('https://sweet-mist.tokyo/staff.php');
      if (!response.ok) {
        console.log("⚠️ Sweet Mistのキャスト一覧ページにアクセスできませんでした。");
        return;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      let allTherapists = [];

      // ALLタブの中にあるキャスト情報を取得
      $('#sort_01_content .cast_box li').each((i, el) => {
        // 名前と年齢の抽出
        const rawNameText = $(el).find('.txt_box > p:first-child').text().trim();
        // 「名前 (年齢)」の形式を切り分ける
        const nameMatch = rawNameText.match(/^(.+?)\s*\((.*?)\)$/);
        const name = nameMatch ? nameMatch[1].trim() : rawNameText;
        let age = nameMatch ? nameMatch[2].trim() : "";
        if (age === ")") age = ""; // 空の括弧だった場合の処理

        // 🚨 画像URLの抽出。装飾アイコン（icon_new等）を除外し、リンク(aタグ)直下のimgだけを狙う
        let image_url = $(el).find('.img_box a img.staff').attr('src') || "";
        
        // NO IMAGE の場合は除外
        if (image_url.includes('no_image.jpg')) {
           return;
        }

        if (image_url && !image_url.startsWith('http')) {
          image_url = `https://sweet-mist.tokyo${image_url.startsWith('/') ? '' : '/'}${image_url}`;
        }

        if (name && image_url) {
          allTherapists.push({ name, age, image_url });
        }
      });

      console.log(`✅ ${allTherapists.length}名のセラピストを抽出しました！`);

      // データの投入
      for (const shop of sweetMistShops) {
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
          console.log(`✅ ${shop.name} への投入完了！`);
        } else {
          console.error(`❌ ${shop.name} への投入失敗:`, await res.text());
        }
      }
    }

    console.log("\n🎉 全ての店舗更新とSweet Mistのキャスト復旧が完了しました！");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
