import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const GROUP_ID = 'g_bqins';

// --------------------------------------------------
// 修正するテキストを指定してください
// 例: '60分 12,000円～ / 90分 16,000円～'
// --------------------------------------------------
const NEW_PRICE_TEXT = '60分 12,000円～'; 

async function main() {
  console.log('🚀 B-QINSのPRICE概要テキストを更新します...\n');

  try {
    // 1. データベースの更新
    console.log(`⏳ データベース(Supabase)の price_system を [${NEW_PRICE_TEXT}] に更新中...`);
    const { error: updateErr } = await supabase
      .from('shops')
      .update({ price_system: NEW_PRICE_TEXT })
      .eq('group_id', GROUP_ID);

    if (updateErr) throw updateErr;
    console.log('✅ データベースの更新が完了しました。');

    // 2. ローカルキャッシュの同期
    console.log('\n⏳ ローカルJSONへの同期を実行中...');
    const { data: allShops, error: fetchErr } = await supabase.from('shops').select('*');
    if (fetchErr) throw fetchErr;

    const paths = [
      path.resolve('src/data/shops.json'),
      path.resolve('public/data/shops.json')
    ];
    
    paths.forEach(p => {
      if (fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
        console.log(`✅ キャッシュ同期完了: ${p}`);
      }
    });

    console.log('\n🎉 更新と同期が完了しました！');
    console.log('ブラウザをスーパーリロード（Cmd + Shift + R）して、PRICEの横のテキストが変わったかご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
