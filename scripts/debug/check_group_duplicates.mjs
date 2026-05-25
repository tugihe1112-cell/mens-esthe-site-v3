/**
 * グループ内で同じセラピストが複数店舗に登録されていないか確認
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 複数店舗を持つグループを取得
const { data: shops } = await supabase
  .from('shops')
  .select('id, name, group_id')
  .not('group_id', 'is', null)
  .not('group_id', 'ilike', 'g_solo%');

// group_idでまとめる
const byGroup = {};
for (const s of shops || []) {
  if (!byGroup[s.group_id]) byGroup[s.group_id] = [];
  byGroup[s.group_id].push(s);
}

// 複数店舗のグループのみ
const multiGroups = Object.entries(byGroup).filter(([, stores]) => stores.length > 1);
console.log(`複数店舗グループ: ${multiGroups.length}件\n`);

for (const [groupId, stores] of multiGroups) {
  const shopIds = stores.map(s => s.id);

  const { data: therapists } = await supabase
    .from('therapists')
    .select('shop_id, name')
    .in('shop_id', shopIds);

  if (!therapists?.length) continue;

  // 名前の正規化
  const normName = s => (s || '').replace(/\s/g, '').replace(/　/g, '').trim();

  // 名前ごとに何店舗に登録されているか集計
  const nameToShops = {};
  for (const t of therapists) {
    const n = normName(t.name);
    if (!nameToShops[n]) nameToShops[n] = new Set();
    nameToShops[n].add(t.shop_id);
  }

  // 2店舗以上に登録されている名前を抽出
  const duplicates = Object.entries(nameToShops).filter(([, s]) => s.size > 1);

  if (duplicates.length > 0) {
    const totalTherapists = therapists.length;
    const uniqueNames = Object.keys(nameToShops).length;
    console.log(`【${groupId}】${stores.length}店舗 / 総登録: ${totalTherapists}件 / ユニーク名: ${uniqueNames}名`);
    console.log(`  → 重複あり: ${duplicates.length}名が複数店舗に登録`);
    stores.forEach(s => {
      const count = therapists.filter(t => t.shop_id === s.id).length;
      console.log(`    ${s.id}: ${count}名`);
    });
    console.log();
  }
}

console.log('確認完了');
