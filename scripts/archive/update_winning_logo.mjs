import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const image_url = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/winningheven.png';

const SHOPS = [
  'tokyo_setagaya_kyodo_winning_heaven',
  'tokyo_setagaya_chitose_karasuyama_winning_heaven',
  'tokyo_setagaya_soshigaya_okura_winning_heaven',
];

for (const id of SHOPS) {
  const res = await fetch(`${url}/rest/v1/shops?id=eq.${id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ image_url })
  });
  console.log(res.ok ? `✅ ${id}` : `❌ ${id}: ${await res.text()}`);
}
