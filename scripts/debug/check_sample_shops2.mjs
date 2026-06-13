import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// 全shop数
const { count, error: ce } = await supabase.from('shops').select('*', { count: 'exact', head: true });
console.log(`全shop数: ${count}, error: ${ce?.message}`);

// サンプル取得 - image_url が null のもの
const { data: nullShops, error: e1 } = await supabase
  .from('shops')
  .select('id, name, image_url, website_url')
  .is('image_url', null)
  .limit(200);
console.log(`\nimage_url=null: ${nullShops?.length ?? 0}件, error: ${e1?.message}`);
nullShops?.forEach(s => console.log(`  ${s.id} | ${s.name} | URL: ${s.website_url?.substring(0, 50) || 'null'}`));
