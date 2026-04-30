import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
  console.error('⚠️ .env ファイルが見つかりません。');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 Supabase DBから image_url が「空」の店舗を抽出しています...\n');

  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, image_url')
    .order('id');

  if (error) {
    console.error('❌ エラー:', error.message);
    return;
  }

  // image_urlが null、空文字、または no_image を含んでいるものを抽出
  const emptyImageShops = shops.filter(shop => {
    const img = shop.image_url;
    return !img || img.trim() === '' || img.includes('no_image');
  });

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🖼️ image_url が空の店舗: 【 ${emptyImageShops.length} 件 】 / 全 ${shops.length} 件`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (emptyImageShops.length > 0) {
    emptyImageShops.forEach((s, i) => {
      console.log(`${String(i + 1).padStart(3, ' ')}. ${s.name}`);
      console.log(`     ID: ${s.id}`);
    });

    // 作業用にファイルにも書き出しておく
    fs.writeFileSync('empty_image_shops.json', JSON.stringify(emptyImageShops, null, 2));
    console.log('\n✅ 全件のリストを `empty_image_shops.json` にも保存しました。');
  } else {
    console.log('🎉 image_url が空の店舗は1件もありませんでした！');
  }
}

main();
