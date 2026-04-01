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
    console.log("⏳ データベースからベルリリーの各店舗IDを取得中...");
    const shopRes = await fetch(`${url}/rest/v1/shops?name=ilike.*ベルリリー*&select=id,name`, { headers });
    const belleShops = await shopRes.json();

    if (!belleShops || belleShops.length === 0) {
      console.log("❌ ベルリリーの店舗が見つかりませんでした。");
      return;
    }

    console.log("\n🌐 ベルリリー公式サイトの全ページからセラピスト情報を一括取得中...");
    
    let allTherapists = [];
    let pageNum = 1;
    let hasNextPage = true;

    // 女の子が見つからなくなるまで、無限にページをめくり続ける
    while (hasNextPage) {
      const pageUrl = pageNum === 1 
        ? 'https://shibuya-belle-lily.com/cast.php' 
        : `https://shibuya-belle-lily.com/cast.php?page=${pageNum}`;
        
      console.log(`📄 取得中: ${pageUrl}`);
      
      const response = await fetch(pageUrl);
      if (!response.ok) {
        console.log(`⚠️ ${pageNum}ページ目へのアクセスに失敗しました。取得を終了します。`);
        break;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      const castBoxes = $('.cast_box li');

      // このページに女の子が1人もいなかったら、全ページ探索完了とみなす
      if (castBoxes.length === 0) {
        console.log(`🏁 ${pageNum}ページ目にデータがありません。全ページの取得が完了しました。`);
        hasNextPage = false;
        break;
      }

      castBoxes.each((i, el) => {
        // 1. 名前と年齢の抽出
        const rawName = $(el).find('.name').text().trim();
        if (!rawName) return;
        const nameMatch = rawName.match(/^(.+?)（(\d+)）$/);
        const name = nameMatch ? nameMatch[1].trim() : rawName;
        const age = nameMatch ? nameMatch[2].trim() : "";

        // 2. 画像URLの抽出と絶対パス化
        let image_url = $(el).find('.img_wrap1 img').attr('src') || "";
        if (image_url && !image_url.startsWith('http')) {
          image_url = `https://shibuya-belle-lily.com${image_url.startsWith('/') ? '' : '/'}${image_url}`;
        }

        if (name && image_url) {
          allTherapists.push({ name, age, image_url });
        }
      });
      
      pageNum++;
    }

    console.log(`\n✅ 合計 ${allTherapists.length}名のセラピストを抽出しました！全店舗へ一斉投入します...`);

    // 各店舗へのデータ一括投入
    for (const shop of belleShops) {
      if (allTherapists.length === 0) continue;
      
      console.log(`\n⏳ Shop ID: ${shop.id} に ${allTherapists.length}名のデータを投入中...`);
      
      // 既存データを一度消去（重複防止）
      await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shop.id}`, { method: 'DELETE', headers });

      // 全員を投入用に整形
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

    console.log("\n🎉 ベルリリー全店舗への【全ページ完全網羅】一括登録が完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
