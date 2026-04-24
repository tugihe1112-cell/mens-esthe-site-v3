import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 正しい世田谷区のエリアID
const AREA_ID = 'tokyo_setagaya_ikejiriohashi'; 
const SHOP_ID = `${AREA_ID}_authority`;
const GROUP_ID = 'g_authority'; 

const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: '画像から読み取った料金です',
    prices: [
      { time: '70min', price: '17,000円' },
      { time: '90min', price: '21,000円' },
      { time: '120min', price: '25,000円' },
      { time: '150min', price: '30,000円' }
    ]
  }
];

async function main() {
  console.log('🚀 「AUTHORITY」池尻大橋店のデータベース修正を開始します...\n');

  try {
    // 1. 誤った目黒区の店舗データを削除
    const wrongShopId = 'tokyo_meguro_ikejiriohashi_authority';
    await supabase.from('shops').delete().eq('id', wrongShopId);
    console.log(`🧹 誤ったエリア（目黒区）の店舗データを削除しました。`);

    // 2. 正しい世田谷区の店舗データを登録
    const shopData = {
      id: SHOP_ID,
      name: 'AUTHORITY (オーソリティ) 池尻大橋',
      area_id: AREA_ID,
      group_id: GROUP_ID, 
      schedule_url: 'https://www.me-authority.com/schedule/',
      website_url: 'https://www.me-authority.com/',
      business_hours: '営業時間要確認',
      price_system: '70分 17,000円～',
      image_url: 'https://placehold.jp/34495e/ffffff/400x300.png?text=AUTHORITY', 
      raw_data: {
        prefecture: '東京都',
        city: '世田谷区',
        area: '池尻大橋',
        address: '東京都世田谷区池尻大橋エリア',
        system: SYSTEM_DATA
      }
    };

    console.log(`⏳ 正しい店舗データ（ID: ${SHOP_ID}）を登録中...`);
    const { error: upsertErr } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
    
    if (upsertErr) throw upsertErr;

    console.log(`\n🎉 修正完了！「AUTHORITY」池尻大橋店が世田谷区として登録されました。`);
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）し、ブラウザをスーパーリロードしてください。世田谷区のメニュー内に表示されるはずです！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
