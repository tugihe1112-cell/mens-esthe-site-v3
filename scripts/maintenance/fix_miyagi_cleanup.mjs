/**
 * 宮城県 追加修正スクリプト
 * - Cuaura (閉店) を shops テーブルから削除
 * - schedule_url を設定（Aroma No5, ONE time, SHIZUKU SPA）
 *
 * 実行: node scripts/maintenance/fix_miyagi_cleanup.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

// ---- schedule_url 設定 ----
const SCHEDULE_UPDATES = [
  { id: 'miyagi_sendai_aroma_no5',   schedule_url: 'https://www.aroma-no5.com/blank' },
  { id: 'miyagi_sendai_onetime',     schedule_url: 'https://onetime-sendai.com/schedule/' },
  { id: 'miyagi_sendai_shizuku_spa', schedule_url: 'https://shizuku-spa.com/schedule' },
];

console.log('=== schedule_url 設定 ===');
for (const u of SCHEDULE_UPDATES) {
  console.log(`  ${u.id} → ${u.schedule_url}`);
  if (DRY_RUN) continue;
  const { error } = await supabase.from('shops').update({ schedule_url: u.schedule_url }).eq('id', u.id);
  if (error) console.error(`    ❌ ${error.message}`);
  else       console.log(`    ✅`);
}

// ---- Cuaura 削除（閉店） ----
console.log('\n=== Cuaura 削除（閉店） ===');
const CUAURA_ID = 'miyagi_sendai_cuaura';

// therapists は 0名のはずだが念のため確認
const { count } = await supabase
  .from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', CUAURA_ID);
console.log(`  therapists: ${count}名`);

if (!DRY_RUN) {
  // therapists 削除（念のため）
  if (count > 0) {
    const { error: te } = await supabase.from('therapists').delete().eq('shop_id', CUAURA_ID);
    if (te) { console.error(`  ❌ therapists削除失敗: ${te.message}`); }
    else    { console.log(`  ✅ therapists ${count}名 削除`); }
  }
  // shop 削除
  const { error: se } = await supabase.from('shops').delete().eq('id', CUAURA_ID);
  if (se) console.error(`  ❌ shop削除失敗: ${se.message}`);
  else    console.log(`  ✅ Cuaura shop削除完了`);
} else {
  console.log(`  → shops.delete(id = '${CUAURA_ID}') を実行予定`);
}

console.log('\n完了');
