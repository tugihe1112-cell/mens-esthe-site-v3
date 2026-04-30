/**
 * shopsテーブルのwebsite_urlを正しいURLに更新
 * 実行: node update_website_url.mjs
 */
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'))?.[1]?.trim();
const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

const updates = [
  { id: 'tokyo_adachi_kitasenju_himitsu_mrs_room', website_url: 'https://himitsu-mrs-27.com' },
  { id: 'himitsu_mrs_room_minamiurawa',            website_url: 'https://himitsu-mrs-27.com' },
];

for (const { id, website_url } of updates) {
  const res = await fetch(`${url}/rest/v1/shops?id=eq.${id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ website_url })
  });
  const ok = res.ok;
  const text = ok ? '' : await res.text();
  console.log(ok ? `✅ ${id}` : `❌ ${id}: ${text}`);
}
