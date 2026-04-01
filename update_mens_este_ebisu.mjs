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
    console.log("⏳ データベースから「メンズエステ恵比寿」の店舗IDを取得中...");
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*メンズエステ恵比寿*&select=id,name`, { headers });
    const targetShops = await shopRes.json();

    if (!targetShops || targetShops.length === 0) {
      console.log("❌ 「メンズエステ恵比寿」の店舗が見つかりませんでした。");
      return;
    }

    // 1. 店舗の基本データ（スケジュールと料金システム）の更新
    console.log(`\n⏳ ${targetShops.length}件の店舗データを更新中...`);
    const priceSystem = 
`90min　¥19,000円
120min　¥24,000円
150min　¥29,000円`;

    const updateData = {
      schedule_url: "https://mens-este.com/schedule/",
      price_system: priceSystem
    };

    for (const shop of targetShops) {
      await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(updateData)
      });
    }
    console.log("✅ スケジュールと料金システムの更新が完了しました！");

    // 2. セラピストのスクレイピング（写真問題の解決）
    console.log("\n🌐 公式サイトからセラピスト情報を取得中...");
    
    let html = "";
    // セラピスト一覧がありそうなURLを探索
    const urlsToTry = ['https://mens-este.com/therapist/', 'https://mens-este.com/', 'https://mens-este.com/cast/'];
    for(const u of urlsToTry) {
        const r = await fetch(u);
        if(r.ok) {
            const tempHtml = await r.text();
            // therapist_cols_2 という特徴的なクラスがあれば正解とみなす
            if(tempHtml.includes('therapist_cols_2')) {
                html = tempHtml;
                console.log(`📄 取得元: ${u}`);
                break;
            }
        }
    }

    const $ = cheerio.load(html);
    const allTherapists = [];

    $('.therapist').each((i, el) => {
      const name = $(el).find('.therapist_name').text().trim();
      if (!name) return;

      // 年齢の抽出（例："20歳 T171cm Fcup" -> "20"）
      const ageText = $(el).find('.therapist_age').text();
      const ageMatch = ageText.match(/(\d+)歳/);
      const age = ageMatch ? ageMatch[1] : "";

      // 🚨 画像URLの抽出（初出勤アイコン等を無視し、一番最初の本人の画像だけを取得）
      let image_url = $(el).find('.therapist_image img').first().attr('src') || "";
      
      // 相対パスを絶対パスに変換
      if (image_url && !image_url.startsWith('http')) {
        image_url = `https://mens-este.com${image_url.startsWith('/') ? '' : '/'}${image_url}`;
      }

      if (name && image_url) {
        allTherapists.push({ name, age, image_url });
      }
    });

    console.log(`✅ ${allTherapists.length}名のセラピストを抽出しました！`);

    // データの投入処理
    for (const shop of targetShops) {
      if (allTherapists.length === 0) continue;
      console.log(`\n⏳ Shop ID: ${shop.id} にデータを投入中...`);
      
      // 既存データを消去
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
        console.log(`✅ 投入完了！`);
      } else {
        console.error(`❌ 投入失敗:`, await res.text());
      }
    }

    console.log("\n🎉 メンズエステ恵比寿の店舗更新とキャスト画像復旧がすべて完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
