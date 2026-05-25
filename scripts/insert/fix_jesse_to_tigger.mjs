import fs from 'fs';

const UPDATES = [
  { id: 'kanagawa_kawasaki_mizonokuchi_jesse',   name: 'Tigger (ティガー 溝の口店)' },
  { id: 'kanagawa_kawasaki_musashikosugi_jesse', name: 'Tigger (ティガー 武蔵小杉店)' },
  { id: 'kanagawa_kawasaki_noborito_jesse',      name: 'Tigger (ティガー 登戸店)' },
];

async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

  for (const { id, name } of UPDATES) {
    const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ name }),
    });
    console.log(`${name}: ${r.ok ? '✅' : `❌ ${await r.text()}`}`);
  }
  console.log('完了 ✅');
}

run().catch(e => console.error('❌', e.message));
