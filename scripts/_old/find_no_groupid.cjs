const fs = require('fs');

require('fs').readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function main() {
  // Supabaseから全店舗取得
  const res = await fetch(
    `${url}/rest/v1/shops?select=id,name,group_id,image_url&limit=2000`,
    { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
  );
  const shops = await res.json();

  // ① group_idがない店舗
  const noGroup = shops.filter(s => !s.group_id);

  // ② image_urlがない店舗
  const noImage = shops.filter(s => !s.image_url);

  // ③ 両方ない店舗
  const noBoth = shops.filter(s => !s.group_id && !s.image_url);

  console.log(`総店舗数: ${shops.length}`);
  console.log(`① group_idなし: ${noGroup.length}件`);
  console.log(`② image_urlなし: ${noImage.length}件`);
  console.log(`③ 両方なし: ${noBoth.length}件`);

  console.log('\n=== group_idなし店舗（先頭30件）===');
  noGroup.slice(0, 30).forEach(s => 
    console.log(`  ${s.id} | ${s.name}`)
  );

  // CSVで出力
  const rows = ['id,name,group_id,image_url'];
  noGroup.forEach(s => {
    rows.push([s.id, s.name, s.group_id || 'なし', s.image_url || 'なし'].join(','));
  });
  fs.writeFileSync('no_groupid_shops.csv', rows.join('\n'), 'utf8');
  console.log('\n✅ no_groupid_shops.csv に全件出力しました');
}

main().catch(console.error);
