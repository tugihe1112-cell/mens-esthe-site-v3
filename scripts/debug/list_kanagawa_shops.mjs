/**
 * 神奈川エリアの全店舗状況確認
 * 実行: node scripts/debug/list_kanagawa_shops.mjs
 */
import fs from 'fs';

async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // kanagawa_ で始まる店舗を全件取得
  const res = await fetch(
    `${supabaseUrl}/rest/v1/shops?id=like.kanagawa_*&select=id,name,website_url,schedule_url,image_url&order=id`,
    { headers: h }
  );
  const shops = await res.json();
  console.log(`神奈川エリア店舗数: ${shops.length}件\n`);

  let hasTherapists = 0, noTherapists = 0, noWebsite = 0;

  for (const shop of shops) {
    const tRes = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id&limit=1`,
      { headers: h }
    );
    const therapists = await tRes.json();
    const count = therapists.length;

    const logo = shop.image_url ? '✅' : '❌';
    const web = shop.website_url ? shop.website_url.slice(0, 40) : '未設定';
    const sch = shop.schedule_url ? '✅' : '❌';

    if (!shop.website_url) {
      noWebsite++;
      console.log(`[-] [${shop.id}]`);
      console.log(`    ${shop.name} | WEB:なし | ロゴ:${logo}`);
    } else if (count > 0) {
      hasTherapists++;
      // セラピスト数を取得
      const cntRes = await fetch(
        `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id`,
        { headers: h }
      );
      const all = await cntRes.json();
      console.log(`[✅] [${shop.id}]`);
      console.log(`    ${shop.name} | ${all.length}名 | ロゴ:${logo} | スケジュール:${sch}`);
    } else {
      noTherapists++;
      console.log(`[❌] [${shop.id}]`);
      console.log(`    ${shop.name} | セラピスト0名 | ロゴ:${logo} | スケジュール:${sch}`);
      console.log(`    URL: ${web}`);
    }
  }

  console.log(`\n===== 集計 =====`);
  console.log(`セラピストあり: ${hasTherapists}店`);
  console.log(`セラピスト未処理: ${noTherapists}店`);
  console.log(`WEBなし: ${noWebsite}店`);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
