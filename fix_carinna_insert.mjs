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

  try {
    console.log("⏳ Carinnaの店舗IDを取得中...");
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*Carinna*&select=id,name`, { headers });
    const carinnaShops = await shopRes.json();

    if (!carinnaShops || carinnaShops.length === 0) {
      console.log("❌ Carinnaが見つかりませんでした。");
      return;
    }

    console.log("\n🌐 Carinnaの公式サイトからセラピスト情報を再取得中...");
    let allTherapists = [];
    const pages = [
      'https://carinna-azabu.com/cast/',
      'https://carinna-azabu.com/cast/page/2/'
    ];

    for (const pageUrl of pages) {
      const response = await fetch(pageUrl);
      if (!response.ok) continue;
      const html = await response.text();
      const $ = cheerio.load(html);

      $('.therapist-box').each((i, el) => {
        const name = $(el).find('.name a').text().trim() || $(el).find('.name').text().trim();
        
        let image_url = "";
        $(el).find('.photo a').each((idx, aTag) => {
          const href = $(aTag).attr('href') || "";
          if (href.includes('/cast/')) {
            image_url = $(aTag).find('img').attr('src');
          }
        });

        let age = "";
        const dateText = $(el).find('.date').text();
        const ageMatch = dateText.match(/AGE\s*(\d+)/i);
        if (ageMatch) age = ageMatch[1];

        if (name && image_url) {
          // 🚨 修正ポイント: 存在しない tall や cup は除外し、確実なデータだけをセット！
          allTherapists.push({ name, age, image_url });
        }
      });
    }

    console.log(`✅ ${allTherapists.length}名のセラピストを検知しました。`);

    // データの投入処理
    for (const shop of carinnaShops) {
      if (allTherapists.length === 0) continue;
      console.log(`\n⏳ Shop ID: ${shop.id} にデータを投入中...`);
      
      await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });

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

    console.log("\n🎉 Carinnaのセラピスト画像データの投入が完全に完了しました！");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
