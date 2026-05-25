/**
 * 店舗削除スクリプト（閉店店舗用）
 * 使い方: node scripts/maintenance/delete_shop.mjs <shop_id>
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SHOP_ID = process.argv[2];
if (!SHOP_ID) {
  console.log('使い方: node scripts/maintenance/delete_shop.mjs <shop_id>');
  process.exit(1);
}

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

console.log(`[削除対象] ${SHOP_ID}`);

// 店舗情報確認
const { data: shop } = await supabase.from('shops').select('id,name').eq('id', SHOP_ID).single();
if (!shop) {
  console.log('❌ 店舗が見つかりません:', SHOP_ID);
  process.exit(1);
}
console.log(`店舗名: ${shop.name}`);

// セラピスト削除
const { error: e1, count: c1 } = await supabase.from('therapists').delete({ count: 'exact' }).eq('shop_id', SHOP_ID);
if (e1) console.log('⚠️ therapists削除エラー:', e1.message);
else console.log(`✅ therapists削除完了`);

// 店舗削除
const { error: e2 } = await supabase.from('shops').delete().eq('id', SHOP_ID);
if (e2) console.log('❌ shops削除エラー:', e2.message);
else console.log(`✅ shops削除完了: ${SHOP_ID}`);
