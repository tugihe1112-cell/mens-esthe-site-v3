/**
 * 川崎エリアの残り未処理ショップ確認
 * 実行: node scripts/debug/check_kawasaki_remaining.mjs
 */
import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // 川崎エリアの全ショップ取得
  const res = await fetch(
    `${supabaseUrl}/rest/v1/shops?id=like.kanagawa_kawasaki_%25&select=id,name,website_url,schedule_url,image_url`,
    { headers: h }
  );
  const shops = await res.json();
  console.log(`川崎エリアショップ総数: ${shops.length}\n`);

  // 各ショップのセラピスト数を確認
  const results = [];
  for (const shop of shops) {
    const tRes = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id,name`,
      { headers: h }
    );
    const therapists = await tRes.json();
    const count = therapists.length;
    const hasWebsite = !!shop.website_url;
    const hasSchedule = !!shop.schedule_url;
    const hasLogo = !!shop.image_url;
    const hasWrongName = therapists.some(t => /[a-z]+-[a-z]+/.test(t.name || ''));

    results.push({ id: shop.id, name: shop.name, count, hasWebsite, hasSchedule, hasLogo, hasWrongName });
  }

  // 表示
  console.log('=== セラピスト0名のショップ ===');
  results.filter(r => r.count === 0 && r.hasWebsite).forEach(r => {
    console.log(`  [要対応] ${r.id}`);
    console.log(`    名前: ${r.name} | ロゴ:${r.hasLogo?'✅':'❌'} スケ:${r.hasSchedule?'✅':'❌'}`);
  });

  console.log('\n=== セラピスト0名(websiteなし) ===');
  results.filter(r => r.count === 0 && !r.hasWebsite).forEach(r => {
    console.log(`  ${r.id} (${r.name})`);
  });

  console.log('\n=== セラピストあり（登録済）===');
  results.filter(r => r.count > 0).forEach(r => {
    const warn = r.hasWrongName ? ' ⚠️ 名前異常あり' : '';
    console.log(`  ✅ ${r.id}: ${r.count}名${warn}`);
  });

  console.log('\n=== 名前が英数字形式のセラピストがいるショップ ===');
  results.filter(r => r.hasWrongName).forEach(r => {
    console.log(`  ⚠️ ${r.id}: ${r.count}名中に異常名`);
  });
}

run().catch(e => console.error('❌', e.message));
