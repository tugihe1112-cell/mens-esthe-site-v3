/**
 * Aroma Terrace（名古屋・栄）セラピスト写真修正
 * パターン: aroma-terrace.men-este.com/data/staff/{id}/stf_{hash}.webp
 * 実行: node scripts/maintenance/fix_aroma_terrace_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://aroma-terrace.men-este.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// 名前の年齢表記を除去
const cleanName = (n) => n.replace(/\s*\(\d+\).*/, '').replace(/\s+/g, '').trim();

const AROMA_TERRACE_DATA = [
  ['かな', `${BASE}/data/staff/239/stf_69d63612e151c.webp`],
  ['やよい', `${BASE}/data/staff/163/stf_6852f6d90a70a.webp`],
  ['えりか', `${BASE}/data/staff/236/stf_68971760af667.webp`],
  ['かりん', `${BASE}/data/staff/266/stf_68664ac2b6feb.webp`],
  ['ひめ', `${BASE}/data/staff/257/stf_68e14b269fafd.webp`],
  ['いお', `${BASE}/data/staff/360/stf_69847db6148f7.webp`],
  ['めあり', `${BASE}/data/staff/358/stf_69773da42058c.webp`],
  ['うに', `${BASE}/data/staff/276/stf_6883cdf82980f.webp`],
  ['ことり', `${BASE}/data/staff/251/stf_6929fceb75b5e.webp`],
  ['めい', `${BASE}/data/staff/134/stf_66d82bb614c08.webp`],
  ['かぐや', `${BASE}/data/staff/411/stf_6a021bcfbfbdc.webp`],
  ['いちご', `${BASE}/data/staff/409/stf_69fe10b2083e7.webp`],
  ['しずか', `${BASE}/data/staff/407/stf_69fe11bfd323e.webp`],
  ['さおり', `${BASE}/data/staff/404/stf_6a015ad53701b.webp`],
  ['ここみ', `${BASE}/data/staff/401/stf_69f5db4eae132.webp`],
  ['まどか', `${BASE}/data/staff/399/stf_69ee43bb19a27.webp`],
  ['はつね', `${BASE}/data/staff/406/stf_69f8a21b5f61d.webp`],
  ['あられ', `${BASE}/data/staff/397/stf_69e9d74eaa9a1.webp`],
  ['ちはや', `${BASE}/data/staff/405/stf_69fc6bbb9f8ba.webp`],
  ['たまき', `${BASE}/data/staff/398/stf_69ec8c98c0050.webp`],
  ['れいか', `${BASE}/data/staff/383/stf_69c587601caab.webp`],
  ['しゅうか', `${BASE}/data/staff/396/stf_69e498a5d5abd.webp`],
  ['かんな', `${BASE}/data/staff/395/stf_69e1177484887.webp`],
  ['える', `${BASE}/data/staff/393/stf_69e1178fc895b.webp`],
  ['かやの', `${BASE}/data/staff/392/stf_69e0c45d3ee7e.webp`],
  ['りぜ', `${BASE}/data/staff/391/stf_69da36453643a.webp`],
  ['ひばり', `${BASE}/data/staff/394/stf_69df29bc446fb.webp`],
  ['しあ', `${BASE}/data/staff/388/stf_69d77e001b983.webp`],
  ['あみか', `${BASE}/data/staff/387/stf_69d29478a45cf.webp`],
  ['わか', `${BASE}/data/staff/389/stf_69d0cff0d5a2f.webp`],
  ['あの', `${BASE}/data/staff/386/stf_69cde5c54e029.webp`],
  ['かるあ', `${BASE}/data/staff/384/stf_69d2631ae9185.webp`],
  ['きらり', `${BASE}/data/staff/273/stf_69d202bcddf2e.webp`],
  ['りんな', `${BASE}/data/staff/372/stf_69d90cba8e3ea.webp`],
  ['りず', `${BASE}/data/staff/380/stf_69f71eb6a406b.webp`],
  ['にぃな', `${BASE}/data/staff/373/stf_69a6b7413848a.webp`],
  ['ひより', `${BASE}/data/staff/370/stf_699d3f386ebaf.webp`],
  ['しほ', `${BASE}/data/staff/369/stf_6998501f1533a.webp`],
  ['ありさ', `${BASE}/data/staff/271/stf_68cfeb9444412.webp`],
  ['ほのか', `${BASE}/data/staff/190/stf_681601eec25de.webp`],
  ['まりん', `${BASE}/data/staff/111/stf_68b2b5a11df60.webp`],
  ['みおり', `${BASE}/data/staff/363/stf_69fb51e4617cb.webp`],
  ['かいり', `${BASE}/data/staff/371/stf_69a2d5a0a059b.webp`],
  ['のえる', `${BASE}/data/staff/284/stf_699d80eda6989.webp`],
  ['ふうか', `${BASE}/data/staff/347/stf_6968c11ccb76e.webp`],
  ['ちとせ', `${BASE}/data/staff/366/stf_698e104f02c46.webp`],
  ['いくみ', `${BASE}/data/staff/353/stf_69baa5821dd22.webp`],
  ['さら', `${BASE}/data/staff/44/stf_6854467e316e4.webp`],
  ['うみ', `${BASE}/data/staff/217/stf_694e4b0e2c110.webp`],
  ['はる', `${BASE}/data/staff/263/stf_6992094893788.webp`],
  ['さき', `${BASE}/data/staff/189/stf_69f592f3cb023.webp`],
  ['さゆり', `${BASE}/data/staff/349/stf_6949889baf7b9.webp`],
  ['むぎ', `${BASE}/data/staff/338/stf_692a9b509e2a8.webp`],
  ['らみ', `${BASE}/data/staff/335/stf_69236205a9e71.webp`],
  ['ゆらの', `${BASE}/data/staff/303/stf_68fc76a9bf2d9.webp`],
  ['あき', `${BASE}/data/staff/323/stf_6926dd09763fe.webp`],
  ['みりか', `${BASE}/data/staff/367/stf_698e10119e0ba.webp`],
  ['しき', `${BASE}/data/staff/356/stf_696e01ee1d3d9.webp`],
  ['いちか', `${BASE}/data/staff/204/stf_69985d14d21b7.webp`],
  ['みこ', `${BASE}/data/staff/245/stf_686a1f5f401d7.webp`],
  ['あこ', `${BASE}/data/staff/314/stf_68fcf8a78e86f.webp`],
  ['ともみ', `${BASE}/data/staff/359/stf_697716137ab91.webp`],
  ['ひなた', `${BASE}/data/staff/355/stf_696b76e63a21d.webp`],
  ['あん', `${BASE}/data/staff/188/stf_68d3a356c0843.webp`],
  ['そら', `${BASE}/data/staff/345/stf_69c78b0bf2922.webp`],
  ['せつな', `${BASE}/data/staff/339/stf_69291d4cb8f01.webp`],
  ['ゆん', `${BASE}/data/staff/310/stf_6914c485dfc20.webp`],
  ['ふゆ', `${BASE}/data/staff/137/stf_6999512e6783f.webp`],
  ['しの', `${BASE}/data/staff/344/stf_694583bf1362c.webp`],
  ['にじほ', `${BASE}/data/staff/368/stf_69959197f4070.webp`],
  ['すあ', `${BASE}/data/staff/318/stf_697763eb03ab8.webp`],
  ['ゆりあ', `${BASE}/data/staff/326/stf_692d4d04c4b62.webp`],
  ['うるみ', `${BASE}/data/staff/309/stf_68f3c42e13e79.webp`],
  ['いずみ', `${BASE}/data/staff/346/stf_6947a0549f5a8.webp`],
  ['なぎさ', `${BASE}/data/staff/341/stf_6942775ee46bb.webp`],
  ['さわ', `${BASE}/data/staff/321/stf_6908e5c118560.webp`],
  ['なな', `${BASE}/data/staff/28/stf_6911b10d72587.webp`],
  ['りり', `${BASE}/data/staff/118/stf_692f3a95f347d.webp`],
  ['なお', `${BASE}/data/staff/124/stf_6918adfeb6dde.webp`],
  ['ねむ', `${BASE}/data/staff/237/stf_692085d971c68.webp`],
  ['ひとみ', `${BASE}/data/staff/136/stf_68500c6357cc9.webp`],
  ['なの', `${BASE}/data/staff/288/stf_68fc82788eb12.webp`],
  ['あやか', `${BASE}/data/staff/232/stf_6813de328dc76.webp`],
  ['あんず', `${BASE}/data/staff/227/stf_68fcb9ce836be.webp`],
  ['もか', `${BASE}/data/staff/292/stf_68b88e7c9053d.webp`],
  ['るい', `${BASE}/data/staff/306/stf_69195725a4c28.webp`],
  ['つばさ', `${BASE}/data/staff/340/stf_69985c4162f04.webp`],
  ['よつは', `${BASE}/data/staff/307/stf_68f1145187cc3.webp`],
  ['りつき', `${BASE}/data/staff/330/stf_691959f75dc7a.webp`],
  ['ききょう', `${BASE}/data/staff/250/stf_6914c65c1dbb3.webp`],
  ['みるく', `${BASE}/data/staff/24/stf_66be69e57f454.webp`],
  ['らい', `${BASE}/data/staff/313/stf_68fd009b7b0cd.webp`],
  ['ななみ', `${BASE}/data/staff/332/stf_692b5e938f2c1.webp`],
  ['めぐみ', `${BASE}/data/staff/328/stf_6914d4af83460.webp`],
  ['りえ', `${BASE}/data/staff/337/stf_692aa89928bab.webp`],
  ['このみ', `${BASE}/data/staff/317/stf_6959070be4d78.webp`],
  ['れん', `${BASE}/data/staff/308/stf_68f08c2877b0d.webp`],
  ['ほと', `${BASE}/data/staff/312/stf_68fb4984bd0a4.webp`],
  ['しゅな', `${BASE}/data/staff/270/stf_68dcbc724ce6e.webp`],
  ['じゅりあ', `${BASE}/data/staff/299/stf_68de2336e699c.webp`],
  ['りな', `${BASE}/data/staff/248/stf_68f1363c02e88.webp`],
  ['えみ', `${BASE}/data/staff/300/stf_68de10535a924.webp`],
  ['れのん', `${BASE}/data/staff/390/stf_69e118836a6ab.webp`],
  ['せいか', `${BASE}/data/staff/325/stf_690e243c743be.webp`],
  ['ちあき', `${BASE}/data/staff/211/stf_69987af85a92d.webp`],
  ['まき', `${BASE}/data/staff/362/stf_6984d0b3e6521.webp`],
  ['れみな', `${BASE}/data/staff/361/stf_698876d8172e9.webp`],
  ['ゆずな', `${BASE}/data/staff/297/stf_692f3f9f4ce76.webp`],
  ['さりな', `${BASE}/data/staff/382/stf_69c58787e95fc.webp`],
  ['すず', `${BASE}/data/staff/259/stf_68cc21d7399ae.webp`],
  ['まい', `${BASE}/data/staff/282/stf_689dbbba40555.webp`],
  ['るか', `${BASE}/data/staff/209/stf_699f84898245c.webp`],
  ['ふたば', `${BASE}/data/staff/357/stf_6976076cf34c8.webp`],
  ['るあら', `${BASE}/data/staff/304/stf_68ea737287726.webp`],
  ['かずは', `${BASE}/data/staff/201/stf_686a17d86e968.webp`],
  ['まな', `${BASE}/data/staff/301/stf_693284e1859ad.webp`],
  ['もえ', `${BASE}/data/staff/79/stf_682efade2de88.webp`],
  ['なつき', `${BASE}/data/staff/231/stf_68274a76bba92.webp`],
  ['みな', `${BASE}/data/staff/278/stf_68fc191c254b4.webp`],
  ['うるは', `${BASE}/data/staff/254/stf_68530ee58c3ff.webp`],
  ['りょう', `${BASE}/data/staff/225/stf_67f5389923413.webp`],
  ['るり', `${BASE}/data/staff/29/stf_67167e45cff81.webp`],
  ['ゆき', `${BASE}/data/staff/53/stf_67d93850381bb.webp`],
  ['てぃな', `${BASE}/data/staff/219/stf_67d842d451525.webp`],
  ['きょうか', `${BASE}/data/staff/247/stf_6860ed5db12e9.webp`],
  ['ここあ', `${BASE}/data/staff/197/stf_6794dd5399864.webp`],
  ['ちさと', `${BASE}/data/staff/267/stf_68680e25b9224.webp`],
  ['みなみ', `${BASE}/data/staff/269/stf_686fe0ecc2c3a.webp`],
  ['まお', `${BASE}/data/staff/260/stf_685ce83cd67e6.webp`],
  ['まこ', `${BASE}/data/staff/185/stf_67e5e0fa87451.webp`],
  ['あいり', `${BASE}/data/staff/50/stf_67af5cd9d457d.webp`],
  ['みさき', `${BASE}/data/staff/207/stf_6855355264df1.webp`],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: ct, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

const { data: shops } = await supabase.from('shops')
  .select('id, name')
  .ilike('website_url', '%aroma-terrace.men-este%');

if (!shops || shops.length === 0) {
  console.log('Aroma Terraceの店舗が見つかりません');
  process.exit(1);
}
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  console.log(`【Aroma Terrace】 ${AROMA_TERRACE_DATA.length}名`);
  AROMA_TERRACE_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of AROMA_TERRACE_DATA) {
  const { data: therapists } = await supabase.from('therapists')
    .select('id, shop_id, image_url')
    .in('shop_id', shopIds)
    .eq('name', name);

  if (!therapists || therapists.length === 0) {
    process.stdout.write('?'); notFound++; continue;
  }

  const nullOnes = therapists.filter(t => !t.image_url);
  if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }

  const staffId = imageUrl.match(/\/staff\/(\d+)\//)?.[1] || name;
  const ext = imageUrl.split('.').pop();
  const fileName = `aroma_terrace_${staffId}.${ext}`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(100);

  for (const t of nullOnes) {
    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl ?? null })
      .eq('id', t.id);
    if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : 'n'); updated++; }
  }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
console.log('\n完了');
