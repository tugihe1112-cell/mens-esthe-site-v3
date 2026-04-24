import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「癒しの空間 Annex」の登録エリアを確認します...\n');
  
  // "上野"または"癒しの空間"で既存店舗を検索
  const { data, error } = await supabase
    .from('shops')
    .select('id, name, area_id')
    .or('name.ilike.%癒しの空間%,area_id.ilike.%ueno%');

  if (error) {
    console.error('エラー:', error.message);
  } else if (data && data.length > 0) {
    console.log('▼ 関連する既存の店舗・エリアID:');
    data.forEach(shop => console.log(`  - ${shop.name} (${shop.area_id})`));
  } else {
    console.log('関連する店舗は見つかりませんでした。上野エリア (tokyo_taito_ueno) をベースに作成可能です。');
  }
}
main();
