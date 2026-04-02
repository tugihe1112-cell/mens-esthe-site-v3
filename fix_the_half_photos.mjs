import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  // ザ・ハーフの店舗ID
  const shopId = 'tokyo_shibuya_the_half';

  try {
    console.log("⏳ ザ・ハーフ (THE HALF) の公式サイトからキャスト写真を自動抽出しています...\n");

    // サイトからHTMLを直接取得
    const htmlRes = await fetch('https://the-half.com/cast/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await htmlRes.text();

    // <img src="URL" alt="NAME "> の形式からデータを抜き出す
    const regex = /<img src="(https:\/\/the-half\.com\/wp-content\/uploads\/[^"]+)" alt="([^"]+)"/g;
    let match;
    const scrapedCasts = [];
    
    while ((match = regex.exec(html)) !== null) {
      const imgUrl = match[1];
      let rawName = match[2];
      
      // 絵文字や「新人」「割引適用外」「〇/〇初出勤」などの不要な文字を綺麗に掃除する
      let cleanName = rawName
        .replace(/割引適用外/g, '')
        .replace(/新人/g, '')
        .replace(/\d+\/\d+.*?初出勤/g, '')
        .replace(/[^\p{L}\p{N}ー・]/gu, ''); // 文字・数字・長音符・中点以外（絵文字や空白）を削除
        
      if (cleanName) {
        scrapedCasts.push({ name: cleanName, image_url: imgUrl });
      }
    }

    console.log(`✅ サイトから ${scrapedCasts.length} 名分の写真URLを抽出しました！DBと照合します...`);

    // データベース上の既存キャストを取得
    const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}&select=id,name,image_url`, { headers });
    const dbCasts = await dbRes.json();

    let updateCount = 0;
    let insertCount = 0;

    for (const scraped of scrapedCasts) {
      // データベース内の名前と照合（空白を無視して比較）
      const existing = dbCasts.find(c => c.name.replace(/[\s　]+/g, '') === scraped.name);

      if (existing) {
        // すでに存在していれば写真URLを更新
        if (existing.image_url !== scraped.image_url) {
          await fetch(`${url}/rest/v1/therapists?id=eq.${existing.id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ image_url: scraped.image_url })
          });
          updateCount++;
        }
      } else {
        // 存在していなければ新規キャストとして追加
        const newId = `${shopId}_${scraped.name}`;
        await fetch(`${url}/rest/v1/therapists`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            id: newId,
            shop_id: shopId,
            name: scraped.name,
            image_url: scraped.image_url
          })
        });
        insertCount++;
      }
    }

    console.log(`\n🎉 写真の設定が完全に完了しました！`);
    console.log(`🔄 写真を追加・更新した人数: ${updateCount}名`);
    console.log(`✨ 新規で登録したキャスト: ${insertCount}名`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
