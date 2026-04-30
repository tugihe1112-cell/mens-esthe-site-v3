import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 指定された6区（墨田区、江東区、足立区、世田谷区、品川区、大田区）のサムネイル空店舗を抽出します...\n');

  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, image_url, raw_data')
    .order('id');

  if (error) {
    console.error('❌ エラー:', error.message);
    return;
  }

  // 6区のIDプレフィックス
  const targetWards = [
    'tokyo_sumida_',    // 墨田区
    'tokyo_koto_',      // 江東区
    'tokyo_adachi_',    // 足立区
    'tokyo_setagaya_',  // 世田谷区
    'tokyo_shinagawa_', // 品川区
    'tokyo_ota_'        // 大田区
  ];

  const targetShops = shops.filter(shop => {
    // 1. 指定された6区に該当するか判定
    const isTargetWard = targetWards.some(prefix => shop.id.startsWith(prefix));
    if (!isTargetWard) return false;

    // 2. サムネイルが完全に空かどうかの判定（前回の正しいロジック）
    const raw = shop.raw_data || {};
    const imgUrl = shop.image_url || '';
    const rawImage = raw.image || '';
    const rawImageUrl = raw.image_url || '';

    const hasValidImage = 
      (imgUrl && !imgUrl.includes('no_image')) ||
      (rawImage && rawImage !== '設定なし' && !rawImage.includes('no_image') && !rawImage.includes('placeholder')) ||
      (rawImageUrl && rawImageUrl !== '設定なし' && !rawImageUrl.includes('no_image') && !rawImageUrl.includes('placeholder'));

    // 有効な画像がなければ抽出
    return !hasValidImage;
  });

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🖼️ 対象6区のサムネイル空店舗: 【 ${targetShops.length} 件 】`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (targetShops.length > 0) {
    targetShops.forEach((s, i) => {
      console.log(`${String(i + 1).padStart(2, ' ')}. ${s.name}`);
      console.log(`    ID: ${s.id}`);
    });
    
    fs.writeFileSync('empty_thumbnails_6wards.json', JSON.stringify(targetShops, null, 2));
    console.log('\n✅ リストを `empty_thumbnails_6wards.json` に保存しました。');
  } else {
    console.log('🎉 対象6区にサムネイルが空の店舗はありませんでした。');
  }
}

main();
