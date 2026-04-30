import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('🔍 ERENに関するデータをDBから徹底調査します...\n');

  // 1. shops テーブルの調査
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, raw_data');

  if (error) {
    console.error('❌ shopsテーブルの取得エラー:', error.message);
    return;
  }

  // 大文字小文字、全角半角を問わずERENを含むものを抽出
  const erenShops = shops.filter(s => 
    s.name.toLowerCase().includes('eren') || 
    s.name.includes('エレン') || 
    s.id.toLowerCase().includes('eren')
  );

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🏢 DB(shops)内の該当店舗: ${erenShops.length}件`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const erenIds = [];

  erenShops.forEach(shop => {
    erenIds.push(shop.id);
    console.log(`\n📍 店舗名: ${shop.name}`);
    console.log(`   ID: ${shop.id}`);
    
    const raw = shop.raw_data || {};
    
    // スケジュールURLの様々なキー名をチェック
    const scheduleLink = raw.schedule_link || raw.scheduleUrl || raw.schedule || raw.link || '未設定';
    console.log(`   🗓 スケジュールリンク: ${scheduleLink}`);

    // raw_data内のセラピスト配列をチェック
    const therapists = raw.therapists || [];
    console.log(`   👩‍⚕️ セラピストデータ(raw_data内): ${therapists.length}件`);
    
    if (therapists.length > 0) {
      console.log(`      -> 先頭の例: [名前] ${therapists[0].name || 'なし'} / [画像] ${therapists[0].image || therapists[0].photo || therapists[0].img || 'なし'}`);
    }
  });

  if (erenIds.length === 0) {
    console.log('❌ ERENに該当する店舗がshopsテーブルに見つかりませんでした。');
    return;
  }

  // 2. therapists テーブルが独立して存在するか調査
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔍 独立した therapists テーブルの存在確認...`);
  
  const { data: dbTherapists, error: tError } = await supabase
    .from('therapists')
    .select('id, name, shop_id, image_url, photo_url')
    .in('shop_id', erenIds);

  if (tError) {
    console.log(`   -> therapists テーブルは存在しない、またはアクセスできませんでした。`);
  } else if (dbTherapists && dbTherapists.length > 0) {
    console.log(`   ⚠️ 独立した therapists テーブルにデータを発見しました！ (${dbTherapists.length}件)`);
    console.log(`   フロントエンドが raw_data ではなく、こちらを読み込んでいる可能性があります。`);
    
    const tCounts = {};
    dbTherapists.forEach(t => {
      tCounts[t.shop_id] = (tCounts[t.shop_id] || 0) + 1;
    });
    
    for (const [sId, count] of Object.entries(tCounts)) {
      console.log(`   - 店舗ID [${sId}] に ${count}件のセラピストが紐づいています。`);
      const sample = dbTherapists.find(t => t.shop_id === sId);
      console.log(`     -> 先頭の例: [名前] ${sample.name} / [画像] ${sample.image_url || sample.photo_url || 'なし'}`);
    }
  } else {
    console.log(`   -> therapists テーブルに該当店舗のデータはありませんでした。`);
  }

  console.log('\n✅ 調査完了');
}

main();
