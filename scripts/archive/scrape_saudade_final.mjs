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

  console.log("🌐 サウダージの全セラピストを救出中...");
  
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

    // 除外するダミーワード一覧
    const ignoreWords = ['キャンペーン', 'イベ', '早割', '深夜割', 'マナー', '公式', '口コミ', '割'];

    $('.staff-box').each((i, el) => {
      const rawNameText = $(el).find('.box-inner li').first().text().trim();
      
      // 1. ダミー枠・空枠の除外
      if (!rawNameText) return;
      const isDummy = ignoreWords.some(word => rawNameText.includes(word));
      if (isDummy) return;

      // 2. 名前と年齢の抽出
      const nameMatch = rawNameText.match(/^(.+?)(?:\((\d+)\))?$/);
      const name = nameMatch ? nameMatch[1].trim() : rawNameText;
      const age = nameMatch && nameMatch[2] ? nameMatch[2] : "";

      // 3. 画像URLの抽出
      const styleAttr = $(el).find('.staff-image01 a').attr('style') || '';
      const imgMatch = styleAttr.match(/url\((['"]?)(.*?)\1\)/);
      const image_url = imgMatch ? imgMatch[2] : "";

      if (!name || !image_url) return;

      // 4. 所属店舗の判定
      const area = $(el).find('.list_roomicon').text().trim();
      let targetShops = [];
      
      if (area === '笹塚') {
        targetShops = ['tokyo_shibuya_sasazuka_saudade'];
      } else if (area === '麻布十番') {
        targetShops = ['tokyo_minato_azabujuban_saudade'];
      } else if (area === '恵比寿') {
        targetShops = ['tokyo_shibuya_ebisu_saudade'];
      } else {
        // 店舗タグが無い女の子は、全員漏らさず全店舗に配置！
        targetShops = [
          'tokyo_shibuya_sasazuka_saudade',
          'tokyo_minato_azabujuban_saudade',
          'tokyo_shibuya_ebisu_saudade'
        ];
      }

      // 5. データを各店舗の配列に振り分け
      targetShops.forEach(shopId => {
        shopData[shopId].push({
          name,
          age,
          image_url,
          shop_id: shopId,
          id: `${shopId}_${name}_${Math.random().toString(36).substr(2, 5)}`
        });
      });
    });

    // データの投入処理
    for (const [shopId, therapists] of Object.entries(shopData)) {
      if (therapists.length === 0) continue;
      
      console.log(`\n⏳ Shop ID: ${shopId} に ${therapists.length}名のデータを投入中...`);
      
      await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}`, {
        method: 'DELETE',
        headers
      });

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

    console.log("\n🎉 全セラピストの救出と登録が完了しました！");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
