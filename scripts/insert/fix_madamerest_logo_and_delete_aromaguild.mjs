/**
 * MadameRest ロゴ設定 + アロマギルド津田沼 削除
 * 実行: node scripts/insert/fix_madamerest_logo_and_delete_aromaguild.mjs
 */
import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // 1. MadameRest ロゴ更新
  console.log('🖼️  MadameRest ロゴを更新中...');
  const r1 = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.chiba_chiba_madame_rest`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      image_url: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/MadameRest.png'
    })
  });
  console.log(r1.ok ? '   ✅ MadameRest ロゴ更新完了' : `   ❌ ${await r1.text()}`);

  // 2. アロマギルド therapists 削除
  console.log('\n🗑️  アロマギルド津田沼 therapists を削除中...');
  const r2 = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.chiba_tsudanuma_aroma_guild`, {
    method: 'DELETE', headers
  });
  console.log(r2.ok ? '   ✅ therapists 削除完了' : `   ❌ ${await r2.text()}`);

  // 3. アロマギルド shop 削除
  console.log('\n🗑️  アロマギルド津田沼 shop を削除中...');
  const r3 = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.chiba_tsudanuma_aroma_guild`, {
    method: 'DELETE', headers
  });
  console.log(r3.ok ? '   ✅ shop 削除完了' : `   ❌ ${await r3.text()}`);

  console.log('\n✅ 完了！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
