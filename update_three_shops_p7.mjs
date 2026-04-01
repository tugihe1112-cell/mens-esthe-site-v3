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

    // 1. AROMA TIAMO
    const tiamoSystem = 
`75分　17,000円（当日のみ）
90分　20,000円
120分　25,000円
150分　30,000円`;
    const tiamoShops = await updateShop(["AROMA TIAMO", "アロマティアモ", "ティアモ"], { schedule_url: "https://www.aroma-tiamo.com/schedule/", price_system: tiamoSystem });

    // 2. QUEEN'S COLLECTION
    const queensSystem = 
`【ノーマル コース】
90 min　¥18,000
120 min　¥23,000
延長 30分　¥7,000`;
    await updateShop(["QUEEN'S COLLECTION", "クイーンズコレクション"], { schedule_url: "https://queens-collection-esthe.com/schedule/", price_system: queensSystem });

    // 3. Rise～リゼ～ (画像から読み取り)
    const riseSystem = 
`【平日12:00〜17:00】
60min　14,000 → 11,000
90min　18,000 → 15,000
120min　22,000 → 19,000
150min　26,000 → 23,000
延長30min　7,000 → 6,000

【平日17:00〜LAST / 土日祝12:00〜LAST】
60min　14,000 → 12,000
90min　18,000 → 16,000
120min　22,000 → 20,000
150min　26,000 → 24,000
延長30min　7,000 → 6,000`;
    const riseShops = await updateShop(["Rise", "リゼ"], { schedule_url: "https://rise-aroma.com/schedule.php", price_system: riseSystem });


    // ==========================================
    // 🌟 AROMA TIAMO のセラピスト画像スクレイピング
    // ==========================================
    if (tiamoShops && tiamoShops.length > 0) {
      console.log("\n🌐 AROMA TIAMO の公式サイトからセラピスト情報を取得中...");
      
      const response = await fetch('https://www.aroma-tiamo.com/cast/');
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        let tiamoTherapists = [];

        $('.list-staff li').each((i, el) => {
          let name = $(el).find('.cinfo > a').text().trim();
          // 名前の中にカッコがある場合（例："水城なぎさ(みずしろ"）を綺麗にする
          name = name.split('(')[0].trim();

          const ageText = $(el).find('.p_profile').text();
          const ageMatch = ageText.match(/(\d+)\s*歳/);
          let ageValue = ageMatch ? parseInt(ageMatch[1], 10) : null;

          // 🚨 背景画像(style="background-image: url(...)")から抽出
          const styleAttr = $(el).find('.photo img').attr('style') || "";
          const bgMatch = styleAttr.match(/url\(['"]?(.*?)['"]?\)/);
          let image_url = bgMatch ? bgMatch[1] : "";

          if (image_url && !image_url.startsWith('http')) {
            image_url = `https://www.aroma-tiamo.com${image_url.startsWith('/') ? '' : '/'}${image_url}`;
          }

          if (name && image_url) {
            tiamoTherapists.push({ name, age: isNaN(ageValue) ? null : ageValue, image_url });
          }
        });

        console.log(`✅ AROMA TIAMO: ${tiamoTherapists.length}名のセラピストを抽出しました！`);

        for (const shop of tiamoShops) {
          if (tiamoTherapists.length === 0) continue;
          await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });
          const insertData = tiamoTherapists.map(t => ({
            name: t.name, age: t.age, image_url: t.image_url, shop_id: shop.id, id: `${shop.id}_${t.name}_${Math.random().toString(36).substr(2, 5)}`
          }));
          const res = await fetch(`${url}/rest/v1/therapists`, { method: 'POST', headers, body: JSON.stringify(insertData) });
          if (res.ok) console.log(`✅ ${shop.name} への投入完了！`);
        }
      }
    }

    // ==========================================
    // 🌟 Rise～リゼ～ のセラピスト画像スクレイピング
    // ==========================================
    if (riseShops && riseShops.length > 0) {
      console.log("\n🌐 Rise～リゼ～ の公式サイトからセラピスト情報を取得中...");
      
      const response = await fetch('https://rise-aroma.com/cast.php');
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        let riseTherapists = [];

        $('.staff').each((i, el) => {
          const name = $(el).find('p').text().trim();
          
          let image_url = $(el).find('img').attr('src') || "";
          // ./thumb/... を /thumb/... に変換
          if (image_url.startsWith('./')) {
            image_url = image_url.substring(1);
          }

          if (image_url && !image_url.startsWith('http')) {
            image_url = `https://rise-aroma.com${image_url}`;
          }

          if (name && image_url) {
            // 年齢情報がないので全て null
            riseTherapists.push({ name, age: null, image_url });
          }
        });

        console.log(`✅ Rise～リゼ～: ${riseTherapists.length}名のセラピストを抽出しました！`);

        for (const shop of riseShops) {
          if (riseTherapists.length === 0) continue;
          await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });
          const insertData = riseTherapists.map(t => ({
            name: t.name, age: t.age, image_url: t.image_url, shop_id: shop.id, id: `${shop.id}_${t.name}_${Math.random().toString(36).substr(2, 5)}`
          }));
          const res = await fetch(`${url}/rest/v1/therapists`, { method: 'POST', headers, body: JSON.stringify(insertData) });
          if (res.ok) console.log(`✅ ${shop.name} への投入完了！`);
        }
      }
    }

    console.log("\n🎉 全ての店舗更新とキャスト復旧が完了しました！");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
