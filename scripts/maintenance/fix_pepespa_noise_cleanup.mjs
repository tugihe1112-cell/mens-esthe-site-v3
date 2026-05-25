/**
 * PEPE SPA ノイズレコード削除
 * - キャンペーン・SNS情報・WEB予約等のノイズレコードを削除
 * - 「さんの写真」サフィックス付き名前の修正または削除
 *
 * 実行: node scripts/maintenance/fix_pepespa_noise_cleanup.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

if (isDryRun) console.log('=== DRY RUN ===\n');

// PEPE SPA 全店舗
const SHOP_IDS = [
  'kanagawa_fujisawa_pepe_spa',
  'tokyo_chofu_chofu_pepe_spa',
  'tokyo_hachioji_hachioji_pepe_spa',
  'tokyo_machida_machida_pepe_spa',
  'tokyo_ota_kamata_pepe_spa',
  'tokyo_setagaya_shimokitazawa_pepe_spa',
];

function isNoise(name) {
  if (!name || name.length === 0) return true;
  if (name.length > 20) return true;
  if (/割引|Twitter|Bluesky|WEB予約|早割|フリー|限定|情報|キャンペーン/.test(name)) return true;
  if (/[★☆]{1,}/.test(name)) return true; // ★ 単体でもノイズ
  if (/🔴|🟡|🟢/.test(name)) return true;
  if (/^[《》【】\[\]「」『』<>]+/.test(name)) return true;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name) && !/^[A-Za-zÀ-ÿ\s゠-ヿ]+$/.test(name)) return true;
  return false;
}

const normName = s => (s || '').replace(/さんの写真$/, '').replace(/\s/g, '').replace(/　/g, '').trim();

let totalDeleted = 0;
let totalFixed = 0;

for (const shopId of SHOP_IDS) {
  const { data: all } = await supabase
    .from('therapists')
    .select('id, name, image_url')
    .eq('shop_id', shopId);

  if (!all?.length) continue;

  console.log(`\n[${shopId}] ${all.length}件`);

  const noiseRecords = all.filter(t => isNoise(t.name));
  const suffixRecords = all.filter(t => !isNoise(t.name) && t.name?.endsWith('さんの写真'));
  const normalRecords = all.filter(t => !isNoise(t.name) && !t.name?.endsWith('さんの写真'));

  // ノイズ削除
  for (const t of noiseRecords) {
    console.log(`  ${isDryRun ? '[DRY]' : '🗑'} ノイズ削除: "${t.name}"`);
    if (!isDryRun) {
      const { error } = await supabase.from('therapists').delete().eq('id', t.id);
      if (error) console.error(`    ERROR: ${error.message}`);
      else totalDeleted++;
    } else {
      totalDeleted++;
    }
  }

  // 「さんの写真」サフィックス修正
  for (const t of suffixRecords) {
    const cleanName = t.name.replace(/さんの写真$/, '').trim();
    // 同名の正常レコードが存在するか確認
    const duplicate = normalRecords.find(u => normName(u.name) === normName(cleanName));

    if (duplicate) {
      console.log(`  ${isDryRun ? '[DRY]' : '🗑'} 重複削除: "${t.name}" （"${duplicate.name}" が存在）`);
      if (!isDryRun) {
        const { error } = await supabase.from('therapists').delete().eq('id', t.id);
        if (error) console.error(`    ERROR: ${error.message}`);
        else totalDeleted++;
      } else {
        totalDeleted++;
      }
    } else {
      console.log(`  ${isDryRun ? '[DRY]' : '✅'} 名前修正: "${t.name}" → "${cleanName}"`);
      if (!isDryRun) {
        const { error } = await supabase.from('therapists').update({ name: cleanName }).eq('id', t.id);
        if (error) console.error(`    ERROR: ${error.message}`);
        else totalFixed++;
      } else {
        totalFixed++;
      }
    }
  }

  if (noiseRecords.length === 0 && suffixRecords.length === 0) {
    console.log(`  → 問題なし`);
  }
}

console.log(`\n完了: 削除 ${totalDeleted}件、名前修正 ${totalFixed}件`);
