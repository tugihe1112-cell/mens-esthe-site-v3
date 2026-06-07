/**
 * 武蔵小杉 残り3店舗 修正スクリプト
 *   - Amateras (アマテラス) 132名 挿入
 *   - SUPERNOVA (スーパーノバ) 72名 挿入
 *   - Revere Spa (リヴェールスパ) 31名 画像更新
 *
 * 実行:
 *   node scripts/maintenance/fix_musashikosugi_remaining.mjs --dry-run
 *   node scripts/maintenance/fix_musashikosugi_remaining.mjs
 *   node scripts/maintenance/fix_musashikosugi_remaining.mjs --shop amateras
 *   node scripts/maintenance/fix_musashikosugi_remaining.mjs --shop supernova
 *   node scripts/maintenance/fix_musashikosugi_remaining.mjs --shop revere
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();
const run = (n) => !shopArg || shopArg === n;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

async function uploadImage(imgUrl, key, referer) {
  if (!imgUrl) return null;
  try {
    const headers = { 'User-Agent': UA };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imgUrl, { headers });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('E'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

// ===== AMATERAS 132名 =====
const AMATERAS_THERAPISTS = [
  {name:'しおん',castId:'7713863',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1759352069_7713863.jpg'},
  {name:'きほ',castId:'6233300',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912350_6233300.jpg'},
  {name:'ひな',castId:'2069570',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912369_2069570.jpg'},
  {name:'みつり',castId:'3827086',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1777540528_3827086.jpg'},
  {name:'ひなた',castId:'6451443',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778471357_6451443.jpg'},
  {name:'もみじ',castId:'5185317',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779427385_5185317.jpg'},
  {name:'みか',castId:'3964476',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774052597_3964476.jpg'},
  {name:'まき',castId:'6053523',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1759971942_6053523.jpeg'},
  {name:'きらり',castId:'8014798',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1765862921_8014798.jpeg'},
  {name:'ありす',castId:'3641673',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754911907_3641673.jpg'},
  {name:'えみり',castId:'0866439',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1759853699_0866439.jpg'},
  {name:'かなは',castId:'2768752',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1764861277_2768752.jpeg'},
  {name:'きい',castId:'7286185',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1766395390_7286185.jpg'},
  {name:'みる',castId:'8883577',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1760251203_8883577.jpg'},
  {name:'らび',castId:'1613550',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1758608346_1613550.jpeg'},
  {name:'らん',castId:'1045829',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1759851479_1045829.jpg'},
  {name:'りお',castId:'4192451',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1760950990_4192451.jpg'},
  {name:'るりか',castId:'0450089',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1756821110_0450089.jpg'},
  {name:'たまき',castId:'5509927',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1755910718_5509927.jpg'},
  {name:'きなこ',castId:'9187139',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912247_9187139.jpg'},
  {name:'りか',castId:'3257188',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912300_3257188.jpg'},
  {name:'ひまり',castId:'8177789',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912137_8177789.jpg'},
  {name:'こなつ',castId:'3290701',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1761232077_3290701.jpg'},
  {name:'りま',castId:'6812705',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1761798264_6812705.jpg'},
  {name:'りいな',castId:'5003100',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774322066_5003100.jpg'},
  {name:'りつ',castId:'2001770',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1757528224_2001770.jpg'},
  {name:'あいな',castId:'6859916',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1769827583_6859916.jpg'},
  {name:'せいら',castId:'5996958',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912387_5996958.jpg'},
  {name:'ましろ',castId:'4717496',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1763871032_4717496.jpg'},
  {name:'あまね',castId:'2808513',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912421_2808513.jpg'},
  {name:'ねむ',castId:'9416380',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778649428_9416380.jpeg'},
  {name:'うみ',castId:'4667930',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1767087397_4667930.jpeg'},
  {name:'ななほ',castId:'0037041',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1766027596_0037041.jpg'},
  {name:'あみ',castId:'4858545',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754911944_4858545.jpg'},
  {name:'しほ',castId:'9516749',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912487_9516749.jpg'},
  {name:'せり',castId:'2285541',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912517_2285541.jpg'},
  {name:'かみり',castId:'2386821',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912553_2386821.jpg'},
  {name:'なえ',castId:'9705266',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912656_9705266.jpg'},
  {name:'ゆうり',castId:'9757767',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912709_9757767.jpg'},
  {name:'かれん',castId:'5778393',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772695831_5778393.jpeg'},
  {name:'さんご',castId:'0280891',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1764845809_0280891.jpeg'},
  {name:'つき',castId:'5939109',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1770609810_5939109.jpeg'},
  {name:'かなえ',castId:'4648529',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775481279_4648529.jpg'},
  {name:'ゆめ',castId:'8691238',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1768893476_8691238.jpg'},
  {name:'せな',castId:'7514608',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1770532588_7514608.jpeg'},
  {name:'いおり',castId:'5138461',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1764583636_5138461.jpg'},
  {name:'れいか',castId:'6869366',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1776340195_6869366.jpeg'},
  {name:'みみ',castId:'2208431',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754912037_2208431.jpg'},
  {name:'もも',castId:'8351973',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1766062727_8351973.jpeg'},
  {name:'にこ',castId:'2370315',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1754913181_2370315.jpg'},
  {name:'けい',castId:'2060583',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1756282764_2060583.jpg'},
  {name:'ゆり',castId:'7728046',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1768960431_7728046.jpeg'},
  {name:'らな',castId:'6252370',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779277099_6252370.jpeg'},
  {name:'りな',castId:'1113432',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1752840527_1113432.jpg'},
  {name:'りん',castId:'1752524',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1757586214_1752524.jpg'},
  {name:'わかな',castId:'8509780',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1757932484_8509780.jpg'},
  {name:'なぎさ',castId:'8012564',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1758354957_8012564.jpeg'},
  {name:'ゆき',castId:'2961240',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1758981426_2961240.jpg'},
  {name:'ほのか',castId:'3539711',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1759221692_3539711.jpg'},
  {name:'ぴあの',castId:'9001321',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1770971902_9001321.jpeg'},
  {name:'かな',castId:'2426881',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1759720094_2426881.jpeg'},
  {name:'にな',castId:'3393452',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1765460989_3393452.jpeg'},
  {name:'ななお',castId:'8539142',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1766970819_8539142.jpeg'},
  {name:'この',castId:'3346152',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1761715904_3346152.jpeg'},
  {name:'ここ',castId:'2096373',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1762132470_2096373.jpg'},
  {name:'ゆみ',castId:'0823249',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1780053073_0823249.jpeg'},
  {name:'みお',castId:'1647424',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773641054_1647424.jpeg'},
  {name:'るる',castId:'7797152',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773063483_7797152.jpeg'},
  {name:'ひなの',castId:'4962326',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775978973_4962326.jpeg'},
  {name:'あやか',castId:'2966211',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1766669159_2966211.jpg'},
  {name:'りぼん',castId:'6583204',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1780483995_6583204.jpeg'},
  {name:'あやね',castId:'5836896',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1767278178_5836896.jpeg'},
  {name:'しずく',castId:'8982647',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1767969531_8982647.jpg'},
  {name:'もち',castId:'2205766',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1771591729_2205766.jpg'},
  {name:'むむ',castId:'6697106',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1768988440_6697106.jpeg'},
  {name:'みやび',castId:'6121984',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1769242903_6121984.jpg'},
  {name:'あやな',castId:'6224397',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1769517326_6224397.jpg'},
  {name:'ほの',castId:'2056117',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775139983_2056117.jpg'},
  {name:'ふうか',castId:'6512830',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1771036247_6512830.jpg'},
  {name:'なな',castId:'2267223',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1771246649_2267223.jpeg'},
  {name:'あず',castId:'5595174',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773161642_5595174.jpeg'},
  {name:'あむ',castId:'5184861',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773506167_5184861.jpeg'},
  {name:'みれい',castId:'0004429',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772027259_0004429.jpg'},
  {name:'もか',castId:'9911699',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772362347_9911699.jpg'},
  {name:'えり',castId:'2182106',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772451291_2182106.jpg'},
  {name:'さつき',castId:'8563837',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772429492_8563837.jpg'},
  {name:'さき',castId:'3227290',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772535927_3227290.jpg'},
  {name:'あすな',castId:'4228657',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773050814_4228657.jpeg'},
  {name:'らら',castId:'6486648',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1760574400_6486648.jpg'},
  {name:'あも',castId:'4807050',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773797316_4807050.jpg'},
  {name:'かりな',castId:'2980149',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773828024_2980149.jpg'},
  {name:'みなみ',castId:'5638535',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778980726_5638535.jpeg'},
  {name:'のん',castId:'7086608',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774331444_7086608.jpg'},
  {name:'ねね',castId:'8966562',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774414471_8966562.jpeg'},
  {name:'ゆあ',castId:'3894935',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774440879_3894935.jpeg'},
  {name:'りせ',castId:'5370250',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775145459_5370250.jpg'},
  {name:'あげは',castId:'4412943',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774891897_4412943.jpg'},
  {name:'なの',castId:'4181138',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775633419_4181138.jpeg'},
  {name:'らい',castId:'0940609',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775033654_0940609.jpg'},
  {name:'のえる',castId:'3553301',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775056195_3553301.jpg'},
  {name:'あいり',castId:'9587493',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775145544_9587493.jpg'},
  {name:'ひびき',castId:'7572845',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775554307_7572845.jpg'},
  {name:'あき',castId:'9398086',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1766342936_9398086.jpeg'},
  {name:'ゆな',castId:'5904704',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1776021431_5904704.jpeg'},
  {name:'なこ',castId:'8887273',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1776178317_8887273.jpg'},
  {name:'あさみ',castId:'8109613',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773311927_8109613.jpeg'},
  {name:'みこと',castId:'6254580',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1776702880_6254580.jpeg'},
  {name:'ももな',castId:'3675919',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1777121660_3675919.jpg'},
  {name:'みらい',castId:'9017176',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1777684047_9017176.jpg'},
  {name:'うな',castId:'5782898',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1777465939_5782898.jpg'},
  {name:'るう',castId:'6822217',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778487898_6822217.jpg'},
  {name:'れん',castId:'7606015',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778166588_7606015.jpeg'},
  {name:'うい',castId:'2162773',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778660117_2162773.jpeg'},
  {name:'おひな',castId:'6076824',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778677893_6076824.jpg'},
  {name:'かりん',castId:'3544216',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778746106_3544216.jpg'},
  {name:'りこ',castId:'6880023',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778829438_6880023.jpg'},
  {name:'ゆうは',castId:'7035274',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778947996_7035274.jpg'},
  {name:'ゆず',castId:'5184899',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778948384_5184899.jpg'},
  {name:'のあ',castId:'2936270',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779470353_2936270.jpeg'},
  {name:'あかり',castId:'1736150',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778948350_1736150.jpeg'},
  {name:'りの',castId:'1781124',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779802336_1781124.jpeg'},
  {name:'まほ',castId:'0496416',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779281206_0496416.jpeg'},
  {name:'うさ',castId:'9422804',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779282818_9422804.jpg'},
  {name:'りあん',castId:'6887560',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779378546_6887560.jpeg'},
  {name:'みさき',castId:'0944753',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779485033_0944753.jpeg'},
  {name:'まな',castId:'5006852',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779699646_5006852.jpg'},
  {name:'かなみ',castId:'0773549',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1780220254_0773549.jpeg'},
  {name:'さくら',castId:'6749364',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1780371290_6749364.jpg'},
  {name:'りりす',castId:'8887852',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1780338810_8887852.jpg'},
  {name:'りみ',castId:'9057532',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1780382190_9057532.jpg'},
  {name:'ゆら',castId:'2720066',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1780418006_2720066.jpeg'},
  {name:'ゆうき',castId:'0420874',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1780727810_0420874.jpg'},
];

// ===== SUPERNOVA 72名 (ローマ字名) =====
const SUPERNOVA_THERAPISTS = [
  {name:'KANAE',castId:'6296734',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779441993_6296734.jpeg'},
  {name:'NIKORI',castId:'3138247',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773829265_3138247.jpeg'},
  {name:'UMI',castId:'8542651',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774685100_8542651.jpeg'},
  {name:'MEI',castId:'5149785',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1758981664_5149785.jpeg'},
  {name:'MAYU',castId:'9944039',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1764753263_9944039.jpeg'},
  {name:'KOTORI',castId:'3968239',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773186930_3968239.jpeg'},
  {name:'MERU',castId:'1569260',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1749385809_1569260.jpeg'},
  {name:'NENE',castId:'4737666',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1777038997_4737666.jpeg'},
  {name:'AMANE',castId:'2610619',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1768011704_2610619.jpeg'},
  {name:'HINATA',castId:'1674804',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773032329_1674804.jpeg'},
  {name:'RAN',castId:'2353030',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773411658_2353030.jpeg'},
  {name:'HIMEKA',castId:'6411414',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772925988_6411414.jpeg'},
  {name:'SAKI',castId:'1124681',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1776269451_1124681.jpeg'},
  {name:'URU',castId:'5378641',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1769750131_5378641.jpeg'},
  {name:'EMA',castId:'5447443',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773498029_5447443.jpeg'},
  {name:'SHIINA',castId:'1580752',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779339840_1580752.jpeg'},
  {name:'ARINA',castId:'5588157',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772926107_5588157.jpeg'},
  {name:'YUUNA',castId:'2120297',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1759826045_2120297.jpeg'},
  {name:'YUUHA',castId:'5397680',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1770987307_5397680.jpeg'},
  {name:'NANASE',castId:'2430034',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1771155664_2430034.jpeg'},
  {name:'YUI',castId:'5460021',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1746174051_5460021.jpeg'},
  {name:'ICHIKA',castId:'6347802',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772356431_6347802.jpeg'},
  {name:'SANA',castId:'6046537',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1748604008_6046537.jpeg'},
  {name:'RUNA',castId:'6043511',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1751602665_6043511.jpeg'},
  {name:'OTOHA',castId:'2305312',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1758394289_2305312.jpeg'},
  {name:'KIRARA',castId:'3061192',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1751037651_3061192.jpeg'},
  {name:'MINA',castId:'3311251',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773981138_3311251.jpeg'},
  {name:'RURU',castId:'4865220',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1776503217_4865220.jpeg'},
  {name:'RISE',castId:'3210311',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1755339730_3210311.jpeg'},
  {name:'RIRI',castId:'3837525',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774091547_3837525.jpeg'},
  {name:'SERIKA',castId:'6205389',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1761463551_6205389.jpeg'},
  {name:'MIRU',castId:'0977996',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1762730732_0977996.jpeg'},
  {name:'MAHIRO',castId:'3417807',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1763180392_3417807.jpeg'},
  {name:'REA',castId:'8390093',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1763282631_8390093.jpeg'},
  {name:'HARU',castId:'8088744',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1765512644_8088744.jpeg'},
  {name:'SHION',castId:'9835866',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1763117247_9835866.jpeg'},
  {name:'AOI',castId:'1680764',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1766927896_1680764.jpeg'},
  {name:'MAO',castId:'9258749',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1767982792_9258749.jpeg'},
  {name:'HINANO',castId:'2392604',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1768716310_2392604.jpeg'},
  {name:'ERI',castId:'2895039',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1769103055_2895039.jpeg'},
  {name:'RENO',castId:'8920502',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1769993431_8920502.jpeg'},
  {name:'YURA',castId:'9423499',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1770407700_9423499.jpeg'},
  {name:'SAKU',castId:'4585648',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1771394800_4585648.jpeg'},
  {name:'KANON',castId:'3866342',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779443908_3866342.jpeg'},
  {name:'NAGI',castId:'2790033',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772926366_2790033.jpeg'},
  {name:'MIREI',castId:'9325944',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772927453_9325944.jpeg'},
  {name:'KIARA',castId:'3590323',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772927908_3590323.jpeg'},
  {name:'RINA',castId:'6812646',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773669543_6812646.jpeg'},
  {name:'RIE',castId:'9074152',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772990075_9074152.jpeg'},
  {name:'HOMURA',castId:'1974612',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773440266_1974612.jpeg'},
  {name:'SEIRA',castId:'7759598',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1773451719_7759598.jpeg'},
  {name:'SENA',castId:'2662970',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1776794934_2662970.jpeg'},
  {name:'TEN',castId:'4974114',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1776081179_4974114.jpeg'},
  {name:'MARIA',castId:'3633508',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774245919_3633508.jpeg'},
  {name:'MIYU',castId:'4506879',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774496010_4506879.jpeg'},
  {name:'HIMARI',castId:'0932364',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774694401_0932364.jpeg'},
  {name:'MASHIRO',castId:'0279814',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774778499_0279814.jpeg'},
  {name:'REN',castId:'3496501',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779219208_3496501.jpeg'},
  {name:'HIBIKI',castId:'5165947',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775222481_5165947.jpeg'},
  {name:'USA',castId:'9279223',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1779709587_9279223.jpeg'},
  {name:'ARISA',castId:'0840496',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1774974087_0840496.jpeg'},
  {name:'MOMO',castId:'3426418',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1775221575_3426418.jpeg'},
  {name:'SORA',castId:'6384234',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1777025984_6384234.jpeg'},
  {name:'NAKO',castId:'3421958',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778302252_3421958.jpeg'},
  {name:'KYOKA',castId:'5074889',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778304399_5074889.jpeg'},
  {name:'YUNA',castId:'9236491',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1778950996_9236491.jpeg'},
  {name:'ITO',castId:'6342943',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1756470945_6342943.jpeg'},
  {name:'MEGU',castId:'6802438',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1772928037_6802438.jpeg'},
  {name:'KASUMI',castId:'1726990',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1758394516_1726990.jpeg'},
  {name:'SERENA',castId:'9711405',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1759765922_9711405.jpeg'},
  {name:'SUMIRE',castId:'1435838',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1747696373_1435838.jpeg'},
  {name:'NINA',castId:'7355405',src:'https://cdn2-caskan.com/caskan/img/cast_tmb/1780246008_7355405.jpeg'},
];

// ===== Revere Spa 31名 (/photos/{lid}/moto_{lid}.jpg) =====
const REVERE_THERAPISTS = [
  {name:'あずさ',lid:'150'},{name:'みさき',lid:'148'},{name:'ひまり',lid:'42'},
  {name:'るい',lid:'130'},{name:'せな',lid:'2'},{name:'さりな',lid:'8'},
  {name:'みなみ',lid:'7'},{name:'もか',lid:'81'},{name:'ましろ',lid:'123'},
  {name:'かれん',lid:'129'},{name:'くれは',lid:'97'},{name:'なのは',lid:'128'},
  {name:'つむぎ',lid:'121'},{name:'りおな',lid:'132'},{name:'しずく',lid:'127'},
  {name:'さぁや',lid:'100'},{name:'ゆめ',lid:'85'},{name:'ゆず',lid:'83'},
  {name:'もね',lid:'18'},{name:'ありす',lid:'146'},{name:'くるみ',lid:'87'},
  {name:'ねね',lid:'103'},{name:'れいな',lid:'35'},{name:'みれい',lid:'69'},
  {name:'みく',lid:'29'},{name:'まこ',lid:'57'},{name:'るな',lid:'104'},
  {name:'のあ',lid:'131'},{name:'えま',lid:'115'},{name:'おと',lid:'52'},
  {name:'りず',lid:'60'},
].map(t => ({
  ...t,
  src: `https://revere-spa.com/photos/${t.lid}/moto_${t.lid}.jpg`,
  key: `revere_${t.lid}`,
}));

async function processTherapists(shopId, therapists, keyPrefix, referer, mode) {
  let ins = 0, upd = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const key = t.key || `${keyPrefix}_${t.castId || t.lid}`;
    const tid = `${shopId}_${t.name}`;

    if (mode === 'update') {
      // Revere Spa: 既存レコードの image_url を更新
      const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
      if (!ex) { process.stdout.write('?'); skp++; continue; }
      if (ex.image_url) { process.stdout.write('='); skp++; continue; }
      if (DRY_RUN) { process.stdout.write('u'); upd++; continue; }
      const url = await uploadImage(t.src, key, referer);
      const { error } = await supabase.from('therapists').update({ image_url: url }).eq('id', tid);
      if (error) { err++; process.stdout.write('x'); }
      else { process.stdout.write(url ? 'u' : 'n'); upd++; }
    } else {
      // Amateras / SUPERNOVA: 新規挿入
      const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
      if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
      if (DRY_RUN) { process.stdout.write('+'); ins++; continue; }
      const url = await uploadImage(t.src, key, referer);
      const { error } = await supabase.from('therapists').upsert(
        { id: tid, shop_id: shopId, name: t.name, image_url: url },
        { onConflict: 'id' }
      );
      if (error) { err++; process.stdout.write('x'); }
      else { process.stdout.write(url ? '+' : 'n'); ins++; }
    }
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`\n  挿入/更新:${ins+upd} スキップ:${skp} エラー:${err}`);
}

async function main() {
  console.log(`=== 武蔵小杉残り3店舗 (DRY_RUN=${DRY_RUN}) ===\n`);

  if (run('amateras')) {
    console.log('--- Amateras (アマテラス) 132名 ---');
    await processTherapists(
      'kanagawa_kawasaki_musashikosugi_amateras',
      AMATERAS_THERAPISTS,
      'amateras',
      null,
      'insert'
    );
  }

  if (run('supernova')) {
    console.log('--- SUPERNOVA (スーパーノバ) 72名 ---');
    await processTherapists(
      'kanagawa_kawasaki_musashikosugi_supernova',
      SUPERNOVA_THERAPISTS,
      'supernova',
      null,
      'insert'
    );
  }

  if (run('revere')) {
    console.log('--- Revere Spa (リヴェールスパ) 31名 画像更新 ---');
    await processTherapists(
      'kanagawa_kawasaki_musashikosugi_revere_spa',
      REVERE_THERAPISTS,
      'revere',
      'https://revere-spa.com/girl',
      'update'
    );
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
