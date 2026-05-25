import fs from 'fs';

async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // area 系テーブルをすべて試す
  const candidates = ['areas', 'sub_areas', 'mid_areas', 'small_areas', 'area_groups', 'districts', 'neighborhoods'];
  for (const t of candidates) {
    const r = await fetch(`${supabaseUrl}/rest/v1/${t}?limit=3&select=*`, { headers: h });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`\n✅ テーブル: ${t}`);
        console.log('カラム:', Object.keys(data[0]).join(', '));
        // 大阪のサンプル
        const osaka = data.find(d => JSON.stringify(d).includes('osaka') || JSON.stringify(d).includes('大阪'));
        console.log('サンプル:', JSON.stringify(osaka || data[0], null, 2).slice(0, 400));
      }
    }
  }

  // shop の area_id から大阪のエリアIDパターンを調査
  console.log('\n=== 大阪の area_id 一覧（ユニーク） ===');
  const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.osaka_*&select=area_id&order=area_id`, { headers: h });
  const shops = await r.json();
  const uniqueAreaIds = [...new Set(shops.map(s => s.area_id).filter(Boolean))];
  uniqueAreaIds.forEach(a => console.log(`  ${a}`));
  console.log(`\n合計: ${uniqueAreaIds.length}エリア`);
}
run().catch(e => console.error('❌', e.message));
