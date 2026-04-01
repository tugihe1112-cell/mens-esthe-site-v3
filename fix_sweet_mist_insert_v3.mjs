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
    console.log("⏳ データベースから「Sweet Mist」の店舗IDを取得中...");
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*Sweet Mist*&select=id,name`, { headers });
    const sweetMistShops = await res.json();

    if (!sweetMistShops || sweetMistShops.length === 0) {
      console.log("❌ 店舗が見つかりませんでした。");
      return;
    }

    console.log("\n🌐 Sweet Mist の公式サイトからセラピスト情報を再取得中...");
    const response = await fetch('https://sweet-mist.tokyo/staff.php');
    if (!response.ok) return;

    const html = await response.text();
    const $ = cheerio.load(html);
    let allTherapists = [];

    $('#sort_01_content .cast_box li').each((i, el) => {
      const rawNameText = $(el).find('.txt_box > p:first-child').text().trim();
      const nameMatch = rawNameText.match(/^(.+?)\s*\((.*?)\)$/);
      const name = nameMatch ? nameMatch[1].trim() : rawNameText;
      let ageStr = nameMatch ? nameMatch[2].trim() : "";
      
      // 数字として解析できなければ null にする
      let ageValue = parseInt(ageStr, 10);
      ageValue = isNaN(ageValue) ? null : ageValue;

      let image_url = $(el).find('.img_box a img.staff').attr('src') || "";
      if (image_url.includes('no_image')) return; 

      if (image_url && !image_url.startsWith('http')) {
        image_url = `https://sweet-mist.tokyo${image_url.startsWith('/') ? '' : '/'}${image_url}`;
      }

      if (name && image_url) {
        // 🚨 修正ポイント: 全員に age キーを持たせ、無い場合は明示的に null をセットする
        allTherapists.push({ name, age: ageValue, image_url });
      }
    });

    console.log(`✅ ${allTherapists.length}名のセラピストを抽出しました！`);

    for (const shop of sweetMistShops) {
      console.log(`\n⏳ Shop ID: ${shop.id} にデータを投入中...`);
      await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });

      const insertData = allTherapists.map(t => ({
        name: t.name,
        // 全員同じ構造（キー）を持たせる
        age: t.age, 
        image_url: t.image_url,
        shop_id: shop.id,
        id: `${shop.id}_${t.name}_${Math.random().toString(36).substr(2, 5)}`
      }));

      const insertRes = await fetch(`${url}/rest/v1/therapists`, { method: 'POST', headers, body: JSON.stringify(insertData) });

      if (insertRes.ok) {
        console.log(`✅ ${shop.name} への投入完了！`);
      } else {
        console.error(`❌ ${shop.name} への投入失敗:`, await insertRes.text());
      }
    }

    console.log("\n🎉 Sweet Mistのキャスト画像データ復旧が完全に完了しました！");
  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
