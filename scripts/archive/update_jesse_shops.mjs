import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const image_url = `${url}/storage/v1/object/public/shop-logos/Jesse.png`;
const schedule_url = 'https://ms-jesse.com/schedule';
const website_url = 'https://ms-jesse.com';
const price_system = `70分: 14,000円\n90分: 16,000円\n120分: 21,000円`;

const SHOPS = [
  'tokyo_chofu_jesse',
  'tokyo_setagaya_futakotamagawa_jesse',
];

for (const id of SHOPS) {
  const res = await fetch(`${url}/rest/v1/shops?id=eq.${id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ image_url, schedule_url, website_url, price_system })
  });
  console.log(res.ok ? `✅ ${id}` : `❌ ${id}: ${await res.text()}`);
}
