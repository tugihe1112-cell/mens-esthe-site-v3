import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 1. こころのゆりかご系列の店舗とgroup_id（id・name両方から拾って統合）
const byId = (await supabase.from('shops').select('id, name, group_id').ilike('id', '%kokoronoyurikago%')).data || [];
const byName = (await supabase.from('shops').select('id, name, group_id').ilike('name', '%ゆりかご%')).data || [];
const map = new Map();
[...byId, ...byName].forEach(s => map.set(s.id, s));
const shops = [...map.values()];
console.log('■ こころのゆりかご系列の店舗とgroup_id:');
console.table(shops);

const groups = [...new Set(shops.map(s => s.group_id))];
console.log('ユニークgroup_id:', groups);
console.log(
  groups.length === 1 && groups[0]
    ? '✅ 全店舗が同じgroup_id → 口コミは系列内で共有（1件書けば全店表示）'
    : '⚠️ group_idが分かれている or null → 書いたshop_idの店にしか出ない（SEO表示のある店に直接書く）'
);

// SEO表示のある本命ページの存在確認
console.log('\n■ SEO本命 osaka_umeda_kokoronoyurikago の有無:',
  shops.some(s => s.id === 'osaka_umeda_kokoronoyurikago') ? 'あり' : 'なし（idを要確認）');

// 2. 対象3嬢のtherapistレコード（id区切り・正式名・shop_idを確認）
for (const nm of ['聖琉', '聖瑠', '茉莉奈', '彩華']) {
  const { data } = await supabase
    .from('therapists')
    .select('id, name, shop_id')
    .ilike('name', `%${nm}%`);
  if (data && data.length) {
    console.log(`\n■ 「${nm}」のtherapistレコード:`);
    console.table(data);
  }
}
