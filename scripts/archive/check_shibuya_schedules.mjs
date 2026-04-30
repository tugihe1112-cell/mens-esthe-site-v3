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

  try {
    console.log("🔍 渋谷エリアで「スケジュールリンク」が未設定の店舗を調査中...\n");
    
    // 全店舗のデータを取得
    const res = await fetch(`${url}/rest/v1/shops?select=id,name,schedule_url`, { headers });
    const shops = await res.json();

    if (!shops || shops.length === 0) {
      console.log("❌ 店舗データが取得できませんでした。");
      return;
    }

    // 「渋谷」に関連する店舗を抽出し、かつスケジュールURLが空のものを探す
    const missingSchedules = shops.filter(shop => {
      const isShibuya = shop.id.includes('shibuya') || shop.name.includes('渋谷');
      const hasNoSchedule = !shop.schedule_url || shop.schedule_url.trim() === '';
      return isShibuya && hasNoSchedule;
    });

    if (missingSchedules.length === 0) {
      console.log("✨ 素晴らしい！渋谷エリアの全店舗にスケジュールリンクが設定されています！");
    } else {
      console.log(`⚠️ 以下の ${missingSchedules.length}店舗 にスケジュールリンクが設定されていません：\n`);
      missingSchedules.forEach((shop, index) => {
        console.log(`${index + 1}. ${shop.name}`);
        console.log(`   ID: ${shop.id}`);
        console.log("--------------------------------------------------");
      });
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
