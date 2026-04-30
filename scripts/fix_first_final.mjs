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
  console.log('⏳ 「新宿ファースト」のシステム情報を正しい形式で上書きします...');

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

  // コロン(:)で左右に分割されることを前提とした美しいフォーマット
  const formattedPrice = `【Day Time 12:00〜17:00】: 
70分コース: 10,000円
100分コース (人気): 15,000円
130分コース: 20,000円
160分コース: 25,000円
190分コース: 30,000円
延長30分: 6,000円
【Night Time 17:00〜29:00】: 
70分コース: 12,000円
100分コース (人気): 17,000円
130分コース: 22,000円
160分コース: 27,000円
190分コース: 32,000円
延長30分: 6,000円`;

  const updatedRawData = {
    ...currentRawData,
    websiteUrl: "https://esthe-first.com/",
    scheduleUrl: "https://esthe-first.com/schedule.html",
    hours: "12:00-29:00",
    phone: "070-1559-0011"
  };

  const { error: updateErr } = await supabase
    .from('shops')
    .update({
      business_hours: "12:00-29:00",
      phone_number: "070-1559-0011",
      website_url: "https://esthe-first.com/",
      schedule_url: "https://esthe-first.com/schedule.html",
      price_system: formattedPrice,
      raw_data: updatedRawData
    })
    .eq('id', shopId);

  if (updateErr) {
    console.error('❌ 更新エラー:', updateErr.message);
  } else {
    console.log(`✅ ${shops[0].name} の営業時間・電話番号・料金表・リンクを更新しました！`);
  }
}

main();
