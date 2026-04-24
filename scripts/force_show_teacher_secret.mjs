import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const MEGURO_SHOP_ID = 'tokyo_meguro_meguro_teacher_secret';

async function main() {
  console.log('🚀 「女教師の秘め事」を検索一覧に強制表示させるための修正を開始します...\n');

  try {
    // 1. 店舗の各種フラグとフォーマットを、GRACEと同じ「安全な状態」に強制更新
    const updateData = {
      is_active: true,                  // 確実に公開状態にする
      business_hours: '12:00～05:00', // 空文字やnullを防ぐ
      price_system: '70分 13,000円～',  // 一覧のカードに表示される簡易料金テキスト
      // ※ raw_data 内の system（詳細料金）は先ほど登録したままで維持します
    };

    console.log('⏳ 必須カラムを更新中...');
    const { error: updateErr } = await supabase
      .from('shops')
      .update(updateData)
      .eq('id', MEGURO_SHOP_ID);

    if (updateErr) throw updateErr;

    console.log(`✅ 必須フラグと表示用テキストの更新が完了しました！`);
    console.log('ブラウザで「Cmd + Shift + R」を押して、検索結果画面をスーパーリロードしてください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
