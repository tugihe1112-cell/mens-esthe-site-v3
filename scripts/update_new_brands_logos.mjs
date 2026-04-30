import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 各グループと新しいロゴ画像の対応表
const LOGO_UPDATES = {
  'g_authority': 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/AUTHORITY.png',
  'g_bqins': 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Bqins.png',
  'g_sanchabijin': 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/sancha%20bijin.png',
  'g_nanashi_spa': 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/774.png'
};

async function main() {
  console.log('🚀 新規追加されたブランドのロゴ画像を一括更新します...\n');

  try {
    let totalUpdated = 0;

    // 1. Supabaseのデータ更新
    for (const [groupId, logoUrl] of Object.entries(LOGO_UPDATES)) {
      console.log(`⏳ ${groupId} のロゴを更新中...`);
      
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
        console.log(`✅ ${data.length}店舗更新完了:`);
        data.forEach(shop => console.log(`  - ${shop.name}`));
        totalUpdated += data.length;
      }
    }

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

    console.log(`\n🎉 合計 ${totalUpdated} 店舗のロゴ更新と同期が完了しました！`);
    console.log('ブラウザをスーパーリロード（Cmd + Shift + R）して、各店舗のロゴが新しくなっているかご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
