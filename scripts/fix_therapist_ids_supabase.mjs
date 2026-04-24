import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// .envから読む（dotenvなしで直接読む）
const envFile = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : '';
};
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_KEY = getEnv('VITE_SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ .envにVITE_SUPABASE_URLまたはVITE_SUPABASE_ANON_KEYが見つかりません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- public/data/therapists.json から正しいIDを取得 ---
const therapistsRaw = JSON.parse(fs.readFileSync('public/data/therapists.json', 'utf8'));
const allTherapists = Array.isArray(therapistsRaw) ? therapistsRaw : therapistsRaw.therapists;

// shop_idごとに正しいtherapist IDリストを作成
const byShopId = {};
allTherapists.forEach(t => {
  const sid = t.shop_id || t.shopId;
  if (sid) {
    if (!byShopId[sid]) byShopId[sid] = [];
    byShopId[sid].push(t.id);
  }
});

// --- 修正対象の2店舗 ---
const targets = [
  'tokyo_shinagawa_gotanda_yuru_spa',
  'tokyo_setagaya_futakotamagawa_mens_esthe_group',
];

async function main() {
  console.log('🔧 Supabaseのshopsテーブルを根本修正します...\n');
  for (const shopId of targets) {
    const correctIds = byShopId[shopId] || [];
    if (correctIds.length === 0) {
      console.warn(`⚠️  ${shopId}: therapists.jsonに対応するセラピストが見つかりません。スキップします。`);
      continue;
    }
    console.log(`📝 ${shopId}`);
    console.log(`   → 正しいセラピスト数: ${correctIds.length}名`);
    console.log(`   → 先頭ID例: ${correctIds[0]}`);

    // Supabaseのshopsテーブルを直接PATCH
    const { data, error } = await supabase
      .from('shops')
      .update({ therapists: correctIds })
      .eq('id', shopId)
      .select();

    if (error) {
      console.error(`❌ ${shopId} の更新に失敗:`, error.message);
    } else if (!data || data.length === 0) {
      console.warn(`⚠️  ${shopId}: 対象レコードが見つかりません（ID不一致の可能性）`);
    } else {
      console.log(`✅ ${shopId} → Supabase更新成功\n`);
    }
  }
  console.log('\n🎉 完了。次に npm run sync を実行してローカルに反映してください。');
}

main().catch(console.error);
