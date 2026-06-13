import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 全shop数
const { count } = await supabase.from('shops').select('*', { count: 'exact', head: true });
console.log(`全shop数: ${count}`);

// サンプル取得
const { data: shops } = await supabase
  .from('shops')
  .select('id, name, image_url, website_url')
  .order('id')
  .limit(20);

shops?.forEach(s => {
  const img = s.image_url;
  const status = !img ? '❌NULL' : img.startsWith('http') ? '✅' : '??';
  console.log(`${status} ${s.name} | ${img ? img.substring(0, 60) : 'null'}`);
});

// image_urlが短すぎる（broken）ものを探す
const { data: allShops } = await supabase
  .from('shops')
  .select('id, name, image_url, website_url')
  .not('image_url', 'is', null);

const broken = allShops?.filter(s => s.image_url && (
  s.image_url.length < 10 ||
  s.image_url === 'null' ||
  s.image_url === ''
)) || [];
console.log(`\nbroken image_url: ${broken.length}件`);
broken.forEach(s => console.log(`  ${s.name}: "${s.image_url}"`));

// Storage URLが image_urlになっているもの
const storageShoops = allShops?.filter(s => s.image_url?.includes('supabase.co/storage')) || [];
console.log(`\nStorage image_url: ${storageShoops.length}件`);
storageShoops.slice(0, 10).forEach(s => console.log(`  ${s.name}: ${s.image_url?.substring(0, 80)}`));
