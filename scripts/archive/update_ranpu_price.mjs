import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const SHOP_ID = 'tokyo_adachi_kitasenju_ranpu_kitasenju';

const price_system = `90分: 10,000円
おすすめ120分: 14,000円
150分: 18,000円
180分: 21,000円
240分: 28,000円
300分: 35,000円`;

const res = await fetch(`${url}/rest/v1/shops?id=eq.${SHOP_ID}`, {
  method: 'PATCH', headers, body: JSON.stringify({ price_system })
});
console.log(res.ok ? '✅ 料金システム更新完了' : `❌ 失敗: ${await res.text()}`);
