import fs from 'fs';

async function run() {
  console.log('🔍 1. 【フロントエンド】 ShopDetailPage.jsx の画像表示ロジックを確認中...\n');
  const filePath = 'src/pages/ShopDetailPage.jsx';
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    let found = false;
    lines.forEach((line, i) => {
      // 画像（imgタグやsrc、imageという単語）と、shopのデータが絡んでいる行を探す
      if ((line.includes('<img') || line.includes('src=') || line.includes('background')) && 
          (line.includes('shop') || line.includes('cloudShop') || line.includes('image'))) {
        console.log(`[行 ${i + 1}] ${line.trim()}`);
        found = true;
      }
    });
    if (!found) console.log('⚠️ 画像を表示しているimgタグが見つかりませんでした。');
  }

  console.log('\n--------------------------------------------------\n');

  console.log('🔍 2. 【データベース】 luxtime(お手本) と HANASPA の画像カラムを比較中...\n');
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

  try {
    // luxtime（秋葉原店）のデータを取得
    const luxRes = await fetch(`${url}/rest/v1/shops?id=eq.tokyo_chiyoda_akihabara_luxtime&select=*`, { headers });
    const luxData = await luxRes.json();
    const lux = luxData[0];

    // HANASPAのデータを取得
    const hanaRes = await fetch(`${url}/rest/v1/shops?brand_id=eq.hanaspa&select=*`, { headers });
    const hanaData = await hanaRes.json();
    const hana = hanaData[0];

    if (!lux || !hana) {
      console.log('⚠️ データの取得に失敗しました。');
      return;
    }

    // 画像やロゴに関係しそうなカラムをすべて抽出して比較
    const imgKeys = Object.keys(lux).filter(k => 
      k.includes('image') || k.includes('logo') || k.includes('pic') || k.includes('photo') || k.includes('url')
    );

    console.log('👑 【luxtime (お手本)】');
    imgKeys.forEach(k => console.log(` - ${k}: ${lux[k]}`));

    console.log('\n🌸 【HANASPA】');
    imgKeys.forEach(k => console.log(` - ${k}: ${hana[k]}`));

  } catch (err) {
    console.error('エラー:', err);
  }
}

run();
