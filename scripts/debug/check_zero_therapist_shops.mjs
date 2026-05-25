/**
 * セラピスト0名のshopとそのwebsite_urlを一覧表示
 * 実行: node scripts/debug/check_zero_therapist_shops.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase.from('shops')
  .select('id, name, website_url, raw_data')
  .order('raw_data->>prefecture');

const results = [];
for (const s of (shops || [])) {
  const { count } = await supabase.from('therapists')
    .select('id', { count: 'exact', head: true }).eq('shop_id', s.id);
  if (count === 0) {
    results.push({ pref: s.raw_data?.prefecture || '?', id: s.id, name: s.name, url: s.website_url || '(なし)' });
  }
}

console.log(`\n=== セラピスト0名のshop (${results.length}件) ===\n`);
let lastPref = '';
for (const r of results) {
  if (r.pref !== lastPref) { console.log(`\n【${r.pref}】`); lastPref = r.pref; }
  console.log(`  [${r.id}] ${r.name}`);
  console.log(`    URL: ${r.url}`);
}
