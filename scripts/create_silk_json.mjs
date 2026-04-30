import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🚀 「Silk (シルク)」の完全なローカルJSONファイルを作成します...\n');
  try {
    const SHOP_ID = 'tokyo_shibuya_silk';
    
    // 1. SupabaseからSilkの最新データを取得
    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', SHOP_ID)
      .single();

    if (error || !shop) throw new Error('SupabaseからSilkのデータが取得できませんでした。');

    // エリアIDを確実に幡ヶ谷にしておく
    shop.area_id = 'tokyo_shibuya_hatagaya';
    
    // 2. 幡ヶ谷フォルダに個別JSONファイルを作成
    const silkJsonPath = path.resolve('src/data/tokyo/shibuya/hatagaya/silk.json');
    // フォルダがない場合は念のため作成（すでにあるはずですが）
    fs.mkdirSync(path.dirname(silkJsonPath), { recursive: true });
    
    fs.writeFileSync(silkJsonPath, JSON.stringify(shop, null, 2));
    console.log(`✅ 個別ファイルを作成しました: ${silkJsonPath}`);

    // 同様に public_data の方にも作成しておく（ログで見えたバックアップらしき場所）
    const backupJsonPath = path.resolve('src/data_backup_final/public_data/tokyo/shibuya/hatagaya/silk.json');
    if (fs.existsSync(path.dirname(backupJsonPath))) {
        fs.writeFileSync(backupJsonPath, JSON.stringify(shop, null, 2));
        console.log(`✅ バックアップファイルも作成しました: ${backupJsonPath}`);
    }

    // 3. 全店舗まとめ用JSON（shops.json 等）の再構築・同期
    console.log('⏳ 全店舗データ (shops.json等) を最新状態に同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    
    const targetFiles = [
      'src/data/shops.json',
      'public/data/shops.json'
    ];

    targetFiles.forEach(p => {
      const fullPath = path.resolve(p);
      if (fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, JSON.stringify(allShops, null, 2));
        console.log(`✅ ${p} を同期しました。`);
      }
    });

    console.log('\n🎉 全ての準備が整いました！');
    console.log('ブラウザをリロード（または npm run dev を再起動）して、幡ヶ谷エリアをご確認ください！');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
