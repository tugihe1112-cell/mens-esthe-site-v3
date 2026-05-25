/**
 * 存在しないshop_idに挿入されたdoigt孤立セラピスト削除
 * 実行: node scripts/debug/cleanup_orphan_doigt.mjs
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
  const h = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  const orphanShopIds = [
    'kanagawa_kawasaki_noborito_doigt_de_fee',
    'kanagawa_kawasaki_musashi_mizonokuchi_doigt_de_fee',
    'kanagawa_kawasaki_musashi_kosugi_doigt_de_fee',
  ];

  for (const shopId of orphanShopIds) {
    // まず何件あるか確認
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shopId}&select=id,name`,
      { headers: h }
    );
    const data = await checkRes.json();
    console.log(`${shopId}: ${data.length}件`);
    data.forEach(t => console.log(`  ${t.name}`));

    // 削除
    const delRes = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shopId}`,
      { method: 'DELETE', headers: h }
    );
    console.log(`  → 削除: ${delRes.ok ? '✅' : '❌'}\n`);
  }
}

run().catch(e => console.error('❌', e.message));
