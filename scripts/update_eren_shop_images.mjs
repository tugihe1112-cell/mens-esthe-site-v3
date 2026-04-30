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

// 対象となる全店舗ID
const targetShopIds = [
  'tokyo_shibuya_eren',
  'tokyo_setagaya_eren_shimokita',
  'tokyo_setagaya_eren_soshigaya',
  'tokyo_setagaya_eren_kyodo',
  'tokyo_setagaya_shimokitazawa_eren'
];

// 設定するデータ
const updateData = {
  // ★ここに店舗画像のURLを入れてください
  image_url: "http://www.eren.tokyo/images/top_image.jpg", 
  // クチコミ吸収用のグループID
  group_id: "eren_group"
};

async function main() {
  console.log(`📸 エレン全${targetShopIds.length}店舗の画像とグループ設定を更新します...`);

  const { error } = await supabase
    .from('shops')
    .update({ 
      image_url: updateData.image_url,
      group_id: updateData.group_id
    })
    .in('id', targetShopIds);

  if (error) {
    console.error('❌ 更新エラー:', error.message);
  } else {
    console.log('✅ 全店舗の画像設定とグループ化（クチコミ共有準備）が完了しました！');
    console.log(`📍 設定画像URL: ${updateData.image_url}`);
    console.log(`📍 グループID: ${updateData.group_id}`);
  }

  console.log('\n🚀 ブラウザで各店舗のページを開き、画像が表示されているか確認してください。');
}

main();
