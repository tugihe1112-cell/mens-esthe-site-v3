/**
 * 店舗サムネイル品質チェック
 * Supabase Storage に上がっているもの（手動スクショ）を検出
 * 実行: node scripts/debug/check_shop_image_quality.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase
  .from('shops')
  .select('id, name, image_url, website_url')
  .order('name');

const storageUrl = getEnv('VITE_SUPABASE_URL') + '/storage';

const noImage    = shops.filter(s => !s.image_url);
const inStorage  = shops.filter(s => s.image_url && s.image_url.includes(storageUrl));
const external   = shops.filter(s => s.image_url && !s.image_url.includes(storageUrl));

console.log(`\n総店舗数: ${shops.length}件`);
console.log(`✅ 外部URL（og:image）: ${external.length}件`);
console.log(`⚠️  Supabase Storage（スクショ）: ${inStorage.length}件`);
console.log(`❌ 画像なし: ${noImage.length}件`);

if (inStorage.length > 0) {
  console.log('\n─── Supabase Storage（差し替え対象） ───');
  inStorage.forEach(s => {
    const hasWebsite = s.website_url ? '🌐' : '❓';
    console.log(`${hasWebsite} ${s.name}`);
    console.log(`   id: ${s.id}`);
    console.log(`   website: ${s.website_url || 'なし'}`);
  });
}

if (noImage.length > 0) {
  console.log('\n─── 画像なし（取得できれば追加） ───');
  noImage.forEach(s => {
    const hasWebsite = s.website_url ? '🌐' : '❓';
    console.log(`${hasWebsite} ${s.name} (${s.id})`);
  });
}
