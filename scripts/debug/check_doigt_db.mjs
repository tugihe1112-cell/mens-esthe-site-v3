/**
 * doigt de fee DB内容確認
 * 実行: node scripts/debug/check_doigt_db.mjs
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

  // doigt 系 shop_id のセラピスト一覧
  const targets = [
    'kanagawa_kawasaki_doigt_de_fee_5',
    'kanagawa_kawasaki_noborito_doigt_de_fee',
    'kanagawa_kawasaki_musashi_mizonokuchi_doigt_de_fee',
    'kanagawa_kawasaki_musashi_kosugi_doigt_de_fee',
  ];

  for (const shopId of targets) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shopId}&select=id,name,image_url`,
      { headers: h }
    );
    const data = await res.json();
    console.log(`\n=== ${shopId} (${data.length}名) ===`);
    (data || []).forEach(t => {
      console.log(`  id="${t.id}" name="${t.name}" img="${(t.image_url||'').slice(0,50)}"`);
    });
  }

  // スクリーンショットの名前 77404-* を持つセラピストを検索
  console.log('\n=== 77404-* 形式のセラピスト ===');
  const res2 = await fetch(
    `${supabaseUrl}/rest/v1/therapists?id=like.77404-%25&select=id,name,shop_id&limit=20`,
    { headers: h }
  );
  const data2 = await res2.json();
  console.log(`件数: ${(data2||[]).length}`);
  (data2||[]).forEach(t => console.log(`  shop=${t.shop_id} id=${t.id} name=${t.name}`));

  // name が "77404-" 形式のセラピスト
  console.log('\n=== name が英数字-名前 形式 ===');
  const res3 = await fetch(
    `${supabaseUrl}/rest/v1/therapists?name=like.%25-%25&select=id,name,shop_id&limit=10`,
    { headers: h }
  );
  const data3 = await res3.json();
  console.log(`件数: ${(data3||[]).length}`);
  (data3||[]).slice(0,10).forEach(t => console.log(`  shop=${t.shop_id} name=${t.name}`));
}

run().catch(e => console.error('❌', e.message));
