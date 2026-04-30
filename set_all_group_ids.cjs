const fs = require('fs');

require('fs').readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const headers = {
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

async function main() {
  // 全店舗取得
  const res = await fetch(`${url}/rest/v1/shops?select=id,name,group_id&limit=2000`, { headers });
  const shops = await res.json();
  console.log('総店舗数:', shops.length);

  // group_idがない店舗だけ対象
  const targets = shops.filter(s => !s.group_id);
  console.log('group_idなし:', targets.length, '件');

  // brandIdをshop_idから推測（shops.jsonから取得）
  const localShops = JSON.parse(fs.readFileSync('./public/data/shops.json', 'utf8'));
  const brandMap = {};
  localShops.forEach(s => {
    if (s.brandId) brandMap[s.id] = s.brandId;
  });

  // group_idを決定
  // brandIdがあれば g_brand_xxx、なければ g_solo_xxx（単独店舗）
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const shop of targets) {
    const brandId = brandMap[shop.id];
    const groupId = brandId ? `g_brand_${brandId}` : `g_solo_${shop.id}`;

    const patchRes = await fetch(
      `${url}/rest/v1/shops?id=eq.${shop.id}`,
      { method: 'PATCH', headers, body: JSON.stringify({ group_id: groupId }) }
    );

    if (patchRes.ok) {
      successCount++;
      if (successCount % 50 === 0) console.log(`進捗: ${successCount}/${targets.length}`);
    } else {
      failCount++;
      console.log('❌ 失敗:', shop.id);
    }
  }

  console.log('\n=== 完了 ===');
  console.log('成功:', successCount, '件');
  console.log('失敗:', failCount, '件');
}

main().catch(console.error);
