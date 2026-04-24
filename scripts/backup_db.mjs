import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('📦 データベースのセーブ（バックアップ）を開始します...\n');

  try {
    console.log('⏳ shops テーブルのデータを取得中...');
    const { data: shops, error: shopsErr } = await supabase.from('shops').select('*');
    if (shopsErr) throw shopsErr;

    console.log('⏳ therapists テーブルのデータを取得中...');
    const { data: therapists, error: theraErr } = await supabase.from('therapists').select('*');
    if (theraErr) throw theraErr;

    const backupData = {
      saved_at: new Date().toISOString(),
      total_shops: shops.length,
      total_therapists: therapists.length,
      shops: shops,
      therapists: therapists
    };

    const fileName = `db_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)}.json`;
    fs.writeFileSync(fileName, JSON.stringify(backupData, null, 2));

    console.log(`\n🎉 データベースのセーブが完了しました！`);
    console.log(`📄 保存先: プロジェクト直下の ${fileName}`);
    console.log(`（店舗数: ${shops.length}件, セラピスト数: ${therapists.length}件）`);

  } catch (err) {
    console.error('❌ バックアップ中にエラーが発生しました:', err.message);
  }
}

main();
