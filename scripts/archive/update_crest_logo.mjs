import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const LOGO_URL = 'https://crestspa-tokyo.com/assets/customer/logo-0386ff3dfbb2b738d87fbfc8c016a731da40fff2c9e3e23beeee2a8a75944975.png';
const WEBSITE_URL = 'https://crestspa-tokyo.com';

const SHOPS = [
  'tokyo_tachikawa_tachikawa_crest',
  'tokyo_kita_akabane_crest',
  'tokyo_musashino_kichijoji_crest',
  'tokyo_suginami_ogikubo_crest',
  'tokyo_kita_crest_spa_tokyo',
  'tokyo_tachikawa_crest_spa_tokyo',
];

console.log('📤 ロゴをStorageにアップロード中...');
const imgRes = await fetch(LOGO_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

const uploadRes = await fetch(`${url}/storage/v1/object/shop-logos/CrestSpa.png`, {
  method: 'POST',
  headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
  body: imgBytes
});

if (!uploadRes.ok) { console.log('❌ アップロード失敗:', await uploadRes.text()); process.exit(1); }

const image_url = `${url}/storage/v1/object/public/shop-logos/CrestSpa.png`;
console.log('✅ アップロード完了\n');

for (const id of SHOPS) {
  const res = await fetch(`${url}/rest/v1/shops?id=eq.${id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ image_url, website_url: WEBSITE_URL })
  });
  console.log(res.ok ? `✅ ${id}` : `❌ ${id}: ${await res.text()}`);
}
