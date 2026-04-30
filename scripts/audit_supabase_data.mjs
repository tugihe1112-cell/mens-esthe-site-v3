import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('📊 Supabaseの全店舗データを監査中...\n');

  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, image_url, website_url, raw_data');

  if (error) {
    console.error('❌ エラー:', error.message);
    return;
  }

  const noThumbnail = [];
  const missingLinks = [];

  shops.forEach(shop => {
    const raw = shop.raw_data || {};
    
    // ① サムネイル判定: 
    // カラムの image_url がロゴ画像（/storage/v1/object/public/shop-logos/...）だけの場合や、
    // raw_data 側が「設定なし」の場合は「未設置」としてカウント
    const hasRealPhoto = (shop.image_url && !shop.image_url.includes('shop-logos')) || 
                         (raw.image && !raw.image.includes('placeholder') && raw.image !== '設定なし');
    
    if (!hasRealPhoto) {
      noThumbnail.push({ id: shop.id, name: shop.name });
    }

    // ② リンク判定: オフィシャル(website_url), スケジュール(raw.scheduleUrl), セラピスト(raw.castUrl)
    const hasOfficial = !!shop.website_url || (raw.websiteUrl && raw.websiteUrl !== '設定なし');
    const hasSchedule = !!raw.scheduleUrl && raw.scheduleUrl !== '設定なし';
    const hasCast = !!raw.castUrl && raw.castUrl !== '設定なし';

    if (!hasOfficial || !hasSchedule || !hasCast) {
      const missing = [];
      if (!hasOfficial) missing.push('オフィシャル');
      if (!hasSchedule) missing.push('スケジュール');
      if (!hasCast) missing.push('セラピスト');
      missingLinks.push({ id: shop.id, name: shop.name, missing });
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🖼️  店舗写真（実画像）が未設置: ${noThumbnail.length} / ${shops.length} 件`);
  console.log(`🔗  リンクのいずれかが欠損している: ${missingLinks.length} / ${shops.length} 件`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 詳細リストをファイルに保存
  const report = { noThumbnail, missingLinks };
  fs.writeFileSync('supabase_audit_report.json', JSON.stringify(report, null, 2));
  console.log('✅ 詳細リストを `supabase_audit_report.json` に書き出しました。');
  
  if (noThumbnail.length > 0) {
    console.log('\n未設置の例:');
    noThumbnail.slice(0, 5).forEach(s => console.log(` - ${s.name} (ID: ${s.id})`));
  }
}

main();
