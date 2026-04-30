/**
 * RERE GROUP ロゴ適用（全3店舗）
 * 実行: node update_rere_logo.mjs
 */
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const LOGO_URL = 'https://www.rere-group.com/shared/images/logo.svg';
const WEBSITE_URL = 'https://www.rere-group.com';

const SHOPS = [
  'tokyo_machida_rere',
  'tokyo_hachioji_rere',
  'kanagawa_kawasaki_rere',
];

console.log('📤 ロゴをStorageにアップロード中...');
const ua = { 'User-Agent': 'Mozilla/5.0' };
const imgRes = await fetch(LOGO_URL, { headers: ua });
const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

const uploadRes = await fetch(`${url}/storage/v1/object/shop-logos/ReReGroup.svg`, {
  method: 'POST',
  headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'image/svg+xml', 'x-upsert': 'true' },
  body: imgBytes
});

if (!uploadRes.ok) { console.log('❌ アップロード失敗:', await uploadRes.text()); process.exit(1); }

const image_url = `${url}/storage/v1/object/public/shop-logos/ReReGroup.svg`;
console.log('✅ アップロード完了\n');

for (const id of SHOPS) {
  const res = await fetch(`${url}/rest/v1/shops?id=eq.${id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ image_url, website_url: WEBSITE_URL })
  });
  console.log(res.ok ? `✅ ${id}` : `❌ ${id}: ${await res.text()}`);
}
