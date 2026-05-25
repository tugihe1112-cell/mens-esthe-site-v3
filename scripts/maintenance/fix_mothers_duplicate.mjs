/**
 * MOTHERS 重複shop整理
 * - '1207_1' は legacy ID（セラピスト0名）
 * - 'fukuoka_kurume_mothers' が正規ID（81名登録済み）
 * - 2店舗（博多・久留米）を group_id でまとめる
 * 実行: node scripts/maintenance/fix_mothers_duplicate.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

// ─── 現状確認 ─────────────────────────────────────────────────────────────────
console.log('=== MOTHERS 全店舗確認 ===');
const { data: shops } = await supabase.from('shops')
  .select('id, name, raw_data, group_id, website_url')
  .ilike('name', '%MOTHERS%');

for (const s of (shops || [])) {
  const { count } = await supabase.from('therapists')
    .select('id', { count: 'exact', head: true }).eq('shop_id', s.id);
  console.log(`[${s.id}] ${s.name} | ${s.raw_data?.prefecture} ${s.raw_data?.area} | group=${s.group_id || '(なし)'} | ${count}名`);
}

// ─── 修正内容 ─────────────────────────────────────────────────────────────────
// 1207_1 → 0名の不要レコード → 削除対象
// fukuoka_hakata_mothers & fukuoka_kurume_mothers → group_id で関連付け

const GROUP_ID = 'g_brand_mothers_fukuoka';

console.log(`\n=== 修正: group_id = ${GROUP_ID} に設定 ===`);

// 博多店のIDを確認
const { data: hakata } = await supabase.from('shops')
  .select('id').ilike('name', '%MOTHERS%').ilike('name', '%博多%').maybeSingle();
const { data: kurume } = await supabase.from('shops')
  .select('id').eq('id', 'fukuoka_kurume_mothers').maybeSingle();

if (hakata) console.log(`博多店: ${hakata.id}`);
if (kurume) console.log(`久留米店: ${kurume.id}`);

if (!DRY_RUN) {
  // 博多店 group_id設定
  if (hakata) {
    const { error } = await supabase.from('shops').update({ group_id: GROUP_ID }).eq('id', hakata.id);
    if (error) console.log(`❌ 博多店 group_id更新失敗: ${error.message}`);
    else console.log(`✅ ${hakata.id} → group_id: ${GROUP_ID}`);
  }

  // 久留米店 group_id設定
  if (kurume) {
    const { error } = await supabase.from('shops').update({ group_id: GROUP_ID }).eq('id', kurume.id);
    if (error) console.log(`❌ 久留米店 group_id更新失敗: ${error.message}`);
    else console.log(`✅ ${kurume.id} → group_id: ${GROUP_ID}`);
  }

  // 1207_1 はセラピスト0名なので削除
  const { data: legacy } = await supabase.from('shops').select('id').eq('id', '1207_1').maybeSingle();
  if (legacy) {
    const { error } = await supabase.from('shops').delete().eq('id', '1207_1');
    if (error) console.log(`❌ 1207_1 削除失敗: ${error.message}`);
    else console.log('✅ 1207_1 (legacy) 削除完了');
  } else {
    console.log('1207_1 は既に存在しない');
  }
} else {
  if (hakata) console.log(`[DRY RUN] ${hakata.id} → group_id: ${GROUP_ID}`);
  if (kurume) console.log(`[DRY RUN] ${kurume.id} → group_id: ${GROUP_ID}`);
  console.log('[DRY RUN] 1207_1 → 削除予定（セラピスト0名）');
}

console.log('\n完了');
