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

    // 1. SPA Real (スパレアル)
    const spaRealSystem = 
`【STANDARD】
60分　12,000円
90分　15,000円
※ディープリンパは含まれません
※延長は出来ません

【LUXURY ★おすすめ★】
60分　16,000円
90分　18,000円
120分　24,000円`;
    await updateShop(["SPA Real", "スパレアル"], { schedule_url: "https://spa-real.com/scheduleAll.html", price_system: spaRealSystem });

    // 2. AromaLys (アロマリース)
    const aromalysSystem = 
`【Price】
75分　15,000円（通常19,000円 ⇒ 4,000円OFF）
90分　18,000円（通常22,000円 ⇒ 4,000円OFF）
120分　22,000円（通常26,000円 ⇒ 4,000円OFF）
150分　26,000円（通常30,000円 ⇒ 4,000円OFF）
180分　30,000円（通常34,000円 ⇒ 4,000円OFF）
60分　13,000円`;
    await updateShop(["AromaLys", "アロマリース"], { schedule_url: "https://mens-esute.jp/schedule/", price_system: aromalysSystem });

    // 3. AROMA EMERALD (アロマエメラルド)
    const emeraldSystem = 
`70分　18,000 ⇒ 16,000円
90分　20,000 ⇒ 18,000円
120分　25,000 ⇒ 23,000円`;
    const emeraldShops = await updateShop(["AROMA EMERALD", "アロマエメラルド", "EMERALD"], { schedule_url: "https://a-emerald.com/schedule/", price_system: emeraldSystem });

    // 🌟 AROMA EMERALDのセラピスト画像スクレイピング
    if (emeraldShops && emeraldShops.length > 0) {
      console.log("\n🌐 AROMA EMERALDの公式サイトからセラピスト情報を取得中...");
      
      const response = await fetch('https://a-emerald.com/cast/');
      if (!response.ok) {
        console.log("⚠️ AROMA EMERALDのキャスト一覧ページにアクセスできませんでした。");
        return;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      let allTherapists = [];

      $('.cast-flame li').each((i, el) => {
        // 名前
        const name = $(el).find('dl.name dt').text().trim();
        if (!name) return;

        // 年齢
        const ageText = $(el).find('dl.name dd').first().text();
        const ageMatch = ageText.match(/Age\s*(\d+)/i);
        const age = ageMatch ? ageMatch[1] : "";

        // 画像URL
        let image_url = $(el).find('.cast-img img').attr('src');
        
        if (image_url && !image_url.startsWith('http')) {
          image_url = `https://a-emerald.com${image_url.startsWith('/') ? '' : '/'}${image_url}`;
        }

        if (name && image_url) {
          allTherapists.push({ name, age, image_url });
        }
      });

      console.log(`✅ ${allTherapists.length}名のセラピストを抽出しました！`);

      // データの投入
      for (const shop of emeraldShops) {
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

    console.log("\n🎉 全ての店舗更新とAROMA EMERALDのキャスト復旧が完了しました！");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
