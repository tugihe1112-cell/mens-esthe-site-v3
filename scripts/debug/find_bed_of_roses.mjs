import fs from 'fs';

async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // Bed of Roses / Sleeping Sheep を検索
  for (const q of ['roses', 'sheep', 'sleeping', 'bed']) {
    const r = await fetch(`${supabaseUrl}/rest/v1/shops?name=ilike.%25${q}%25&select=id,name,website_url,schedule_url,image_url`, { headers: h });
    const data = await r.json();
    if (data.length) {
      data.forEach(s => {
        console.log(`id: ${s.id}`);
        console.log(`  名前: ${s.name}`);
        console.log(`  website: ${s.website_url || '未設定'}`);
        console.log(`  schedule: ${s.schedule_url || '未設定'}`);
        console.log(`  logo: ${s.image_url ? '✅' : '❌'}`);
      });
    }
  }

  // website_url が設定されているのにセラピスト0名の店舗を全件表示
  console.log('\n=== website_urlあり・セラピスト0名の店舗 ===');
  const allRes = await fetch(`${supabaseUrl}/rest/v1/shops?website_url=not.is.null&select=id,name,website_url`, { headers: h });
  const allShops = await allRes.json();

  for (const shop of allShops) {
    const tRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id`, { headers: h });
    const therapists = await tRes.json();
    if (therapists.length === 0) {
      console.log(`  [未処理] ${shop.id}`);
      console.log(`    ${shop.name} | ${shop.website_url}`);
    }
  }
}

run().catch(e => console.error('❌', e.message));
