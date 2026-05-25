import fs from 'fs';
async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // code4030 で検索
  for (const q of ['code4030', 'コード', 'オトナ', '4030']) {
    const r = await fetch(`${supabaseUrl}/rest/v1/shops?or=(name.ilike.%25${encodeURIComponent(q)}%25,website_url.ilike.%25${q}%25)&select=id,name,website_url,schedule_url,image_url`, { headers: h });
    const data = await r.json();
    if (data.length) {
      data.forEach(s => {
        console.log(`id: ${s.id}`);
        console.log(`  名前: ${s.name}`);
        console.log(`  website: ${s.website_url || '未設定'}`);
        console.log(`  schedule: ${s.schedule_url || '未設定'}`);
        console.log(`  ロゴ: ${s.image_url ? '✅' : '❌'}`);
      });
    }
  }
}
run().catch(e => console.error('❌', e.message));
