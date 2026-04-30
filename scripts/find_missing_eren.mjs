import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🚨 ERENの消えたデータ（写真・リンク）を全方位から捜索します...\n');

  // 1. Supabaseの隠しカラムを捜索
  console.log('🔎 1. DBの shops テーブル全体（全カラム）を捜索...');
  const { data: shops } = await supabase.from('shops').select('*').ilike('id', '%eren%');
  let dbFound = false;
  if (shops) {
    shops.forEach(s => {
      Object.keys(s).forEach(k => {
        const val = JSON.stringify(s[k]);
        if (val && (val.includes('http') || val.includes('.jpg') || val.includes('.webp') || val.includes('.png'))) {
          if (k !== 'raw_data' && k !== 'logo_url') {
            console.log(`   🎯 DB発見: 店舗[${s.name}] のカラム [${k}] に画像/URLあり！`);
            dbFound = true;
          }
        }
      });
    });
  }
  if (!dbFound) console.log('   -> 見つかりませんでした。');

  // 2. DBの therapists テーブル全体を捜索 (IDの紐付けミスを疑う)
  console.log('\n🔎 2. DBの therapists テーブルを孤立データ含めて捜索...');
  const { data: therapists } = await supabase.from('therapists').select('*');
  let tFound = false;
  if (therapists) {
     const erenTs = therapists.filter(t => 
        (t.shop_id && t.shop_id.toLowerCase().includes('eren')) || 
        (t.name && t.name.toLowerCase().includes('eren'))
     );
     if (erenTs.length > 0) {
        console.log(`   🎯 孤立セラピスト発見！ ${erenTs.length}件のデータが therapists テーブルにありました！`);
        console.log(`      例: ${erenTs[0].name || '名前なし'} (shop_id: ${erenTs[0].shop_id})`);
        tFound = true;
     }
  }
  if (!tFound) console.log('   -> 見つかりませんでした。');

  // 3. ローカルの全てのJSONファイルを再帰的に捜索
  console.log('\n🔎 3. ローカルの全JSONファイルを横断検索...');
  function searchDeep(dir) {
    let found = false;
    if (!fs.existsSync(dir)) return false;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (searchDeep(fullPath)) found = true;
      } else if (fullPath.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // ERENという文字と、URL/画像の拡張子が同じファイルに存在するか
        if (content.toLowerCase().includes('eren') || content.includes('エレン')) {
          if (content.includes('http') || content.includes('.jpg') || content.includes('.png') || content.includes('.webp')) {
             console.log(`   🎯 怪しいファイル発見: ${fullPath} (ERENとURL/画像が両方含まれています)`);
             found = true;
          }
        }
      }
    }
    return found;
  }
  if (!searchDeep('src')) {
     console.log('   -> src フォルダ内の全JSONにも見つかりませんでした。');
  }

  console.log('\n✅ 捜索完了');
}

main();
