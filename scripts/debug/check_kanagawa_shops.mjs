/**
 * 神奈川の店舗一覧と設定状況を確認
 * 実行: node scripts/debug/check_kanagawa_shops.mjs
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
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // 神奈川の全店舗取得
  const res = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.kanagawa_*&select=id,name,website_url,schedule_url,image_url,price_system,raw_data&order=id`, {
    headers
  });
  const shops = await res.json();

  console.log(`神奈川の店舗数: ${shops.length}\n`);
  console.log('='.repeat(80));

  for (const s of shops) {
    const websiteUrl = s.raw_data?.websiteUrl || s.website_url || '未設定';
    const hasLogo = s.image_url ? '✅' : '❌';
    const hasSchedule = s.schedule_url ? '✅' : '❌';
    const hasPrice = s.price_system ? '✅' : '❌';
    const hasWebsite = s.website_url ? '✅' : '❌';

    // セラピスト数を取得
    const tRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${s.id}&select=id`, { headers });
    const therapists = await tRes.json();
    const tCount = Array.isArray(therapists) ? therapists.length : 0;

    console.log(`\n【${s.name}】`);
    console.log(`  ID: ${s.id}`);
    console.log(`  URL: ${websiteUrl}`);
    console.log(`  ロゴ:${hasLogo} スケリンク:${hasSchedule} 料金:${hasPrice} サイト:${hasWebsite} セラピスト:${tCount}名`);
    if (s.raw_data?.websiteUrl && !s.website_url) {
      console.log(`  ⚠️  raw_data.websiteUrl あり → website_url 未設定`);
    }
  }
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
