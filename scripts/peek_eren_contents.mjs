import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🧐 捜索で見つかったERENデータの中身を具体的にチェックします...\n');

  // 1. DBの中身を具体的に見る
  console.log('--- [DB] shopsテーブルの中身 ---');
  const { data: dbShops } = await supabase.from('shops').select('*').ilike('id', '%eren%');
  dbShops?.forEach(s => {
    console.log(`📍 ID: ${s.id} (${s.name})`);
    console.log(`   - website_url: ${s.website_url || 'なし'}`);
    console.log(`   - schedule_url: ${s.schedule_url || 'なし'}`);
    console.log(`   - image_url: ${s.image_url || 'なし'}`);
  });

  // 2. ローカルファイルの中身を具体的に見る
  const localFiles = [
    'src/data/tokyo/setagaya/shimokitazawa/eren_shimokita.json',
    'src/data/tokyo/setagaya/kyodo/eren_kyodo.json',
    'src/data/tokyo/shibuya/yoyogi_harajuku/eren.json'
  ];

  console.log('\n--- [Local] JSONファイルの中身 ---');
  localFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      console.log(`📄 ファイル: ${file}`);
      console.log(`   - 名前: ${data.name}`);
      console.log(`   - スケジュール: ${data.schedule_link || data.scheduleUrl || 'なし'}`);
      const tCount = data.therapists?.filter(t => t.image || t.photo)?.length || 0;
      console.log(`   - 写真ありセラピスト数: ${tCount}名`);
    }
  });

  console.log('\n✅ 照合完了');
}

main();
