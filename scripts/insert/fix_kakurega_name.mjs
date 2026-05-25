// 「新人割対応 美船」を正しい「美船」に修正
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_umeda_kakurega';
const OLD_ID = `${SHOP_ID}_新人割対応_美船`;
const NEW_ID = `${SHOP_ID}_美船`;

// 古いエントリ削除
await supabase.from('therapists').delete().eq('id', OLD_ID);
// 正しい名前で挿入 (画像なし - 新人プレースホルダーのため)
const { error } = await supabase.from('therapists').upsert({
  id: NEW_ID, shop_id: SHOP_ID, name: '美船', age: 42, height: 155,
});
if (error) console.log('エラー:', error.message);
else console.log('✅ 美船 修正完了');
