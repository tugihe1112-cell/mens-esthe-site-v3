import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log("🔍 セラピストの在籍状況（is_active）を調査します...\n");

  const { data, error } = await supabase
    .from('therapists')
    .select('id, name, is_active, last_seen_at');

  if (error) {
    console.error('❌ エラー:', error);
    return;
  }

  const total = data.length;
  const activeCount = data.filter(t => t.is_active === true).length;
  const inactiveCount = data.filter(t => t.is_active === false).length;
  const nullActiveCount = data.filter(t => t.is_active === null).length;

  console.log(`📊 全セラピスト登録数: ${total}件`);
  console.log(`🟢 is_active = true (在籍中): ${activeCount}件`);
  console.log(`🔴 is_active = false (退店/非表示): ${inactiveCount}件`);
  if (nullActiveCount > 0) {
    console.log(`⚪️ is_active = null (未設定): ${nullActiveCount}件`);
  }

  // 直近のデータサンプルを3件表示
  console.log("\n📄 データサンプル（直近3件）:");
  console.log(data.slice(0, 3).map(t => ({
    name: t.name,
    is_active: t.is_active,
    last_seen_at: t.last_seen_at
  })));
}

main();
