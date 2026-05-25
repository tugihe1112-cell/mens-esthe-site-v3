/**
 * SALON BLANCA の鈴川ありさ重複を調査・削除するスクリプト
 * 実行: node scripts/maintenance/fix_blanca_duplicates.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('🔍 DRY-RUN モード（DB変更なし）\n');

// SALON BLANCA の shop_id を取得
const { data: shops } = await supabase
  .from('shops')
  .select('id, name')
  .ilike('name', '%BLANCA%');

console.log('SALON BLANCA 店舗:');
shops?.forEach(s => console.log(' ', s.id, '|', s.name));

for (const shop of (shops || [])) {
  console.log(`\n--- ${shop.name} (${shop.id}) ---`);

  const { data: therapists } = await supabase
    .from('therapists')
    .select('id, name, image_url, created_at')
    .eq('shop_id', shop.id)
    .order('name');

  // 名前ごとにグループ化
  const nameMap = {};
  for (const t of (therapists || [])) {
    const key = t.name.trim();
    if (!nameMap[key]) nameMap[key] = [];
    nameMap[key].push(t);
  }

  // 重複を探す
  for (const [name, list] of Object.entries(nameMap)) {
    if (list.length <= 1) continue;
    console.log(`\n⚠️  重複: "${name}" (${list.length}件)`);
    list.forEach((t, i) => console.log(`  [${i}] id=${t.id} | image=${t.image_url ? '✓' : 'null'} | created=${t.created_at}`));

    // 写真ありを優先して残す、写真なしを削除
    const withImage = list.filter(t => t.image_url);
    const withoutImage = list.filter(t => !t.image_url);

    let toKeep, toDelete;
    if (withImage.length > 0) {
      // 写真ありの中で最初のものを残す
      toKeep = withImage[0];
      toDelete = [...withImage.slice(1), ...withoutImage];
    } else {
      // 全員写真なし → 最初のものを残す
      toKeep = list[0];
      toDelete = list.slice(1);
    }

    console.log(`  ✅ 残す: ${toKeep.id} (${toKeep.image_url ? '写真あり' : '写真なし'})`);
    for (const t of toDelete) {
      console.log(`  🗑️  削除: ${t.id} (${t.image_url ? '写真あり' : '写真なし'})`);
      if (!DRY_RUN) {
        const { error } = await supabase.from('therapists').delete().eq('id', t.id);
        if (error) console.error('    削除エラー:', error.message);
        else console.log('    削除完了');
      }
    }
  }
}

// 「鈴川ありさ2」のような番号付きも確認
console.log('\n\n--- 名前に数字が付いているレコード ---');
const { data: numbered } = await supabase
  .from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', (shops || []).map(s => s.id))
  .like('name', '%2');

(numbered || []).forEach(t => {
  console.log(`  id=${t.id} | name="${t.name}" | shop=${t.shop_id} | image=${t.image_url ? '✓' : 'null'}`);
});

if (numbered?.length > 0) {
  console.log('\n⚠️  上記の「名前+2」レコードは手動で確認してから削除してください');
  console.log('  削除コマンド例:');
  numbered.forEach(t => console.log(`  node -e "...delete where id='${t.id}'"`));
}

console.log('\n✅ 完了');
