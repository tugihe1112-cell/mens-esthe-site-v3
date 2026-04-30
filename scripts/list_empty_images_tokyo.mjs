import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 Supabase DBから【東京都】の店舗で、写真が未設定のものを抽出します...\n');

  // IDが 'tokyo_' で始まる店舗を抽出
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, image_url')
    .ilike('id', 'tokyo_%')
    .order('id');

  if (error) {
    console.error('❌ エラー:', error.message);
    return;
  }

  // image_urlが null、空文字、no_image、またはロゴ画像のみ のものを抽出
  const emptyImageShops = shops.filter(shop => {
    const img = shop.image_url || '';
    return !img || img.trim() === '' || img.includes('no_image') || img.includes('shop-logos');
  });

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🖼️ 【東京】で写真未設定の店舗: 【 ${emptyImageShops.length} 件 】 / 東京全 ${shops.length} 件`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (emptyImageShops.length > 0) {
    emptyImageShops.forEach((s, i) => {
      console.log(`${String(i + 1).padStart(3, ' ')}. ${s.name}`);
      console.log(`     ID: ${s.id}`);
    });

    fs.writeFileSync('empty_image_shops_tokyo.json', JSON.stringify(emptyImageShops, null, 2));
    console.log('\n✅ 東京のリストを `empty_image_shops_tokyo.json` に保存しました。');
  } else {
    console.log('🎉 東京エリアで写真未設定の店舗はありませんでした！');
  }
}

main();
