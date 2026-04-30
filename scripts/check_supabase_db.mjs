import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// .env ファイルからSupabaseの接続情報を取得
const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
  console.error('⚠️ .env ファイルが見つかりません。Supabaseに接続できません。');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
  console.error('⚠️ .env に VITE_SUPABASE_URL または VITE_SUPABASE_ANON_KEY が設定されていません。');
  process.exit(1);
}

const supabaseUrl = supabaseUrlMatch[1].trim();
const supabaseAnonKey = supabaseKeyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔗 Supabase DBに接続し、実際のデータを調査します...\n');

  // Lynx千葉店（ID: 1001 など）か、名前で検索
  const { data, error } = await supabase
    .from('shops')
    .select('id, name, image_url, website_url, raw_data')
    .ilike('name', '%Lynx%千葉%')
    .limit(1);

  if (error) {
    console.error('❌ DBクエリエラー:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ DBにLynx千葉店が見つかりませんでした。全店舗から1件取得します...');
    const { data: anyData } = await supabase.from('shops').select('id, name, image_url, website_url, raw_data').limit(1);
    if (anyData && anyData.length > 0) {
      displayShopData(anyData[0]);
    }
  } else {
    displayShopData(data[0]);
  }
}

function displayShopData(shop) {
  console.log(`[店舗名] ${shop.name} (DBのID: ${shop.id})`);
  console.log('--------------------------------------------------');
  console.log(`■ DBの独立カラム (ここが空だとアウト)`);
  console.log(`  - image_url    : ${shop.image_url || 'NULL (空っぽ)'}`);
  console.log(`  - website_url  : ${shop.website_url || 'NULL (空っぽ)'}`);
  console.log('\n■ DBの raw_data (JSONカラム) の中身');
  
  if (shop.raw_data) {
    const raw = typeof shop.raw_data === 'string' ? JSON.parse(shop.raw_data) : shop.raw_data;
    console.log(`  - raw_data.image      : ${raw.image || '設定なし'}`);
    console.log(`  - raw_data.image_url  : ${raw.image_url || '設定なし'}`);
    console.log(`  - raw_data.websiteUrl : ${raw.websiteUrl || '設定なし'}`);
    console.log(`  - raw_data.scheduleUrl: ${raw.scheduleUrl || '設定なし'}`);
  } else {
    console.log('  - raw_data: NULL (空っぽ)');
  }
}

main();
