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
      
      // 🚨 年齢を確実に数字に変換。数字じゃなければ NaN になる
      let age = parseInt(ageStr, 10);

      let image_url = $(el).find('.img_box a img.staff').attr('src') || "";
      if (image_url.includes('no_image')) return; // ノーイメージは除外

      if (image_url && !image_url.startsWith('http')) {
        image_url = `https://sweet-mist.tokyo${image_url.startsWith('/') ? '' : '/'}${image_url}`;
      }

      if (name && image_url) {
        // 数字として正しくない(NaN)場合は null をセット
        allTherapists.push({ name, age: isNaN(age) ? null : age, image_url });
      }
    });

    console.log(`✅ ${allTherapists.length}名のセラピストを抽出しました！`);

    for (const shop of sweetMistShops) {
      console.log(`\n⏳ Shop ID: ${shop.id} にデータを投入中...`);
      await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });

      const insertData = allTherapists.map(t => {
        // 基本データ
        const data = {
          name: t.name,
          image_url: t.image_url,
          shop_id: shop.id,
          id: `${shop.id}_${t.name}_${Math.random().toString(36).substr(2, 5)}`
        };
        // 年齢が存在する場合のみ追加（nullを送らない）
        if (t.age !== null) {
          data.age = t.age;
        }
        return data;
      });

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
