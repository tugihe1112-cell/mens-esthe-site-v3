/**
 * Supabase の UPDATE 権限を確認するスクリプト
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 1件だけUPDATEを試みてカウントを確認
const TARGET_ID = 'menesthe_9416_0_1779065215297'; // 永井 さつき

console.log(`対象ID: ${TARGET_ID}`);
console.log('UPDATEを試みます...');

const { data, error, count } = await supabase
  .from('reviews')
  .update({ user_id: 'test_update' })
  .eq('id', TARGET_ID)
  .select(); // .select()を付けると更新後の行が返る

console.log('error:', error);
console.log('data:', data);

// 実際に変わったか確認
const { data: check } = await supabase
  .from('reviews')
  .select('id, user_id')
  .eq('id', TARGET_ID)
  .single();

console.log('更新後のuser_id:', check?.user_id);

if (check?.user_id === 'test_update') {
  console.log('✅ UPDATEは成功している');
  // 元に戻す
  await supabase.from('reviews').update({ user_id: 'menesthe_import' }).eq('id', TARGET_ID);
  console.log('（元のmenesthe_importに戻しました）');
} else {
  console.log('❌ UPDATEがサイレントに無視されている（RLS問題）');
  console.log('→ SUPABASE_SERVICE_ROLE_KEY が必要です');
}
