/**
 * 綺麗なサロン 誤挿入データ削除
 * 実行: node scripts/maintenance/fix_kirei_wrong_entry.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 誤挿入「見出しを追加」削除
const { error, count } = await supabase.from('therapists')
  .delete({ count: 'exact' })
  .eq('shop_id', '1117')
  .eq('name', '見出しを追加');

if (error) console.log('エラー:', error.message);
else console.log(`✅ 削除完了 (${count}件)`);

// 店舗のwebsite_urlをkireina-salon.comに更新
const { error: e2 } = await supabase.from('shops').update({
  website_url: 'https://kireina-salon.com',
  schedule_url: 'https://kirei1212.livedoor.blog',
}).eq('id', '1117');
if (e2) console.log('⚠️ 店舗更新エラー:', e2.message);
else console.log('✅ 店舗URL更新完了 (website: kireina-salon.com / schedule: livedoor)');
