/**
 * もりかれん → 森かれん 名前・therapist_id修正
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const SHOP_ID = 'tokyo_shibuya_silk';

// DBの正しいセラピスト名を確認
const { data: therapists } = await supabase
  .from('therapists')
  .select('id, name')
  .eq('shop_id', SHOP_ID)
  .or('name.ilike.%かれん%,name.ilike.%カレン%,name.ilike.%karen%');

console.log('Silkのかれん系セラピスト:', therapists);

// 投稿したレビューを特定
const { data: reviews } = await supabase
  .from('reviews')
  .select('id, therapist_name, therapist_id')
  .eq('shop_id', SHOP_ID)
  .eq('user_id', 'owner_manual');

console.log('手動投稿レビュー:', reviews);

if (!therapists?.length) {
  console.log('\n⚠️ DBにかれん系のセラピストが見つかりませんでした');
  console.log('therapist_nameを「森かれん」に修正します');
}

const correctName = therapists?.[0]?.name ?? '森かれん';
const correctTherapistId = therapists?.[0]?.id ?? `${SHOP_ID}_森かれん`;

console.log(`\n修正後: name=${correctName}, therapist_id=${correctTherapistId}`);

for (const review of reviews ?? []) {
  const { error } = await supabase
    .from('reviews')
    .update({
      therapist_name: correctName,
      therapist_id: correctTherapistId,
    })
    .eq('id', review.id);

  if (error) {
    console.error(`❌ ${review.id}: ${error.message}`);
  } else {
    console.log(`✅ ${review.id} 修正完了`);
  }
}
