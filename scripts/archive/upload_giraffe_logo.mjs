import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const SHOP_ID = 'tokyo_arakawa_nippori_aroma_giraffe';
const LOGO_URL = 'https://cdn2-caskan.com/caskan/img/shop_logo/1816_logo_1759117470.png';

const imgRes = await fetch(LOGO_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

const uploadRes = await fetch(`${url}/storage/v1/object/shop-logos/AromaGiraffe.png`, {
  method: 'POST',
  headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
  body: imgBytes
});

if (!uploadRes.ok) { console.log('❌', await uploadRes.text()); process.exit(1); }

const finalImageUrl = `${url}/storage/v1/object/public/shop-logos/AromaGiraffe.png`;
const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${SHOP_ID}`, {
  method: 'PATCH', headers, body: JSON.stringify({ image_url: finalImageUrl })
});
console.log(patchRes.ok ? '✅ ロゴ更新完了' : `❌ ${await patchRes.text()}`);
