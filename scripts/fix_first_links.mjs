import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('⏳ 「新宿ファースト(First)」のリンク・システム・店舗画像を修正中...');

  const { data: shops, error: searchErr } = await supabase
    .from('shops')
    .select('id, name, raw_data')
    .or('name.ilike.%First%,name.ilike.%ファースト%');

  if (searchErr || !shops || shops.length === 0) {
    console.error('❌ 店舗が見つかりません。');
    return;
  }

  const shopId = shops[0].id;
  const currentRawData = shops[0].raw_data || {};

  const priceText = `【Day Time 12:00〜17:00】
70分コース: 10,000円
100分コース: 15,000円 (人気のお時間)
130分コース: 20,000円
160分コース: 25,000円
190分コース: 30,000円
延長30分: 6,000円

【Night Time 17:00〜29:00】
70分コース: 12,000円
100分コース: 17,000円 (人気のお時間)
130分コース: 22,000円
160分コース: 27,000円
190分コース: 32,000円
延長30分: 6,000円`;

  // 画面コンポーネントが `raw_data` の中を探しに行っても見つかるように全部乗せ
  const updatedRawData = {
    ...currentRawData,
    website_url: "https://esthe-first.com/",
    official_url: "https://esthe-first.com/",
    official_link: "https://esthe-first.com/",
    schedule_url: "https://esthe-first.com/schedule.html",
    schedule_link: "https://esthe-first.com/schedule.html",
    price_system: priceText,
    system: priceText,
    price: priceText,
    logo_url: "https://esthe-first.com/img/logo.png" // ← raw_dataの中なら安全に入ります
  };

  const { error: updateErr } = await supabase
    .from('shops')
    .update({
      website_url: "https://esthe-first.com/",
      schedule_url: "https://esthe-first.com/schedule.html",
      price_system: priceText,
      image_url: "https://esthe-first.com/img/logo.png", // ← DBに確実にある列だけを指定
      raw_data: updatedRawData
    })
    .eq('id', shopId);

  if (updateErr) {
    console.error('❌ 更新エラー:', updateErr.message);
  } else {
    console.log(`✅ ${shops[0].name} のリンク、料金システム、店舗画像を完全にセットしました！`);
  }
}

main();
