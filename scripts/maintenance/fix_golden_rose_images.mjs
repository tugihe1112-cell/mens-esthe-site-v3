/**
 * GOLDEN ROSE（ゴールデンローズ）名古屋・鶴舞 セラピスト写真修正
 * パターン: golden-rose.jp/fdata/0/staff/{id}/goldro_0_{id}_{n}_{ts}.jpg
 * 実行: node scripts/maintenance/fix_golden_rose_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://golden-rose.jp';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const GOLDEN_ROSE_DATA = [
  ['わかば', `${BASE}/fdata/0/staff/986/goldro_0_986_6_1778309286.jpg`],
  ['りこ', `${BASE}/fdata/0/staff/972/goldro_0_972_3_1776224952.jpg`],
  ['のん', `${BASE}/fdata/0/staff/988/goldro_0_988_1_1778500975.jpg`],
  ['あまね', `${BASE}/fdata/0/staff/985/goldro_0_985_1_1777555131.jpg`],
  ['るな', `${BASE}/fdata/0/staff/977/goldro_0_977_5_1776484411.jpg`],
  ['りんか', `${BASE}/fdata/0/staff/970/goldro_0_970_2_1777184141.jpg`],
  ['わかな', `${BASE}/fdata/0/staff/770/goldro_0_770_1_1742372873.jpg`],
  ['あいり', `${BASE}/fdata/0/staff/908/goldro_0_908_1_1764666325.jpg`],
  ['れい', `${BASE}/fdata/0/staff/956/goldro_0_956_3_1771864907.jpg`],
  ['める', `${BASE}/fdata/0/staff/976/goldro_0_976_4_1775892107.jpg`],
  ['つむぎ', `${BASE}/fdata/0/staff/752/goldro_0_752_1_1767279110.jpg`],
  ['らら', `${BASE}/fdata/0/staff/904/goldro_0_904_4_1773133792.jpg`],
  ['もえ', `${BASE}/fdata/0/staff/929/goldro_0_929_1_1768491975.jpg`],
  ['こまめ', `${BASE}/fdata/0/staff/619/goldro_0_619_4_1717912888.jpg`],
  ['かえ', `${BASE}/fdata/0/staff/874/goldro_0_874_8_1763342806.jpg`],
  ['翼', `${BASE}/fdata/0/staff/709/goldro_0_709_5_1745640199.jpg`],
  ['ことね', `${BASE}/fdata/0/staff/762/goldro_0_762_4_1750097441.jpg`],
  ['真白', `${BASE}/fdata/0/staff/860/goldro_0_860_1_1757095791.jpg`],
  ['みく', `${BASE}/fdata/0/staff/809/goldro_0_809_1_1753100844.jpg`],
  ['あさ', `${BASE}/fdata/0/staff/940/goldro_0_940_1_1770220330.jpg`],
  ['りおん', `${BASE}/fdata/0/staff/744/goldro_0_744_2_1739345414.jpg`],
  ['ののか', `${BASE}/fdata/0/staff/923/goldro_0_923_1_1767777122.jpg`],
  ['白石', `${BASE}/fdata/0/staff/2/goldro_0_2_1_1746561093.jpg`],
  ['一条', `${BASE}/fdata/0/staff/505/goldro_0_505_5_1706603683.jpg`],
  ['いおり', `${BASE}/fdata/0/staff/901/goldro_0_901_1_1774171475.jpg`],
  ['きほ', `${BASE}/fdata/0/staff/799/goldro_0_799_4_1746959726.jpg`],
  ['みり', `${BASE}/fdata/0/staff/840/goldro_0_840_1_1751977853.jpg`],
  ['つき', `${BASE}/fdata/0/staff/656/goldro_0_656_4_1757692562.jpg`],
  ['ひめ', `${BASE}/fdata/0/staff/678/goldro_0_678_2_1778177032.jpg`],
  ['さらん', `${BASE}/fdata/0/staff/728/goldro_0_728_2_1773933841.jpg`],
  ['まりあ', `${BASE}/fdata/0/staff/817/goldro_0_817_2_1764927577.jpg`],
  ['みゆう', `${BASE}/fdata/0/staff/916/goldro_0_916_2_1766063714.jpg`],
  ['ゆき', `${BASE}/fdata/0/staff/717/goldro_0_717_4_1744707918.jpg`],
  ['れみ', `${BASE}/fdata/0/staff/831/goldro_0_831_2_1755526035.jpg`],
  ['さら', `${BASE}/fdata/0/staff/854/goldro_0_854_14_1773065405.jpg`],
  ['あむ', `${BASE}/fdata/0/staff/572/goldro_0_572_5_1756795221.jpg`],
  ['ほの', `${BASE}/fdata/0/staff/963/goldro_0_963_6_1774329732.jpg`],
  ['ゆうき', `${BASE}/fdata/0/staff/859/goldro_0_859_1_1756724328.jpg`],
  ['さおり', `${BASE}/fdata/0/staff/903/goldro_0_903_6_1776257799.jpg`],
  ['ゆか', `${BASE}/fdata/0/staff/691/goldro_0_691_11_1776075680.jpg`],
  ['高木', `${BASE}/fdata/0/staff/647/goldro_0_647_3_1762827498.jpg`],
  ['にこ', `${BASE}/fdata/0/staff/982/goldro_0_982_3_1777522040.jpg`],
  ['はるか', `${BASE}/fdata/0/staff/655/goldro_0_655_1_1722819849.jpg`],
  ['らむ', `${BASE}/fdata/0/staff/948/goldro_0_948_2_1772698950.jpg`],
  ['みみ', `${BASE}/fdata/0/staff/957/goldro_0_957_2_1773586475.jpg`],
  ['えな', `${BASE}/fdata/0/staff/975/goldro_0_975_6_1776085634.jpg`],
  ['えり', `${BASE}/fdata/0/staff/789/goldro_0_789_1_1759913394.jpg`],
  ['すい', `${BASE}/fdata/0/staff/987/goldro_0_987_1_1778291775.jpg`],
  ['れいな', `${BASE}/fdata/0/staff/737/goldro_0_737_5_1758704778.jpg`],
  ['ももな', `${BASE}/fdata/0/staff/872/goldro_0_872_7_1770941000.jpg`],
  ['ゆきな', `${BASE}/fdata/0/staff/836/goldro_0_836_2_1752052059.jpg`],
  ['こころ', `${BASE}/fdata/0/staff/852/goldro_0_852_2_1758843048.jpg`],
  ['みか', `${BASE}/fdata/0/staff/433/goldro_0_433_1_1760012165.jpg`],
  ['こうこ', `${BASE}/fdata/0/staff/276/goldro_0_276_4_1745138587.jpg`],
  ['れん', `${BASE}/fdata/0/staff/984/goldro_0_984_1_1777575818.jpg`],
  ['美月', `${BASE}/fdata/0/staff/545/goldro_0_545_4_1753176454.jpg`],
  ['えま', `${BASE}/fdata/0/staff/876/goldro_0_876_3_1762830135.jpg`],
  ['あすな', `${BASE}/fdata/0/staff/514/goldro_0_514_4_1762827457.jpg`],
  ['りんね', `${BASE}/fdata/0/staff/623/goldro_0_623_4_1729754740.jpg`],
  ['まりか', `${BASE}/fdata/0/staff/663/goldro_0_663_2_1755796755.jpg`],
  ['さくら', `${BASE}/fdata/0/staff/93/goldro_0_93_2_1756499499.jpg`],
  ['ゆうか', `${BASE}/fdata/0/staff/962/goldro_0_962_4_1773519825.jpg`],
  ['まい', `${BASE}/fdata/0/staff/566/goldro_0_566_1_1710381266.jpg`],
  ['ゆん', `${BASE}/fdata/0/staff/870/goldro_0_870_2_1759136337.jpg`],
  ['ひな', `${BASE}/fdata/0/staff/955/goldro_0_955_1_1771855977.jpg`],
  ['かれん', `${BASE}/fdata/0/staff/939/goldro_0_939_1_1769976138.jpg`],
  ['はる', `${BASE}/fdata/0/staff/747/goldro_0_747_3_1776107995.jpg`],
  ['かんな', `${BASE}/fdata/0/staff/730/goldro_0_730_3_1762833649.jpg`],
  ['あやみ', `${BASE}/fdata/0/staff/980/goldro_0_980_1_1776688357.jpg`],
  ['あず', `${BASE}/fdata/0/staff/688/goldro_0_688_1_1745393698.jpg`],
  ['さつき', `${BASE}/fdata/0/staff/911/goldro_0_911_3_1765166628.jpg`],
  ['村松', `${BASE}/fdata/0/staff/839/goldro_0_839_1_1751977751.jpg`],
  ['しょうこ', `${BASE}/fdata/0/staff/882/goldro_0_882_2_1760794273.jpg`],
  ['あすか', `${BASE}/fdata/0/staff/915/goldro_0_915_2_1766913910.jpg`],
  ['ゆう', `${BASE}/fdata/0/staff/829/goldro_0_829_4_1770942052.jpg`],
  ['ここな', `${BASE}/fdata/0/staff/942/goldro_0_942_1_1770358853.jpg`],
  ['ゆめ', `${BASE}/fdata/0/staff/801/goldro_0_801_7_1754813441.jpg`],
  ['こはる', `${BASE}/fdata/0/staff/889/goldro_0_889_5_1775459457.jpg`],
  ['きらら', `${BASE}/fdata/0/staff/981/goldro_0_981_1_1777546478.jpg`],
  ['すみれ', `${BASE}/fdata/0/staff/983/goldro_0_983_1_1777450675.jpg`],
  ['新垣', `${BASE}/fdata/0/staff/109/goldro_0_109_8_1762825900.jpg`],
  ['さな', `${BASE}/fdata/0/staff/969/goldro_0_969_1_1775229513.jpg`],
  ['みなみ', `${BASE}/fdata/0/staff/787/goldro_0_787_2_1747785890.jpg`],
  ['りぼん', `${BASE}/fdata/0/staff/950/goldro_0_950_10_1777086228.jpg`],
  ['かりな', `${BASE}/fdata/0/staff/931/goldro_0_931_4_1768887162.jpg`],
  ['るう', `${BASE}/fdata/0/staff/967/goldro_0_967_3_1774591976.jpg`],
  ['ふたば', `${BASE}/fdata/0/staff/978/goldro_0_978_1_1776630711.jpg`],
  ['うさぎ', `${BASE}/fdata/0/staff/979/goldro_0_979_1_1776499860.jpg`],
  ['みらい', `${BASE}/fdata/0/staff/886/goldro_0_886_2_1761226606.jpg`],
  ['せな', `${BASE}/fdata/0/staff/765/goldro_0_765_1_1742436714.jpg`],
  ['さやか', `${BASE}/fdata/0/staff/849/goldro_0_849_9_1762832987.jpg`],
  ['本庄', `${BASE}/fdata/0/staff/520/goldro_0_520_1_1775064823.jpg`],
  ['のの', `${BASE}/fdata/0/staff/932/goldro_0_932_5_1770939182.jpg`],
  ['さき', `${BASE}/fdata/0/staff/966/goldro_0_966_1_1775049422.jpg`],
  ['ひかり', `${BASE}/fdata/0/staff/919/goldro_0_919_1_1766646790.jpg`],
  ['しずか', `${BASE}/fdata/0/staff/971/goldro_0_971_1_1775754888.jpg`],
  ['つくし', `${BASE}/fdata/0/staff/807/goldro_0_807_1_1762065011.jpg`],
  ['あおい', `${BASE}/fdata/0/staff/780/goldro_0_780_1_1744126764.jpg`],
  ['ねおん', `${BASE}/fdata/0/staff/914/goldro_0_914_4_1772041949.jpg`],
  ['さとみ', `${BASE}/fdata/0/staff/964/goldro_0_964_2_1774426098.jpg`],
  ['ゆい', `${BASE}/fdata/0/staff/845/goldro_0_845_1_1754369826.jpg`],
  ['まゆか', `${BASE}/fdata/0/staff/961/goldro_0_961_1_1773271527.jpg`],
  ['めゆ', `${BASE}/fdata/0/staff/951/goldro_0_951_1_1771578232.jpg`],
  ['浅倉', `${BASE}/fdata/0/staff/600/goldro_0_600_1_1734229715.jpg`],
  ['えりか', `${BASE}/fdata/0/staff/959/goldro_0_959_2_1772954563.jpg`],
  ['きら', `${BASE}/fdata/0/staff/943/goldro_0_943_3_1772995198.jpg`],
  ['まどか', `${BASE}/fdata/0/staff/953/goldro_0_953_1_1771765407.jpg`],
  ['まりえ', `${BASE}/fdata/0/staff/782/goldro_0_782_2_1744530561.jpg`],
  ['みさ', `${BASE}/fdata/0/staff/853/goldro_0_853_2_1756161259.jpg`],
  ['なぎさ', `${BASE}/fdata/0/staff/868/goldro_0_868_1_1757868284.jpg`],
  ['あい', `${BASE}/fdata/0/staff/611/goldro_0_611_5_1772586450.jpg`],
  ['のぞみ', `${BASE}/fdata/0/staff/952/goldro_0_952_1_1771668641.jpg`],
  ['はな', `${BASE}/fdata/0/staff/847/goldro_0_847_2_1763394560.jpg`],
  ['なな', `${BASE}/fdata/0/staff/954/goldro_0_954_1_1771727203.jpg`],
  ['なこ', `${BASE}/fdata/0/staff/946/goldro_0_946_2_1770725158.jpg`],
  ['ゆず', `${BASE}/fdata/0/staff/949/goldro_0_949_1_1770938066.jpg`],
  ['いぶき', `${BASE}/fdata/0/staff/613/goldro_0_613_7_1738779470.jpg`],
  ['かな', `${BASE}/fdata/0/staff/936/goldro_0_936_1_1769434667.jpg`],
  ['うめ', `${BASE}/fdata/0/staff/945/goldro_0_945_1_1770690988.jpg`],
  ['くるみ', `${BASE}/fdata/0/staff/756/goldro_0_756_1_1769438352.jpg`],
  ['えいこ', `${BASE}/fdata/0/staff/841/goldro_0_841_1_1752762730.jpg`],
  ['るる', `${BASE}/fdata/0/staff/881/goldro_0_881_2_1760177724.jpg`],
  ['りあ', `${BASE}/fdata/0/staff/899/goldro_0_899_3_1766064005.jpg`],
  ['まりん', `${BASE}/fdata/0/staff/896/goldro_0_896_1_1765168016.jpg`],
  ['いちか', `${BASE}/fdata/0/staff/534/goldro_0_534_1_1704619607.jpg`],
  ['しずく', `${BASE}/fdata/0/staff/930/goldro_0_930_1_1768639522.jpg`],
  ['きょうこ', `${BASE}/fdata/0/staff/830/goldro_0_830_3_1762833506.jpg`],
  ['ひの', `${BASE}/fdata/0/staff/727/goldro_0_727_1_1761791338.jpg`],
  ['みゆり', `${BASE}/fdata/0/staff/902/goldro_0_902_3_1763682433.jpg`],
  ['ゆかり', `${BASE}/fdata/0/staff/920/goldro_0_920_2_1768021214.jpg`],
  ['ちせ', `${BASE}/fdata/0/staff/609/goldro_0_609_1_1777743858.jpg`],
  ['ありす', `${BASE}/fdata/0/staff/922/goldro_0_922_1_1767693052.jpg`],
  ['ねね', `${BASE}/fdata/0/staff/863/goldro_0_863_3_1759661495.jpg`],
  ['きい', `${BASE}/fdata/0/staff/906/goldro_0_906_1_1764353625.jpg`],
  ['かりん', `${BASE}/fdata/0/staff/757/goldro_0_757_4_1749511299.jpg`],
  ['ほのか', `${BASE}/fdata/0/staff/909/goldro_0_909_1_1764834547.jpg`],
  ['あみ', `${BASE}/fdata/0/staff/379/goldro_0_379_4_1728764029.jpg`],
  ['めがみ', `${BASE}/fdata/0/staff/917/goldro_0_917_3_1767055706.jpg`],
  ['なのか', `${BASE}/fdata/0/staff/910/goldro_0_910_1_1764689136.jpg`],
  ['柚希', `${BASE}/fdata/0/staff/121/goldro_0_121_1_1658937407.jpg`],
  ['きこ', `${BASE}/fdata/0/staff/879/goldro_0_879_1_1759761193.jpg`],
  ['みる', `${BASE}/fdata/0/staff/868/goldro_0_868_1_1757868284.jpg`],
  ['めい', `${BASE}/fdata/0/staff/806/goldro_0_806_5_1746863424.jpg`],
  ['あめり', `${BASE}/fdata/0/staff/856/goldro_0_856_1_1756456099.jpg`],
  ['ひなの', `${BASE}/fdata/0/staff/583/goldro_0_583_3_1714728365.jpg`],
  ['るみか', `${BASE}/fdata/0/staff/796/goldro_0_796_1_1745673946.jpg`],
  ['ちる', `${BASE}/fdata/0/staff/850/goldro_0_850_1_1754858450.jpg`],
  ['あやか', `${BASE}/fdata/0/staff/750/goldro_0_750_2_1739466772.jpg`],
  ['ナミ', `${BASE}/fdata/0/staff/284/goldro_0_284_3_1666170732.jpg`],
  ['めぐ', `${BASE}/fdata/0/staff/811/goldro_0_811_2_1747662320.jpg`],
  ['りお', `${BASE}/fdata/0/staff/381/goldro_0_381_3_1737747363.jpg`],
  ['柊', `${BASE}/fdata/0/staff/354/goldro_0_354_5_1701621615.jpg`],
  ['しぶき', `${BASE}/fdata/0/staff/335/goldro_0_335_4_1673597887.jpg`],
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
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

const { data: shops } = await supabase.from('shops')
  .select('id, name')
  .ilike('website_url', '%golden-rose%');

if (!shops || shops.length === 0) {
  console.log('GOLDEN ROSEの店舗が見つかりません');
  process.exit(1);
}
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  console.log(`【GOLDEN ROSE】 ${GOLDEN_ROSE_DATA.length}名`);
  GOLDEN_ROSE_DATA.slice(0, 5).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, imageUrl] of GOLDEN_ROSE_DATA) {
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
  const fileName = `golden_rose_${staffId}.jpg`;
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
