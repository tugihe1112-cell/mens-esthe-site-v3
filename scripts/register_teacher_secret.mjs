import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 店舗のID（ご自身のシステムに合わせて変更が必要であれば修正してください）
const SHOP_ID = 'tokyo_meguro_teacher_secret';

const SHOP_DATA = {
  id: SHOP_ID,
  name: '女教師の秘め事',
  area_id: 'tokyo_meguro', // 目黒エリアと仮定（必要に応じて変更）
  schedule_url: 'https://teachersecret2025.com/schedule',
  website_url: 'https://teachersecret2025.com',
  raw_data: {
    system: [
      {
        courseName: '基本指導リンパコース',
        description: 'リンパ少な目、お試しコース。',
        prices: [
          { time: '70分(初回)', price: '13,000円' },
          { time: '70分', price: '14,000円' },
          { time: '100分(初回)', price: '18,000円' },
          { time: '100分', price: '19,000円' }
        ]
      },
      {
        courseName: '徹底指導リンパ集中コース(特講付き)',
        description: 'オプション不要、濃密なディープリンパ集中コース。',
        prices: [
          { time: '70分(初回)', price: '17,000円' },
          { time: '70分', price: '18,000円' },
          { time: '100分(初回)', price: '22,000円' },
          { time: '100分', price: '23,000円' }
        ]
      }
    ]
  }
};

async function main() {
  console.log('🚀 「女教師の秘め事」の店舗情報を登録（更新）します...\n');

  try {
    const { data, error } = await supabase
      .from('shops')
      .upsert(SHOP_DATA, { onConflict: 'id' }) // IDが存在すれば更新、なければ挿入
      .select();

    if (error) throw error;

    console.log(`✅ 登録完了: ${data[0].name} (ID: ${data[0].id})`);
    console.log('スケジュールURLと料金システムが正常に保存されました。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err);
  }
}

main();
