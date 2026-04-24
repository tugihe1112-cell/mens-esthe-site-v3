import fs from 'fs';

async function run() {
  console.log('🔍 出勤情報（URL）の登録状況を確認します...');
  const targetId = 'tokyo_setagaya_futakotamagawa_mens_esthe_group';

  // 1. ローカルJSONの確認
  ['public/data/shops.json', 'src/data/shops.json'].forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const shops = Array.isArray(data) ? data : data.shops || [];
      const shop = shops.find(s => s.id === targetId);
      console.log(`\n📂 [${file}]`);
      if (shop) {
        console.log(`  公式サイト: ${shop.website_url || shop.websiteUrl || '未設定 (空)'}`);
        console.log(`  出勤情報  : ${shop.schedule_url || shop.scheduleUrl || '未設定 (空)'}`);
      } else {
        console.log('  店舗が見つかりません。');
      }
    } catch(e) { console.log(`\n📂 [${file}] 読み込みエラー`); }
  });

  // 2. Supabase(データベース)の確認
  try {
    const env = fs.readFileSync('.env','utf8');
    const urlMatch = env.match(/VITE_SUPABASE_URL=['"]?(.*?)['"]?$/m);
    const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=['"]?(.*?)['"]?$/m);
    
    if(urlMatch && keyMatch) {
      const url = urlMatch[1].trim();
      const key = keyMatch[1].trim();
      const res = await fetch(url + '/rest/v1/shops?id=eq.' + targetId + '&select=name,website_url,schedule_url', {
        headers: { apikey: key, Authorization: 'Bearer ' + key }
      });
      const dbData = await res.json();
      console.log('\n☁️  [Supabase DB]');
      if (dbData && dbData.length > 0) {
        console.log(`  公式サイト: ${dbData[0].website_url || '未設定 (空)'}`);
        console.log(`  出勤情報  : ${dbData[0].schedule_url || '未設定 (空)'}`);
      } else {
        console.log('  DB上に店舗が見つかりません。');
      }
    }
  } catch(e) { console.log('\n☁️  [Supabase DB] 確認エラー', e.message); }
}

run();
