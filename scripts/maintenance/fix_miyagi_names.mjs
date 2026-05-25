/**
 * 宮城県 名前ゴミ除去・正規化スクリプト
 *
 * Pulunt:
 *   - 「新人XXX」→「XXX」にリネーム（ID変更）
 *   - 「体験入店　XXX」→「XXX」にリネーム（ID変更）
 *   - 「体験入店（Beauty）」→ 名前なしのため削除
 *   - now-printing.jpg URL → image_url = null
 *
 * Platonic SPA:
 *   - 「ひびき ♡期間限定♡」→「ひびき」
 *   - 「あおい(店舗専属講師)」→「あおい」
 *
 * 実行: node scripts/maintenance/fix_miyagi_names.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (DRY_RUN) console.log('[DRY RUN]\n');

const PULUNT = 'miyagi_sendai_pulunt';
const PLATONIC = 'miyagi_sendai_platonic_spa';

// ---- Pulunt: リネームリスト（旧名前 → 新名前）----
// 同名が既にいる場合は新名前にサフィックスを付けること
const PULUNT_RENAMES = [
  { old: '新人ましろ',       new: 'ましろ' },
  { old: '新人るい',         new: 'るい' },
  { old: '新人　雅',         new: '雅' },
  { old: '新人なの',         new: 'なの2' },   // 「なの」が既存のため
  { old: '新人あみ',         new: 'あみ' },
  { old: '体験入店　かりな', new: 'かりな' },
  { old: '体験入店　ねね',   new: 'ねね2' },   // 「ねね」が既存のため
  { old: '体験入店　桃名',   new: '桃名2' },   // 「桃名」が既存のため
];

// ---- 削除対象（名前として不適切なもの）----
const DELETE_IDS = [
  `${PULUNT}_体験入店（Beauty）`,
];

// ---- Platonic SPA: リネームリスト ----
const PLATONIC_RENAMES = [
  { old: 'ひびき ♡期間限定♡',    new: 'ひびき' },
  { old: 'あおい(店舗専属講師)', new: 'あおい' },
];

// ---- ヘルパー: リネーム処理（旧IDのデータを新IDでupsert → 旧IDを削除）----
const rename = async (shopId, oldName, newName) => {
  const oldId = `${shopId}_${oldName}`;
  const newId = `${shopId}_${newName}`;

  // 旧レコード取得
  const { data: old } = await supabase.from('therapists').select('*').eq('id', oldId).single();
  if (!old) { console.warn(`  ⚠️ 旧レコードなし: ${oldId}`); return; }

  console.log(`  ${oldName} → ${newName}`);
  if (DRY_RUN) return;

  // 新IDで登録
  const { error: e1 } = await supabase.from('therapists').upsert({
    ...old,
    id: newId,
    name: newName,
  }, { onConflict: 'id' });
  if (e1) { console.error(`    ❌ upsert失敗: ${e1.message}`); return; }

  // 旧IDを削除
  const { error: e2 } = await supabase.from('therapists').delete().eq('id', oldId);
  if (e2) { console.error(`    ❌ 旧ID削除失敗: ${e2.message}`); return; }

  console.log(`    ✅`);
};

// ---- ヘルパー: image_url をnullに ----
const nullifyImage = async (shopId, name) => {
  const id = `${shopId}_${name}`;
  console.log(`  image_url = null: ${name}`);
  if (DRY_RUN) return;
  const { error } = await supabase.from('therapists').update({ image_url: null }).eq('id', id);
  if (error) console.error(`    ❌ ${error.message}`);
  else       console.log(`    ✅`);
};

// ---- ヘルパー: 削除 ----
const deleteById = async (id) => {
  console.log(`  削除: ${id}`);
  if (DRY_RUN) return;
  const { error } = await supabase.from('therapists').delete().eq('id', id);
  if (error) console.error(`    ❌ ${error.message}`);
  else       console.log(`    ✅`);
};

// ========================
// Pulunt 処理
// ========================
console.log('=== Pulunt: リネーム ===');
for (const r of PULUNT_RENAMES) {
  await rename(PULUNT, r.old, r.new);
}

console.log('\n=== Pulunt: ノイズ削除 ===');
for (const id of DELETE_IDS) {
  await deleteById(id);
}

console.log('\n=== Pulunt: now-printing → image_url null ===');
for (const name of ['Rちゃん', '湊(Beauty）']) {
  await nullifyImage(PULUNT, name);
}

// ========================
// Platonic SPA 処理
// ========================
console.log('\n=== Platonic SPA: リネーム ===');
for (const r of PLATONIC_RENAMES) {
  await rename(PLATONIC, r.old, r.new);
}

console.log('\n完了');
