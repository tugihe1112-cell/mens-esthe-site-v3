import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: all } = await supabase.from('shops').select('id, name, schedule_url, website_url, price_system');

const withSchedule = all.filter(s => s.schedule_url);
const withPrice    = all.filter(s => s.price_system);
const withWebsite  = all.filter(s => s.website_url);
const withNone     = all.filter(s => !s.schedule_url && !s.website_url);

console.log(`総店舗数: ${all.length}件`);
console.log(`schedule_url あり: ${withSchedule.length}件`);
console.log(`price_system あり: ${withPrice.length}件`);
console.log(`website_url  あり: ${withWebsite.length}件`);
console.log(`全部なし:          ${withNone.length}件\n`);

console.log('--- schedule_url なし・website_url あり（要設定）---');
const needsSchedule = all.filter(s => !s.schedule_url && s.website_url);
for (const s of needsSchedule) {
  console.log(`  ${s.id}: ${s.name}`);
  console.log(`    website: ${s.website_url}`);
}
