import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log("🔍 DB構造の調査を開始します...\n");

  // 1. area_idの一覧を取得
  const { data: shops } = await supabase.from('shops').select('area_id');
  if (shops) {
    const areas = [...new Set(shops.map(s => s.area_id))].filter(Boolean);
    console.log("📂 現在使われている area_id 一覧:");
    console.log(areas);
  }

  // 2. therapistsテーブルの構造を1件取得して確認
  const { data: therapists } = await supabase.from('therapists').select('*').limit(1);
  if (therapists && therapists.length > 0) {
    console.log("\n👤 therapistsテーブルの1レコードの構造:");
    console.log(Object.keys(therapists[0]).map(key => `${key}: ${typeof therapists[0][key]}`));
  }
}
main();
