/**
 * raw_data.area が文字列でない店舗を特定
 * 実行: node scripts/debug/check_area_type.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const { data, error } = await supabase.from('shops').select('id, name, raw_data');
if (error) { console.error(error); process.exit(1); }

const bad = data.filter(d => {
  const area = d.raw_data?.area;
  return area !== undefined && area !== null && typeof area !== 'string';
});

console.log(`問題のある店舗: ${bad.length}件`);
bad.forEach(d => {
  console.log(`  ${d.id} | ${d.name}`);
  console.log(`    area: ${JSON.stringify(d.raw_data?.area)}`);
});
