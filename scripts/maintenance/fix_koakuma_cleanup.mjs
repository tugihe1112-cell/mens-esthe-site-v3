/**
 * 小悪魔スパトウキョウ 退職者4名（×4店舗=16件）削除
 * 橋本るい・小鳥遊ゆり・葉月あや・双葉ゆりな
 * 実行: node scripts/maintenance/fix_koakuma_cleanup.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

const TARGET_NAMES = ['橋本　るい', '小鳥遊　ゆり', '葉月　あや', '双葉　ゆりな'];

const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%mens-esthe-aroma%');
if (!shops?.length) { console.log('店舗なし'); process.exit(1); }
console.log(`対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: targets } = await supabase.from('therapists')
  .select('id, name, shop_id')
  .in('shop_id', shopIds)
  .in('name', TARGET_NAMES);

console.log(`削除対象: ${targets?.length ?? 0}件`);
targets?.forEach(t => console.log(`  ${t.name} (${t.shop_id})`));

if (DRY_RUN) process.exit(0);

const ids = targets?.map(t => t.id) || [];
if (ids.length === 0) { console.log('削除対象なし'); process.exit(0); }

const { error } = await supabase.from('therapists').delete().in('id', ids);
if (error) { console.log(`❌ 削除失敗: ${error.message}`); process.exit(1); }

console.log(`✅ ${ids.length}件削除完了`);
