import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const MEGURO_SHOP_ID = 'tokyo_meguro_meguro_teacher_secret';
const GOTANDA_SHOP_ID = 'tokyo_shinagawa_gotanda_teacher_secret';

async function main() {
  console.log('🚀 「女教師の秘め事」のスクリーニング突破（エリア情報追加）を開始します...\n');

  try {
    // 1. 目黒店のデータを取得し、エリア情報を追加して更新
    console.log('⏳ 目黒店にエリア情報を追加中...');
    const { data: meguroData } = await supabase.from('shops').select('raw_data').eq('id', MEGURO_SHOP_ID).single();
    const currentMeguroRaw = meguroData?.raw_data || {};
    
    const newMeguroRaw = {
      ...currentMeguroRaw,    // 既存のデータ（料金システムなど）を維持
      prefecture: '東京都',
      city: '目黒区',
      area: '目黒',
      address: '東京都目黒区目黒エリア'
    };

    const { error: meguroErr } = await supabase.from('shops').update({ raw_data: newMeguroRaw }).eq('id', MEGURO_SHOP_ID);
    if (meguroErr) throw meguroErr;

    // 2. 五反田店のデータを取得し、エリア情報を追加して更新
    console.log('⏳ 五反田店にエリア情報を追加中...');
    const { data: gotandaData } = await supabase.from('shops').select('raw_data').eq('id', GOTANDA_SHOP_ID).single();
    const currentGotandaRaw = gotandaData?.raw_data || {};
    
    const newGotandaRaw = {
      ...currentGotandaRaw,   // 既存のデータを維持
      prefecture: '東京都',
      city: '品川区',        // 五反田は品川区
      area: '五反田',
      address: '東京都品川区五反田エリア'
    };

    const { error: gotandaErr } = await supabase.from('shops').update({ raw_data: newGotandaRaw }).eq('id', GOTANDA_SHOP_ID);
    if (gotandaErr) throw gotandaErr;

    console.log(`\n✅ エリア情報の追加が完了しました！`);
    console.log('ブラウザで「Cmd + Shift + R」を押して、検索結果画面をスーパーリロードしてください。');
    console.log('今度こそ「東京都 目黒」および「東京都 五反田」の検索で一覧に表示されるはずです！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
