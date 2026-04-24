import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const targetUrl = 'https://grace-meguro.com/';
  console.log(`🔍 URL: ${targetUrl} を持つ店舗を検索中...\n`);

  try {
    // schedule_url または website_url に指定のURLが含まれる店舗を取得
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, schedule_url, website_url')
      .or(`schedule_url.ilike.%${targetUrl}%,website_url.ilike.%${targetUrl}%`);

    if (error) throw error;

    if (!shops || shops.length === 0) {
      console.log('⚠️ 対象のURLを持つ店舗は見つかりませんでした。');
    } else {
      console.log(`✅ ${shops.length} 件の店舗が見つかりました:`);
      shops.forEach(shop => {
        console.log(`----------------------------------------`);
        console.log(`店舗ID: ${shop.id}`);
        console.log(`現在の名称: ${shop.name}`);
        console.log(`スケジュールURL: ${shop.schedule_url}`);
        console.log(`----------------------------------------`);
      });
      console.log('\nこの店舗のみを修正対象とします。間違いなければ修正用のコードを作成します。');
    }

  } catch (err) {
    console.error('❌ エラーが発生しました:', err);
  }
}

main();
