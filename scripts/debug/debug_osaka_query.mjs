import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

console.log('supabaseUrl:', supabaseUrl ? '✅' : '❌ undefined');
console.log('supabaseKey:', supabaseKey ? '✅' : '❌ undefined');

// パターン1: osaka_ で始まるID
const r1 = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.osaka_*&select=id,name,website_url&limit=5`, { headers: h });
console.log('\n[1] id=like.osaka_* status:', r1.status);
const d1 = await r1.json();
console.log('[1] result:', JSON.stringify(d1).slice(0, 300));

// パターン2: website_urlのNULLフィルター確認
const r2 = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.osaka_*&select=id,website_url&limit=5&website_url=not.is.null`, { headers: h });
console.log('\n[2] with not.is.null status:', r2.status);
const d2 = await r2.json();
console.log('[2] result:', JSON.stringify(d2).slice(0, 300));

// パターン3: osaka で中間一致
const r3 = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.*osaka*&select=id,name&limit=5`, { headers: h });
console.log('\n[3] id=like.*osaka* status:', r3.status);
const d3 = await r3.json();
console.log('[3] result:', JSON.stringify(d3).slice(0, 300));
