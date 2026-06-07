/**
 * fix_plumeria_fujisawa.mjs
 * Plumeria 藤沢 ノイズ削除 + 正確な13名登録
 * 実行: node scripts/maintenance/fix_plumeria_fujisawa.mjs [--dry-run]
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);
const DRY = process.argv.includes('--dry-run');
const shopId = 'kanagawa_fujisawa_plumeria';

// ノイズ（誤登録）
const NOISE_NAMES = ['級美女セラピスト', '予約満了', '出勤中', '定休日', 'セラピスト募集中'];

// 正確な13名
const CORRECT_NAMES = [
  '朝倉 ゆい',
  '吉沢あおい',
  '水沢 あすか',
  '神崎つぐみ',
  '月宮 ローサ',
  '桃谷 まな',
  '沢尻いくみ',
  '相田ルミナ',
  '三上 のあ',
  '花咲 三央',
  '龍美 光佐子',
  '渡辺あい',
  '白鷺 ふうか',
];

async function main() {
  console.log(DRY ? '=== DRY RUN ===' : '=== LIVE RUN ===');

  // 1. ノイズ削除
  console.log('\n=== ノイズ削除 ===');
  for (const name of NOISE_NAMES) {
    const id = `${shopId}_${name}`;
    if (DRY) { console.log(`  DRY delete: ${id}`); continue; }
    const { error } = await supabase.from('therapists').delete().eq('id', id);
    if (error && !error.message.includes('No rows')) console.error(`  ERROR: ${error.message}`);
    else console.log(`  削除: ${name}`);
  }

  // 2. 正確な名前を登録
  console.log('\n=== Plumeria 正確な13名登録 ===');
  if (DRY) {
    CORRECT_NAMES.forEach(n => console.log(`  DRY: ${n}`));
    return;
  }

  const batch = CORRECT_NAMES.map(name => ({
    id: `${shopId}_${name}`,
    shop_id: shopId,
    name,
    image_url: null,
  }));
  const { error } = await supabase.from('therapists').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
  if (error) console.error(`  ERROR: ${error.message}`);
  else console.log(`  batch OK: ${batch.length}件`);

  console.log('\n=== 完了 ===');
}

main().catch(console.error);
