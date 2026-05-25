/**
 * カテゴリD: 重複店舗の統合・削除
 * 各ペアで「残す」側に一意セラピストを移行し、「消す」側を削除する
 * 実行: node scripts/maintenance/fix_duplicate_shops.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
if (DRY_RUN) console.log('[DRY RUN]\n');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// [ keep_id, delete_id, keep_new_group_id (nullなら変更なし), label ]
const PAIRS = [
  ['osaka_umeda_super_happy_girls',                'osaka_nipponbashi_super_happy',                   null,                         'スーパーハッピーガールズ'],
  ['tokyo_meguro_meguro_petime',                   'tokyo_meguro_meguro_taiiku_jikan',                'g_brand_taiiku_jikan',       '体育の時間'],
  ['tokyo_taito_ueno_iyashi_annex',                'tokyo_taito_ueno_iyashinokuukan_annex',            'g_brand_iyashinokuukan_annex','癒しの空間 Annex'],
  ['tokyo_taito_ueno_tokyo_luxury',                'tokyo_taito_ueno_tokyo-luxury',                   'g_brand_tokyo_luxury',       '東京ラグジュアリー'],
  ['tokyo_sumida_ryogoku_otonaspa_kutsurogi',      'tokyo_sumida_ryougoku_otonaspa_kutsurogi',        'g_brand_otonaspa_kutsurogi', '大人スパ 両国'],
  ['tokyo_adachi_kitasenju_muchispa',              'tokyo_adachi_kitasenju_muchispa_room',             'g_brand_muchispa_room',      'むちすぱルーム 北千住'],
  ['tokyo_ota_kamata_angeaile',                    'tokyo_ota_kamata_anjuaile',                        'g_brand_anjuaile',           'Anjuaile'],
  ['tokyo_setagaya_sangenjaya_sanchabijin',         'tokyo_setagaya_sangenjaya_sancha_bijin',           'g_brand_sancha_bijin',       '三茶美人'],
  // ゴールデンのみ逆（58名のnakano_goldenを残す、画像はnakano_nakano_goldenからコピー）
  ['tokyo_nakano_golden',                          'tokyo_nakano_nakano_golden',                       'g_brand_golden',             'ゴールデン 中野'],
];

let totalMigrated = 0;
let totalDeleted = 0;

for (const [keepId, deleteId, newGroupId, label] of PAIRS) {
  console.log(`\n===== ${label} =====`);
  console.log(`  KEEP  : ${keepId}`);
  console.log(`  DELETE: ${deleteId}`);

  // 両方のshopを取得
  const { data: keepShop } = await supabase.from('shops').select('id, group_id, image_url').eq('id', keepId).single();
  const { data: delShop }  = await supabase.from('shops').select('id, group_id, image_url').eq('id', deleteId).single();

  if (!keepShop) { console.log('  ⚠️ KEEP shop not found'); continue; }
  if (!delShop)  { console.log('  ⚠️ DELETE shop not found'); continue; }

  // 両方のセラピストを取得
  const { data: keepTherapists } = await supabase.from('therapists').select('id, name').eq('shop_id', keepId);
  const { data: delTherapists }  = await supabase.from('therapists').select('id, name, image_url').eq('shop_id', deleteId);

  const keepNames = new Set((keepTherapists || []).map(t => t.name?.replace(/[\s　]+/g, '').toLowerCase()));

  // ノイズフィルタ（セラピスト名として不適切なもの）
  const NOISE_WORDS = ['キャッシュバック', 'イベント', 'キャンペーン', '割引', '新規', 'ポイント', 'LINE', 'banner'];
  const isNoise = (name) => !name || NOISE_WORDS.some(w => name.includes(w)) || name.length > 12;

  // 体育の時間は全員がユニーク判定されるが同一店舗なのでスキップ（削除のみ）
  const SKIP_MIGRATE_IDS = new Set(['tokyo_meguro_meguro_taiiku_jikan']);

  // 移行対象（KEEPに存在しない名前のもの）
  const toMigrate = SKIP_MIGRATE_IDS.has(deleteId) ? [] : (delTherapists || []).filter(t => {
    const n = t.name?.replace(/[\s　]+/g, '').toLowerCase();
    return n && !keepNames.has(n) && !isNoise(t.name);
  });
  const toDeleteTherapists = (delTherapists || []).filter(t => {
    const n = t.name?.replace(/[\s　]+/g, '').toLowerCase();
    return !n || keepNames.has(n);
  });

  console.log(`  セラピスト: KEEP=${keepTherapists?.length || 0}名, DELETE=${delTherapists?.length || 0}名`);
  console.log(`  → 移行対象(ユニーク): ${toMigrate.length}名, 削除(重複): ${toDeleteTherapists.length}名`);
  toMigrate.forEach(t => console.log(`    ↑ 移行: ${t.name}`));

  // 画像コピー（KEEPが画像なし && DELETEが画像あり）
  const needImageCopy = !keepShop.image_url && delShop.image_url;
  if (needImageCopy) console.log(`  📷 image_url を ${deleteId} からコピー`);

  if (DRY_RUN) continue;

  // 1. ユニークセラピストをKEEPへ移行
  for (const t of toMigrate) {
    const newId = `${keepId}_${t.name}`;
    const { error } = await supabase.from('therapists').update({ shop_id: keepId, id: newId }).eq('id', t.id);
    if (error) console.log(`  ❌ 移行失敗 ${t.name}: ${error.message}`);
    else { process.stdout.write('+'); totalMigrated++; }
  }

  // 2. 重複セラピストを削除
  const idsToDelete = toDeleteTherapists.map(t => t.id);
  if (idsToDelete.length > 0) {
    const { error } = await supabase.from('therapists').delete().in('id', idsToDelete);
    if (error) console.log(`  ❌ セラピスト削除失敗: ${error.message}`);
    else { totalDeleted += idsToDelete.length; }
  }

  // 3. KEEPのshopを更新（group_id、image_url）
  const shopUpdate = {};
  if (newGroupId && keepShop.group_id !== newGroupId) shopUpdate.group_id = newGroupId;
  if (needImageCopy) shopUpdate.image_url = delShop.image_url;
  if (Object.keys(shopUpdate).length > 0) {
    const { error } = await supabase.from('shops').update(shopUpdate).eq('id', keepId);
    if (error) console.log(`  ❌ shop更新失敗: ${error.message}`);
    else console.log(`  ✅ shop更新: ${JSON.stringify(shopUpdate)}`);
  }

  // 4. DELETE shopのセラピストが残っていれば削除（移行できなかったものも念のため）
  await supabase.from('therapists').delete().eq('shop_id', deleteId);

  // 5. DELETE shopを削除
  const { error: shopDelErr } = await supabase.from('shops').delete().eq('id', deleteId);
  if (shopDelErr) console.log(`  ❌ shop削除失敗: ${shopDelErr.message}`);
  else console.log(`  🗑️ ${deleteId} を削除`);
}

if (!DRY_RUN) {
  console.log(`\n✅ セラピスト移行: ${totalMigrated}名, セラピスト削除: ${totalDeleted}名`);
}
