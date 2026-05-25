const fs = require('fs');
require('fs').readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

(async () => {
  const res = await fetch(
    `${url}/rest/v1/therapists?shop_id=eq.tokyo_shinjuku_shinjuku_first&select=name,image_url`,
    { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
  );
  const data = await res.json();
  console.log('First現在のセラピスト数:', data.length);
  data.slice(0, 5).forEach(t => console.log(' ', t.name, '|', t.image_url?.slice(0, 50)));
})();
