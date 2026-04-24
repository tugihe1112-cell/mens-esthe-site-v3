import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const MEGURO_SHOP_ID = 'tokyo_meguro_meguro_teacher_secret';
const GOTANDA_SHOP_ID = 'tokyo_shinagawa_gotanda_teacher_secret';

// 仮のダミー画像URL（フロントエンドの弾き判定を突破するため）
const DUMMY_IMAGE_URL = 'https://placehold.jp/30d45a/ffffff/400x300.png?text=%E5%a5%B3%E6%95%99%E5%B8%AB%E3%81%AE%E7%A7%98%E3%82%81%E4%BA%8B';

async function main() {
  console.log('🚀 「女教師の秘め事」の非表示問題（画像null）を修正します...\n');

  try {
    const { error } = await supabase
      .from('shops')
      .update({ image_url: DUMMY_IMAGE_URL })
      .in('id', [MEGURO_SHOP_ID, GOTANDA_SHOP_ID]);

    if (error) throw error;

    console.log(`✅ 目黒店と五反田店の image_url に仮のロゴ画像を設定しました！`);
    console.log('ブラウザで「Cmd + Shift + R」を押してスーパーリロードし、表示されるか確認してください！');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
