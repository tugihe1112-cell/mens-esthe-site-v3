/**
 * Mrs Crystal のセラピスト画像URL確認
 * 実行: node scripts/debug/check_mrscrystal_images.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data } = await supabase.from('therapists')
  .select('name, image_url')
  .eq('shop_id', 'aichi_tsurumai_mrs_crystal')
  .order('name');

const withPhoto = data.filter(t => t.image_url);
const noPhoto = data.filter(t => !t.image_url);

console.log(`総数: ${data.length}名`);
console.log(`写真あり: ${withPhoto.length}名`);
console.log(`写真なし: ${noPhoto.length}名`);

if (noPhoto.length > 0) {
  console.log('\n--- 写真なし一覧 ---');
  noPhoto.forEach(t => console.log(`  ${t.name}`));
}

if (withPhoto.length > 0) {
  console.log('\n--- 写真あり（先頭3件）---');
  withPhoto.slice(0, 3).forEach(t => console.log(`  ${t.name} | ${t.image_url?.slice(0, 60)}`));
}
