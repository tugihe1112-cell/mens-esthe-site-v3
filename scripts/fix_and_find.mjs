import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- 1. スケジュールが出ない問題の修正 ---');
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');

  // Reactがローカルで握っているIDに対して、直接出勤情報のURLをねじ込む
  const targetId = 'tokyo_setagaya_futakotamagawa_mens_esthe_group';
  const scheduleUrl = 'https://www.futakotamagawa-mens-esthe.com/schedule/';

  try {
    const res = await fetch(`${url}/rest/v1/shops?id=eq.${targetId}`, {
      method: 'PATCH',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule_url: scheduleUrl })
    });
    if (res.ok) console.log('✅ スケジュールURLをDBに強制登録しました！（ブラウザをリロードするとボタンが出ます）');
  } catch(e) { console.error('エラー:', e.message); }

  console.log('\n--- 2. 口コミが吸収されない問題（原因箇所の特定） ---');
  function search(dir) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name === 'node_modules' || item.name === 'dist') continue;
      const p = path.join(dir, item.name);
      if (item.isDirectory()) search(p);
      else if (p.endsWith('.jsx') || p.endsWith('.tsx')) {
        const text = fs.readFileSync(p, 'utf8');
        if (text.includes('review') || text.includes('Review')) {
          const lines = text.split('\n');
          // DBからの取得（.eq('shop_id'...)）か、ローカルの絞り込み（.filter(...)）を探す
          const idx = lines.findIndex(l => 
            (l.includes('.eq') && l.includes('shop_id')) || 
            (l.includes('filter') && (l.includes('shop_id') || l.includes('shop.id') || l.includes('shopId')))
          );
          if (idx !== -1) {
            console.log(`\n🎯 発見: ${p}`);
            console.log('--------------------------------------------------');
            console.log(lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 3)).join('\n'));
            console.log('--------------------------------------------------');
          }
        }
      }
    }
  }
  search('src');
}
run().catch(console.error);
