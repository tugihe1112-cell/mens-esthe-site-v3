const fs = require('fs');
require('fs').readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const SHOP_ID = 'tokyo_shinjuku_shinjuku_first';

// 料金システム（コロン区切り、改行で複数行）
const priceSystem = [
  '【Day Time】12:00-17:00:',
  '70分コース:10,000円',
  '100分コース:15,000円',
  '130分コース:20,000円',
  '160分コース:25,000円',
  '190分コース:30,000円',
  '延長30分:6,000円',
  '【Night Time】17:00-29:00:',
  '70分コース:12,000円',
  '100分コース:17,000円',
  '130分コース:22,000円',
  '160分コース:27,000円',
  '190分コース:32,000円',
  '延長30分:6,000円',
].join('\n');

const updateData = {
  business_hours: '12:00-29:00',
  phone_number: '070-1559-0011',
  website_url: 'https://esthe-first.com/',
  schedule_url: 'https://esthe-first.com/schedule.html',
  price_system: priceSystem,
};

(async () => {
  const res = await fetch(
    `${url}/rest/v1/shops?id=eq.${SHOP_ID}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    }
  );
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    console.log('✅ 更新成功');
    console.log('  business_hours:', data[0].business_hours);
    console.log('  phone_number:', data[0].phone_number);
    console.log('  website_url:', data[0].website_url);
    console.log('  schedule_url:', data[0].schedule_url);
    console.log('  price_system: (先頭3行)');
    data[0].price_system?.split('\n').slice(0, 3).forEach(l => console.log('    ', l));
  } else {
    console.log('❌ 失敗:', JSON.stringify(data));
  }
})();
