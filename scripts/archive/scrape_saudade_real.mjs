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

  // HTMLの「店舗名」と「Supabaseのshop_id」の紐付け辞書
  const shopIdMap = {
    '笹塚': 'tokyo_shibuya_sasazuka_saudade',
    '麻布十番': 'tokyo_minato_azabujuban_saudade',
    '恵比寿': 'tokyo_shibuya_ebisu_saudade'
  };

  console.log("🌐 サウダージ公式サイトの実際のHTMLを解析中...");
  
  try {
    const response = await fetch('https://saudade-tokyo.com/therapist.html');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 店舗ごとの格納用配列
    const shopData = {
      'tokyo_shibuya_sasazuka_saudade': [],
      'tokyo_minato_azabujuban_saudade': [],
      'tokyo_shibuya_ebisu_saudade': []
    };

    $('.staff-box').each((i, el) => {
      // 1. 名前と年齢の抽出（例: "エラ(20)"）
      const rawNameText = $(el).find('.box-inner li').first().text().trim();
      
      // 「キャンペーン」等のダミー枠はスキップ
      if (rawNameText.includes('キャンペーン') || rawNameText.includes('期間限定')) return;

      const nameMatch = rawNameText.match(/^(.+?)(?:\((\d+)\))?$/);
      const name = nameMatch ? nameMatch[1].trim() : rawNameText;
      const age = nameMatch && nameMatch[2] ? nameMatch[2] : "";

      // 2. 画像URLの抽出 (background-imageから正規表現で抜く)
      const styleAttr = $(el).find('.staff-image01 a').attr('style') || '';
      const imgMatch = styleAttr.match(/url\((['"]?)(.*?)\1\)/);
      const image_url = imgMatch ? imgMatch[2] : "";

      // 3. 所属店舗の抽出 ("笹塚" など)
      const area = $(el).find('.list_roomicon').text().trim();
      const targetShopId = shopIdMap[area];

      if (name && image_url && targetShopId) {
        shopData[targetShopId].push({
          name,
          age,
          image_url,
          shop_id: targetShopId,
          id: `${targetShopId}_${name}_${Math.random().toString(36).substr(2, 5)}`
        });
      }
    });

    // データの投入処理
    for (const [shopId, therapists] of Object.entries(shopData)) {
      if (therapists.length === 0) continue;
      
      console.log(`\n⏳ Shop ID: ${shopId} に ${therapists.length}名のデータを投入中...`);
      
      // 既存データを削除してリセット
      await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}`, {
        method: 'DELETE',
        headers
      });

      // 新規インサート
      const res = await fetch(`${url}/rest/v1/therapists`, {
        method: 'POST',
        headers,
        body: JSON.stringify(therapists)
      });

      if (res.ok) {
        console.log(`✅ ${shopId} への投入完了！`);
      } else {
        console.error(`❌ ${shopId} への投入失敗:`, await res.text());
      }
    }

    console.log("\n🎉 スクレイピングと自動振り分け投入が完璧に完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
