/**
 * ENEL (エネル) セラピスト登録 (広島5位)
 * 44名 / o-pack.jp CDN (slug: h_enel)
 * 実行: node scripts/maintenance/process_enel_hiroshima.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const CDN_BASE = 'https://img.o-pack.jp/shop/h_enel/images/';
const SHOP_ID = 'hiroshima_hiroshima_enel';

// 全角スペースは除去済みの表示名
const THERAPISTS = [
  { name: '月野のどか',       file: '177973101760551700.jpg' },
  { name: '仲瀬もも',         file: '177958876612926700.jpg' },
  { name: '白石ひより',       file: '177757636992937900.jpg' },
  { name: '木下れみ',         file: '177665478472893600.jpg' },
  { name: '桃瀬こころ',       file: '177470540519610900.jpg' },
  { name: '夢咲のあ',         file: '178020621434817400.jpg' },
  { name: '夏目るあ',         file: '177142759841323300.jpg' },
  { name: '山本かりん',       file: '177171021181190800.jpg' },
  { name: '瀬桜ゆん',         file: '176771238971019000.jpg' },
  { name: '桜井ももこ',       file: '177725416724654100.jpg' },
  { name: '大崎なつめ',       file: '176753799562037300.jpg' },
  { name: '夢乃さら',         file: '177716792171445200.jpg' },
  { name: '愛沢もか',         file: '178049057085696600.jpg' },
  { name: '新垣美奈',         file: '177725418290837100.jpg' },
  { name: '菊地あや',         file: '177658641280034200.jpg' },
  { name: '七条みお',         file: '177038180212288500.jpg' },
  { name: '夏海そら',         file: '177733522404756700.jpg' }, // 旧名: 木村
  { name: '黒崎れい',         file: '177002720124614600.jpg' },
  { name: '花街りん',         file: '177658638595136600.jpg' },
  { name: '星宮みくる',       file: '177287840247511100.jpg' },
  { name: '大塚そら',         file: '176356698029326500.jpg' },
  { name: '姫野うた',         file: '177725419902821000.jpg' },
  { name: '冬野ほのり',       file: '176753820022303500.jpg' },
  { name: '夏愛もな',         file: '177725426873472800.jpg' },
  { name: '藤咲ゆか',         file: '176753811511009400.jpg' },
  { name: '竹内ゆず',         file: '176753815507461900.jpg' },
  { name: '一条えみり',       file: '176753814185594500.jpg' },
  { name: '戦慄ゆらの',       file: '176753833454152700.jpg' },
  { name: '千賀まひろ',       file: '177725424805897900.jpg' },
  { name: '西川にこ',         file: '176753830814192900.jpg' },
  { name: '葉月ひな',         file: '177674656291487200.jpg' },
  { name: '矢野レモン',       file: '176753822939913500.jpg' },
  { name: '佐藤なな',         file: '176753824774923900.jpg' },
  { name: '椿えれな',         file: '176753835033359500.jpg' },
  { name: '朝比奈りの',       file: '177919818006054200.jpg' },
  { name: '優木いおり',       file: '177734061007394100.jpg' },
  { name: '望月ありす',       file: '176753832134286100.jpg' },
  { name: '矢吹このは',       file: '176753821606060100.jpg' },
  { name: '友紀りあ',         file: '176753804085141200.jpg' },
  { name: '南野かりん',       file: '177575483611518400.jpg' },
  { name: '森永ここあ',       file: '177788064792721100.jpg' },
  { name: '吉沢しおん',       file: '177942141457653600.jpg' },
  { name: '本条みくり',       file: '177725422270934300.jpg' },
  { name: '月城さき',         file: '176753826110891800.jpg' },
];

async function uploadImage(file) {
  const numericId = file.replace(/\.[^.]+$/, '');
  const storageKey = `enel_hiroshima_${numericId}.jpg`;
  const imgUrl = `${CDN_BASE}${file}`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://enel-official.com/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`  ✗ 取得失敗 ${file} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (error) { console.log(`  ✗ Storage失敗 ${file}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) { console.log(`  ✗ エラー ${file}: ${e.message}`); return null; }
}

const { data: shopData } = await supabase.from('shops').select('id,name').eq('id', SHOP_ID);
if (!shopData?.length) { console.error(`${SHOP_ID} not found in DB`); process.exit(1); }
console.log(`shop: ${shopData[0].name} (${SHOP_ID})`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', SHOP_ID);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) { console.log('既登録あり。--force で再実行'); process.exit(0); }

if (DRY_RUN) {
  THERAPISTS.forEach(t => console.log(`  [dry] ${t.name} <- ${CDN_BASE}${t.file}`));
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  const imageUrl = await uploadImage(t.file);
  const { error } = await supabase.from('therapists').insert({
    id: `${SHOP_ID}_${t.name}`,
    shop_id: SHOP_ID,
    name: t.name,
    image_url: imageUrl,
  });
  if (!error) { added++; process.stdout.write(imageUrl ? '.' : 'n'); }
  else { failed++; console.log(`\n  ! insert失敗 ${t.name}: ${error.message}`); }
  await new Promise(r => setTimeout(r, 300));
}
process.stdout.write('\n');
console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`);
