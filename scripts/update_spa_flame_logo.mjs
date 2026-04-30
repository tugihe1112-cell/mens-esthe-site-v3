import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const GROUP_ID = 'g_spa_flame';
const LOGO_URL = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/spa%20flame.png';

async function main() {
  console.log('🚀 「Spa Flame」のロゴ画像を更新します...\n');

  try {
    // 1. Supabaseのデータ更新
    console.log(`⏳ Supabase のデータを更新中...`);
    const { data, error: updateErr } = await supabase
      .from('shops')
      .update({ image_url: LOGO_URL })
      .eq('group_id', GROUP_ID)
      .select('id, name');

    if (updateErr) throw updateErr;

    if (data && data.length > 0) {
      console.log(`✅ 更新完了:`);
      data.forEach(shop => console.log(`   - ${shop.name} (${shop.id})`));
    } else {
      console.log(`⚠️ 対象店舗が見つかりませんでした。`);
    }

    // 2. ローカルキャッシュの同期
    console.log('\n⏳ 最新のデータをローカルファイルに同期中...');
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

    console.log(`\n🎉 ロゴの更新と同期が完了しました！`);
    console.log('ブラウザでスーパーリロード（Cmd + Shift + R）して、ロゴが新しくなっているかご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
