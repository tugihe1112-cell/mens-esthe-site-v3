/**
 * doigt de fee 全エリアのショップID確認
 * 実行: node scripts/debug/check_doigt_all_shops.mjs
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

  // doigt という名前を含む全ショップ
  const res = await fetch(
    `${supabaseUrl}/rest/v1/shops?name=like.%25doigt%25&select=id,name,website_url`,
    { headers: h }
  );
  const shops = await res.json();
  console.log(`doigt 関連ショップ: ${shops.length}件\n`);

  for (const shop of shops) {
    const tRes = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id`,
      { headers: h }
    );
    const therapists = await tRes.json();
    console.log(`  ${therapists.length}名 | ${shop.id}`);
    console.log(`      名前: ${shop.name}`);
  }

  // ID に "doigt" が含まれるショップ
  console.log('\n--- ID に doigt が含まれるショップ ---');
  const res2 = await fetch(
    `${supabaseUrl}/rest/v1/shops?id=like.%25doigt%25&select=id,name`,
    { headers: h }
  );
  const shops2 = await res2.json();
  for (const shop of shops2) {
    const tRes = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id`,
      { headers: h }
    );
    const therapists = await tRes.json();
    console.log(`  ${therapists.length}名 | ${shop.id} (${shop.name})`);
  }
}

run().catch(e => console.error('❌', e.message));
