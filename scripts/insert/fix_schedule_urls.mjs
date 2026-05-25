/**
 * スケジュールURL のみ更新
 * 実行: node scripts/insert/fix_schedule_urls.mjs
 */
import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  const updates = [
    { id: 'kanagawa_shinyokohama_yuru_spa', schedule_url: 'https://yuru-spa.com/yokohama/schedule/' },
  ];

  for (const { id, schedule_url } of updates) {
    const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ schedule_url })
    });
    console.log(r.ok ? `✅ ${id} → ${schedule_url}` : `❌ ${id}: ${await r.text()}`);
  }
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
