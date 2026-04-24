import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  const scheduleUrl = 'https://www.futakotamagawa-mens-esthe.com/schedule/';
  const websiteUrl = 'https://www.futakotamagawa-mens-esthe.com/';

  console.log('🔍 1. データベース(Supabase)の現状を確認します...');
  // 「mens_esthe_group」または「menes_group」を含む店舗をすべて取得
  const res = await fetch(`${url}/rest/v1/shops?or=(id.ilike.*mens_esthe_group*,id.ilike.*menes_group*)`, { headers });
  const shops = await res.json();

  console.log(`   → ${shops.length}件の関連店舗が見つかりました。`);
  shops.forEach(s => {
    console.log(`   [ID: ${s.id}] URL: ${s.schedule_url || '❌未設定'}`);
  });

  console.log('\n🚀 2. ブランド全店舗にスケジュールリンクを一括注入します...');
  const updateRes = await fetch(`${url}/rest/v1/shops?or=(id.ilike.*mens_esthe_group*,id.ilike.*menes_group*)`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify({
      schedule_url: scheduleUrl,
      website_url: websiteUrl,
      brand_id: 'mens_esthe_group' // ブランドIDも統一
    })
  });

  if (updateRes.ok) {
    console.log('   ✅ DB更新完了！全店舗にリンクを書き込みました。');
  }

  console.log('\n📝 3. React側の表示ロジック（ShopDetailPage.jsx）を最終確認します...');
  const reactCode = fs.readFileSync('src/pages/ShopDetailPage.jsx', 'utf8');
  
  // ボタンを表示する「条件式」が正しいかチェック
  if (reactCode.includes('shop.websiteUrl') || reactCode.includes('cloudShop?.schedule_url')) {
    console.log('   ✅ React側の表示条件は整っています。');
  } else {
    console.log('   ⚠️ 表示条件に不備がある可能性があります。');
  }
}

run().catch(console.error);
