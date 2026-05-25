import fs from 'fs';

const LOGO_URL = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/doigt%20de%20fee.png';

const SHOP_IDS = [
  'kanagawa_kawasaki_doigt_de_fee_5',
  'kanagawa_atsugi_doigt_de_fee',
  'tokyo_meguro_jiyugaoka_doigt_de_fee',
  'tokyo_ota_kamata_doigt_de_fee',
];

async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

  for (const shopId of SHOP_IDS) {
    const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${shopId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ image_url: LOGO_URL }),
    });
    console.log(`${shopId}: ${r.ok ? '✅' : `❌ ${await r.text()}`}`);
  }
  console.log('完了 ✅');
}

run().catch(e => console.error('❌', e.message));
