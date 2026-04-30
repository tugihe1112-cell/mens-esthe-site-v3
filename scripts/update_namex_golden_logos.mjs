import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// グループIDと新しいロゴ画像の対応表
const LOGO_UPDATES = {
  'g_red_ribbon': 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/NAMEX%20SPA.png', // NAMEX SPA
  'g_golden': 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/GOLDEN.png' // GOLDEN
};

async function main() {
  console.log('🚀 「NAMEX SPA」と「GOLDEN」のロゴ画像を更新します...\n');

  try {
    let totalUpdated = 0;

    // 1. Supabaseのデータ更新
    for (const [groupId, logoUrl] of Object.entries(LOGO_UPDATES)) {
      console.log(`⏳ グループID: ${groupId} のロゴを更新中...`);
      
      const { data, error: updateErr } = await supabase
        .from('shops')
        .update({ image_url: logoUrl })
        .eq('group_id', groupId)
        .select('id, name');

      if (updateErr) {
        console.error(`❌ ${groupId} の更新に失敗しました:`, updateErr.message);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`✅ 更新完了:`);
        data.forEach(shop => console.log(`   - ${shop.name}`));
        totalUpdated += data.length;
      }
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

    console.log(`\n🎉 合計 ${totalUpdated} 店舗のロゴ更新と同期が完了しました！`);
    console.log('ブラウザでスーパーリロード（Cmd + Shift + R）して、両店舗のロゴが新しくなっているかご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
