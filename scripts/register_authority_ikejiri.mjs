import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const AREA_ID = 'tokyo_meguro_ikejiriohashi'; // 新設した池尻大橋エリア
const SHOP_ID = `${AREA_ID}_authority`;
const GROUP_ID = 'g_authority'; // 三軒茶屋店と共有

// 料金システム（三軒茶屋と同じ設定）
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
  console.log('🚀 「AUTHORITY (オーソリティ)」池尻大橋店の店舗登録を開始します...\n');

  try {
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
        city: '目黒区',
        area: '池尻大橋',
        address: '東京都目黒区池尻大橋エリア',
        system: SYSTEM_DATA
      }
    };

    console.log(`⏳ 店舗データ（ID: ${SHOP_ID}）を登録中...`);
    const { error: upsertErr } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
    
    if (upsertErr) throw upsertErr;

    console.log(`\n🎉 登録完了！「AUTHORITY」池尻大橋店が登録されました。`);
    console.log('セラピストは三軒茶屋店に紐付いていますが、同じグループIDなのでクチコミは共有されます。');
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）し、ブラウザでご確認ください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
