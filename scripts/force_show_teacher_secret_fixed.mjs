import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const MEGURO_SHOP_ID = 'tokyo_meguro_meguro_teacher_secret';
const GOTANDA_SHOP_ID = 'tokyo_shinagawa_gotanda_teacher_secret';

async function main() {
  console.log('🚀 「女教師の秘め事」を検索一覧に表示させるための修正（再トライ）を開始します...\n');

  try {
    // 1. 店舗の表示用必須フォーマットを、GRACEと同じ「安全な状態」に更新
    const updateData = {
      business_hours: '12:00～05:00', // 一覧に表示される営業時間
      price_system: '70分 13,000円～',  // 一覧に表示される簡易料金
    };

    console.log('⏳ 必須カラムを更新中...');
    const { error: updateErr } = await supabase
      .from('shops')
      .update(updateData)
      .in('id', [MEGURO_SHOP_ID, GOTANDA_SHOP_ID]);

    if (updateErr) throw updateErr;

    console.log(`✅ 表示用テキスト（営業時間、料金）の更新が完了しました！`);
    console.log('ブラウザで「Cmd + Shift + R」を押して、目黒と五反田の検索結果画面をスーパーリロードしてください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
