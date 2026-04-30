import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const SHOP_ID = 'tokyo_adachi_kitasenju_remis';
const LOGO_URL = 'https://cdn2-caskan.com/caskan/img/shop_logo/1486_logo_1715682479.png';

console.log('📤 ロゴをアップロード中...');
const imgRes = await fetch(LOGO_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

const uploadRes = await fetch(`${url}/storage/v1/object/shop-logos/Remis.png`, {
  method: 'POST',
  headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
  body: imgBytes
});

if (!uploadRes.ok) {
  console.log('❌ アップロード失敗:', await uploadRes.text());
  process.exit(1);
}

const finalImageUrl = `${url}/storage/v1/object/public/shop-logos/Remis.png`;
console.log('✅ アップロード完了');

const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${SHOP_ID}`, {
  method: 'PATCH', headers, body: JSON.stringify({ image_url: finalImageUrl })
});
console.log(patchRes.ok ? '✅ shops.image_url 更新完了' : `❌ 失敗: ${await patchRes.text()}`);
