import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔄 Supabaseの最新データから、サイト用のJSONを全自動生成します...');

  // 1. Supabaseから全店舗と全キャストを取得（数百店舗でも一瞬です）
  console.log('📦 DBからデータをダウンロード中...');
  const { data: shops, error: shopErr } = await supabase.from('shops').select('*');
  const { data: therapists, error: therapistErr } = await supabase.from('therapists').select('*');

  if (shopErr || therapistErr) {
    console.error('❌ DBからのデータ取得に失敗しました:', shopErr || therapistErr);
    return;
  }

  console.log(`✅ 店舗: ${shops.length}件、キャスト: ${therapists.length}件 を取得しました。`);

  // 2. フロントエンド（一覧画面）が読みやすい形にデータを結合・整形
  const formattedShops = shops.map(shop => {
    // この店舗に所属するキャストを抽出（グループIDがあれば系列店のキャストも吸収）
    const shopTherapists = therapists.filter(t => 
      t.shop_id === shop.id || (shop.group_id && t.shop_id && t.shop_id.includes(shop.group_id.replace('_group', '')))
    ).map(t => ({
      name: t.name,
      image_url: t.image_url || t.photo_url,
      photo: t.image_url || t.photo_url // 念のためプロパティを複数用意
    }));

    return {
      id: shop.id,
      name: shop.name,
      prefecture: shop.prefecture,
      city: shop.city,
      image_url: shop.image_url || shop.logo_url,
      schedule_url: shop.schedule_url || shop.website_url,
      group_id: shop.group_id,
      brand_id: shop.brand_id,
      therapists: shopTherapists,
      raw_data: {
        ...shop.raw_data,
        schedule_link: shop.schedule_url,
        therapists: shopTherapists
      }
    };
  });

  // 3. ローカルのJSONファイルを上書き更新
  const targetFiles = [
    'src/data/all_shops.json',
    'public/data/all_shops.json'
  ];

  targetFiles.forEach(file => {
    // ディレクトリが存在しない場合はスキップ
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) return;

    try {
      fs.writeFileSync(file, JSON.stringify(formattedShops, null, 2));
      console.log(`📝 ${file} を最新のDBデータで上書きしました！`);
    } catch (e) {
      console.error(`❌ ${file} の書き込みに失敗:`, e.message);
    }
  });

  console.log('\n🎉 JSONのビルドが完了しました！');
  console.log('💡 今後はDBを更新した後、このスクリプト(`node scripts/build_shops_json.mjs`)を実行するだけで全データが同期されます。');
}

main();
