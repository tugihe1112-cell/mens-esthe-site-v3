/**
 * website_url あり・セラピスト0名の店舗一覧
 * 実行: node scripts/debug/list_unprocessed_shops.mjs
 */
import fs from 'fs';

async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // website_url あり店舗を全件取得
  const allRes = await fetch(`${supabaseUrl}/rest/v1/shops?website_url=not.is.null&select=id,name,website_url,image_url&order=id`, { headers: h });
  const allShops = await allRes.json();
  console.log(`website_url あり店舗: ${allShops.length}件\n`);

  const unprocessed = [];
  for (const shop of allShops) {
    const tRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id&limit=1`, { headers: h });
    const therapists = await tRes.json();
    if (therapists.length === 0) {
      unprocessed.push(shop);
    }
  }

  console.log(`=== 未処理店舗 (${unprocessed.length}件) ===`);
  unprocessed.forEach(s => {
    console.log(`[${s.id}]`);
    console.log(`  名前: ${s.name}`);
    console.log(`  URL:  ${s.website_url}`);
    console.log(`  ロゴ: ${s.image_url ? '✅' : '❌'}`);
  });
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
