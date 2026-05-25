/**
 * 川崎エリア店舗の状況確認
 * 実行: node scripts/debug/check_kawasaki_shops.mjs
 */
import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // 川崎エリアの店舗を取得
  const res = await fetch(
    `${supabaseUrl}/rest/v1/shops?id=like.kanagawa_kawasaki_%25&select=id,name,website_url,schedule_url,image_url,raw_data`,
    { headers }
  );
  const shops = await res.json();
  if (!Array.isArray(shops)) {
    console.error('❌ APIエラー:', JSON.stringify(shops));
    process.exit(1);
  }

  console.log(`=== 川崎エリア店舗 (${shops.length}件) ===\n`);
  for (const s of shops) {
    const websiteUrl = s.website_url || s.raw_data?.websiteUrl || '';
    const scheduleUrl = s.schedule_url || '';
    const hasLogo = !!s.image_url;
    console.log(`【${s.name}】`);
    console.log(`  id: ${s.id}`);
    console.log(`  website: ${websiteUrl || '(未設定)'}`);
    console.log(`  schedule: ${scheduleUrl || '(未設定)'}`);
    console.log(`  logo: ${hasLogo ? '✅' : '❌'}`);
    console.log('');
  }

  // セラピスト数も確認
  console.log('=== セラピスト数 ===\n');
  for (const s of shops) {
    const tRes = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${s.id}&select=id`,
      { headers }
    );
    const therapists = await tRes.json();
    const count = Array.isArray(therapists) ? therapists.length : '?';
    console.log(`  ${s.name}: ${count}名`);
  }
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
