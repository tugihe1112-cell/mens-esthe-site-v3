/**
 * 竜宮城 全店舗の状況確認
 * 実行: node scripts/debug/check_ryugujo_all.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 竜宮城系の店舗を全部取得
const { data: shops } = await supabase.from('shops').select('id, name').ilike('id', '%ryugujo%');
console.log('=== 竜宮城 店舗一覧 ===');
shops?.forEach(s => console.log(`  ${s.id} | ${s.name}`));

// 各店舗のセラピスト数とimage_url状況
for (const shop of (shops || [])) {
  const { data: therapists } = await supabase.from('therapists').select('id, name, image_url').eq('shop_id', shop.id);
  const total = therapists?.length ?? 0;
  const svgCount = therapists?.filter(t => t.image_url?.includes('.svg') || t.image_url?.includes('twitter')).length ?? 0;
  const nullCount = therapists?.filter(t => !t.image_url).length ?? 0;
  const storageCount = therapists?.filter(t => t.image_url?.includes('supabase')).length ?? 0;
  const wpCount = therapists?.filter(t => t.image_url?.includes('wp-content')).length ?? 0;
  console.log(`\n${shop.id} (${total}名)`);
  console.log(`  Supabase Storage: ${storageCount}名`);
  console.log(`  wp-content(未移行): ${wpCount}名`);
  console.log(`  SVG/Twitter アイコン: ${svgCount}名`);
  console.log(`  画像なし: ${nullCount}名`);

  // SVGのサンプル
  const svgSamples = therapists?.filter(t => t.image_url?.includes('.svg') || t.image_url?.includes('twitter')).slice(0, 3);
  svgSamples?.forEach(t => console.log(`    ⚠️  ${t.name} → ${t.image_url}`));
}
