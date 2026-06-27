import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// 1. unison系列の全店舗の group_id を確認
const { data: shops, error } = await supabase
  .from('shops')
  .select('id, name, group_id')
  .ilike('id', '%unison_spa');

if (error) { console.error(error); process.exit(1); }
console.log('■ unison系列の店舗とgroup_id:');
console.table(shops);

const groups = [...new Set(shops.map(s => s.group_id))];
console.log('ユニークgroup_id:', groups);
console.log(
  groups.length === 1 && groups[0]
    ? '✅ 全店舗が同じgroup_id → 口コミは系列内で共有される（どの店から書いても全店で表示）'
    : '⚠️ group_idが分かれている or null → 書いたshop_idの店にしか出ない（相模原に直接書く必要 / または先にgroup_idを揃える）'
);

// 2. 上野ゆいのthreadページが成立するか（therapistsレコードの存在確認）
const { data: ueno } = await supabase
  .from('therapists')
  .select('id, name, shop_id')
  .ilike('name', '%上野%ゆい%');
console.log('\n■ 上野ゆい のtherapistレコード（どのshop_idに紐づくか＝URLになる）:');
console.table(ueno);
