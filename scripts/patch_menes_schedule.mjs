import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };
  
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const targetId = 'tokyo_setagaya_futakotamagawa_mens_esthe_group';
  
  console.log('🔗 Supabase のデータベースに直接出勤情報の URL を書き込みます...');

  try {
    const res = await fetch(`${url}/rest/v1/shops?id=eq.${targetId}`, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        schedule_url: 'https://www.futakotamagawa-mens-esthe.com/schedule/'
      })
    });

    if (res.ok) {
      console.log('✅ Supabase の更新に成功しました。');
    } else {
      console.error('❌ エラー:', await res.text());
    }
  } catch(e) {
    console.error('❌ 接続エラー:', e.message);
  }
}

run();
