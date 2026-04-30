import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 Supabaseの【therapistsテーブル】を直接調査します...\n');

  // 1. 荻窪の店舗IDを取得
  const { data: shops, error: shopErr } = await supabase
    .from('shops')
    .select('id, name')
    .ilike('name', '%荻窪%');

  if (shopErr || !shops || shops.length === 0) {
    console.log('❌ 荻窪の店舗がshopsテーブルから見つかりませんでした。');
    return;
  }

  const shopIds = shops.map(s => s.id);
  console.log(`✅ 荻窪関連の店舗を ${shops.length} 件確認しました。`);
  console.log(`   (ID例: ${shopIds[0]})\n`);

  // 2. その店舗IDに紐づくセラピストを検索
  const { data: therapists, error: tErr } = await supabase
    .from('therapists')
    .select('id, name, shop_id, image_url, raw_data')
    .in('shop_id', shopIds);

  if (tErr) {
    console.error('❌ セラピスト取得エラー:', tErr.message);
    return;
  }

  console.log(`✅ 荻窪の店舗に紐づくセラピストデータ: 【 計 ${therapists.length} 件 】\n`);

  if (therapists.length > 0) {
    console.log('■ セラピストデータのサンプル (1件目)');
    const sample = therapists[0];
    console.log(`  - データベースID: ${sample.id}`);
    console.log(`  - 名前: ${sample.name || sample.raw_data?.therapistName || '不明'}`);
    console.log(`  - 独立カラム image_url: ${sample.image_url || 'NULL'}`);
    console.log(`  - raw_data内の画像: ${sample.raw_data?.image || '設定なし'}`);

    // 実画像を持っているかどうかの集計
    const validImages = therapists.filter(t => {
      const img = t.image_url || t.raw_data?.image || '';
      return img && !img.includes('no_image') && !img.includes('placeholder') && img !== '設定なし';
    });

    console.log(`\n■ 荻窪のセラピストのうち、実画像を持っている人数: 【 ${validImages.length} / ${therapists.length} 名 】`);
    if (validImages.length > 0) {
      console.log(`   (画像のURL例: ${validImages[0].image_url || validImages[0].raw_data?.image})`);
    }
  }
}

main();
