/**
 * 大阪エリア構造確認
 * 実行: node scripts/debug/check_osaka_areas.mjs
 */
import fs from 'fs';

async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

  // テーブル一覧確認のため areas テーブルを試す
  const tables = ['areas', 'area', 'regions', 'region', 'districts', 'district'];
  for (const t of tables) {
    const r = await fetch(`${supabaseUrl}/rest/v1/${t}?limit=3`, { headers: h });
    if (r.ok && r.status !== 404) {
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`\n✅ テーブル: ${t}`);
        console.log('カラム:', Object.keys(data[0]).join(', '));
        console.log('サンプル:', JSON.stringify(data[0], null, 2));
      }
    }
  }

  // shops テーブルの area 関連カラムを確認
  console.log('\n=== shops テーブルのエリア情報 ===');
  const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.osaka_*&select=*&limit=3`, { headers: h });
  const shops = await r.json();
  if (shops.length > 0) {
    console.log('カラム:', Object.keys(shops[0]).join(', '));
    console.log('サンプル:', JSON.stringify(shops[0], null, 2));
  }
}
run().catch(e => console.error('❌', e.message));
