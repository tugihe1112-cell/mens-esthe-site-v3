import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「シルク」を全カラム取得で安全に検索します...\n');
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .or('name.ilike.%シルク%,name.ilike.%silk%');

    if (error) throw error;

    if (!shops || shops.length === 0) {
      console.log('⚠️ データベース全体から「シルク」が見つかりませんでした。完全に削除されています。');
      return;
    }

    console.log(`✅ ${shops.length} 件の店舗が見つかりました:\n`);
    shops.forEach((shop, index) => {
      console.log(`[${index + 1}] 店舗名: ${shop.name}`);
      console.log(`--- 登録されている全データ ---`);
      for (const [key, value] of Object.entries(shop)) {
        // 長すぎる値（画像URLなど）は少し省略して見やすくする
        const displayValue = String(value).length > 100 ? String(value).substring(0, 100) + '...' : value;
        console.log(`  ${key}: ${displayValue}`);
      }
      console.log('------------------------------\n');
    });

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
