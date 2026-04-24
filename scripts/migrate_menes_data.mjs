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
  const preferHeaders = { ...headers, 'Prefer': 'resolution=merge-duplicates' };

  const GHOST_ID = 'tokyo_setagaya_futakotamagawa_mens_esthe_group';
  const REAL_ID = 'tokyo_setagaya_futakotamagawa_menes_group'; // Reactが求めている本物のID

  console.log(`🚚 1. 幽霊IDから74名の完璧なデータを救出します...`);
  const res = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${GHOST_ID}`, { headers });
  const ghostGirls = await res.json();

  if (!ghostGirls || ghostGirls.length === 0) {
    console.error('❌ 幽霊データが見つかりません。すでに削除された可能性があります。');
    return;
  }
  console.log(`   → ${ghostGirls.length}名のデータを確保しました！`);

  console.log(`✨ 2. 確保したデータを正規ID（${REAL_ID}）にお引越しさせます...`);
  const newTherapistIds = [];
  let successCount = 0;

  for (const girl of ghostGirls) {
    // IDと所属店舗を正規のものに書き換える
    const newId = girl.id.replace(GHOST_ID, REAL_ID);
    newTherapistIds.push(newId);

    const payload = {
      ...girl,
      id: newId,
      shop_id: REAL_ID
    };

    const postRes = await fetch(`${url}/rest/v1/therapists`, {
      method: 'POST',
      headers: preferHeaders,
      body: JSON.stringify(payload)
    });
    if (postRes.ok) successCount++;
  }
  console.log(`   → ${successCount}名のお引越し完了！`);

  console.log(`🔗 3. 正規の店舗データに出勤情報URLと74名の名簿をセットします...`);
  await fetch(`${url}/rest/v1/shops?id=eq.${REAL_ID}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify({ 
      therapists: newTherapistIds,
      schedule_url: 'https://www.futakotamagawa-mens-esthe.com/schedule/',
      website_url: 'https://www.futakotamagawa-mens-esthe.com/'
    })
  });

  console.log(`🧹 4. 用済みになった幽霊データをSupabaseから安全に削除します...`);
  await fetch(`${url}/rest/v1/therapists?shop_id=eq.${GHOST_ID}`, { method: 'DELETE', headers });
  await fetch(`${url}/rest/v1/shops?id=eq.${GHOST_ID}`, { method: 'DELETE', headers });

  console.log(`\n🎉 すべてのマイグレーションが完了しました！`);
  console.log(`👉 ブラウザをリロードして、メンエスグループの「出勤情報」と「キャスト」を確認してください！`);
}

run().catch(console.error);
