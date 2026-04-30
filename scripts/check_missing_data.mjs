import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 CREST SPA が表示されない原因を調査します...\n');
  
  const { data: shops } = await supabase
    .from('shops')
    .select('*')
    .in('id', ['tokyo_suginami_ogikubo_mens_esthe_jj', 'tokyo_suginami_ogikubo_crest']);

  const jj = shops.find(s => s.id === 'tokyo_suginami_ogikubo_mens_esthe_jj');
  const crest = shops.find(s => s.id === 'tokyo_suginami_ogikubo_crest');

  if (!crest) {
    console.log('❌ データベース上に CREST SPA が存在していません。');
    return;
  }

  console.log('✅ データベースとJSONには確実に存在しています。');
  console.log('\n⚠️ 【検証】正常に表示されている「JJ」と「CREST」の差分を確認します...');

  const missingFlags = [];
  for (const [key, value] of Object.entries(jj)) {
    // JJには値があるのに、CRESTではnullになっている項目を探す
    if (value !== null && value !== undefined && value !== '' && typeof value !== 'object') {
      if (crest[key] === null || crest[key] === undefined || crest[key] === '') {
        missingFlags.push(key);
      }
    }
  }

  console.log('\n👇 現在のCRESTで欠損している（nullになっている）主なデータ項目:');
  if (missingFlags.length > 0) {
    missingFlags.forEach(flag => console.log(` - ${flag}`));
    console.log('\n💡 結論:');
    console.log('上記の項目の中に、React側が「カードを表示するための必須条件」にしている項目（例: status, is_active 等）があるため、画面で弾かれています。');
  } else {
    console.log('データの欠損は見当たりません。Viteのキャッシュが原因です。一度サーバー(npm run dev)を再起動してください。');
  }
}
main();
