/**
 * LOHAS 2店舗の修復結果を匿名公開API + 画像配信経路で検証する。
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf8');
const env = (key) =>
  envText
    .match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, '');

const supabase = createClient(env('VITE_SUPABASE_URL'), env('VITE_SUPABASE_ANON_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EXPECTED = new Map([
  ['ishikawa_kanazawa_lohas', 31],
  ['okinawa_naha_lohas', 25],
]);

async function headOk(url) {
  const response = await fetch(url, {
    method: 'HEAD',
    signal: AbortSignal.timeout(15_000),
  });
  return response.ok && (response.headers.get('content-type') || '').startsWith('image/');
}

async function main() {
  const summary = [];
  for (const [shopId, expected] of EXPECTED) {
    const { data, error } = await supabase
      .from('therapists')
      .select('id,name,image_url,profile_image,raw_data')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('id');
    if (error) throw error;
    if ((data || []).length !== expected) {
      throw new Error(`${shopId}: 匿名公開人数 ${data?.length || 0}/${expected}`);
    }
    if ((data || []).some((row) => !row.image_url || row.image_url !== row.profile_image)) {
      throw new Error(`${shopId}: 写真未設定またはprofile_image不一致`);
    }
    if ((data || []).some((row) => /\/lohas_\d+\.(?:jpe?g|png|webp)$/i.test(row.image_url))) {
      throw new Error(`${shopId}: 衝突する旧R2キーが残っています`);
    }
    const delivery = await Promise.all((data || []).map((row) => headOk(row.image_url)));
    if (delivery.some((ok) => !ok)) {
      throw new Error(`${shopId}: 画像配信NG ${delivery.filter((ok) => !ok).length}件`);
    }
    summary.push({
      shopId,
      publicActive: data.length,
      imageDeliveryOk: delivery.filter(Boolean).length,
      officialSourceRows: data.filter((row) => /^https?:\/\//.test(row.raw_data?.source || '')).length,
    });
  }
  console.log(JSON.stringify(summary, null, 2));
  console.log('✅ LOHAS匿名公開・固有URL・画像配信を確認しました');
}

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
