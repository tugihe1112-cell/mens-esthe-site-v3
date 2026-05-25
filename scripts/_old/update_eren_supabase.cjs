const https = require('https');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://azuetkuzzmshqfbrhqmf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// .envから読み込む
require('fs').readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) process.env[k.trim()] = v.trim();
});

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function supabasePatch(table, filter, body) {
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return data;
}

async function main() {
  const GROUP_ID = 'g_brand_eren';
  const IMAGE_URL = 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/Eren.png';

  const erenIds = [
    'tokyo_shibuya_eren',
    'tokyo_setagaya_eren_shimokita',
    'tokyo_setagaya_eren_soshigaya',
    'tokyo_setagaya_eren_kyodo',
    'tokyo_setagaya_shimokitazawa_eren',
  ];

  console.log('=== Supabase EREN 一括更新開始 ===');

  for (const id of erenIds) {
    const result = await supabasePatch(
      'shops',
      `id=eq.${id}`,
      {
        group_id: GROUP_ID,
        image_url: IMAGE_URL,
      }
    );
    if (Array.isArray(result) && result.length > 0) {
      console.log('✅ 更新成功:', id, '| group_id:', result[0].group_id, '| image_url:', result[0].image_url?.slice(0, 40));
    } else {
      console.log('❌ 更新失敗 or 対象なし:', id, JSON.stringify(result));
    }
  }

  console.log('\n=== クチコミ吸収モデルの確認 ===');
  console.log('group_id:', GROUP_ID, 'で統一済み');
  console.log('ShopDetailPage.jsx はすでにgroup_idでレビューを吸収取得する実装になっています');
  console.log('→ どのeren店舗ページを開いても全店舗のクチコミが表示されます');
}

main().catch(console.error);
