import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { count: total } = await supabase.from('shops').select('*', { count: 'exact', head: true });
const { count: withUrl } = await supabase.from('shops').select('*', { count: 'exact', head: true }).not('schedule_url', 'is', null);
const { data: noUrl } = await supabase.from('shops').select('id, name').is('schedule_url', null).limit(20);

console.log('総店舗数:', total);
console.log('schedule_urlあり:', withUrl);
console.log('schedule_urlなし:', total - withUrl);
if (noUrl?.length) {
  console.log('\nなし店舗:');
  noUrl.forEach(s => console.log(' -', s.id, s.name));
}
