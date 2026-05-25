/**
 * 東京・大阪 未登録セラピスト追加（写真付き）
 * 対象: Love it / アロマリゾート / ミセスの子守唄 / ミセスムーンR / うさぎのお部屋 / LIRICA OSAKA / Fu-Ryu
 * 実行: node scripts/maintenance/add_missing_osaka_tokyo_therapists.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, { headers: { ...UA, Referer: referer }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, buf, { contentType: ct, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

/**
 * @param {string} domainPart  - shops.website_url ILIKE '%domainPart%'
 * @param {Array}  data        - entries; first element is always name
 * @param {string} referer     - Referer header for image fetch
 * @param {Function} getImageUrl - (entry) => imageUrl string
 * @param {Function} getFileName - (entry) => storageFileName string
 */
async function processShop(domainPart, data, referer, getImageUrl, getFileName) {
  const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', `%${domainPart}%`);
  if (!shops || shops.length === 0) { console.log(`${domainPart} の店舗が見つかりません`); return; }
  console.log(`\n対象店舗: ${shops.map(s => s.name).join(', ')}`);
  const shopIds = shops.map(s => s.id);

  let inserted = 0, updated = 0, skipped = 0, failed = 0;

  for (const entry of data) {
    const [name] = entry;
    // Try name variants (full-width spaces)
    const namesToTry = [name, name.replace(/　/g, ' '), name.replace(/　/g, '')];
    let existing = null;
    for (const n of namesToTry) {
      const { data: res } = await supabase.from('therapists').select('id, image_url').in('shop_id', shopIds).eq('name', n);
      if (res && res.length > 0) { existing = res; break; }
    }

    if (existing && existing.length > 0) {
      const nullOnes = existing.filter(t => !t.image_url);
      if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }
      // 既存だが写真なし → 更新
      const imageUrl = getImageUrl(entry);
      if (!imageUrl) { process.stdout.write('n'); skipped++; continue; }
      const fileName = getFileName(entry);
      const storageUrl = DRY_RUN ? 'DRY' : await uploadImage(imageUrl, fileName, referer);
      if (!DRY_RUN) await sleep(100);
      for (const t of nullOnes) {
        if (!DRY_RUN) {
          const { error } = await supabase.from('therapists').update({ image_url: storageUrl || null }).eq('id', t.id);
          if (error) { console.log(`\n❌ update ${name}: ${error.message}`); failed++; }
          else { process.stdout.write(storageUrl ? 'u' : 'n'); updated++; }
        } else { process.stdout.write('u'); updated++; }
      }
    } else {
      // DB未登録 → 新規追加
      const imageUrl = getImageUrl(entry);
      if (!imageUrl) { process.stdout.write('n'); skipped++; continue; }
      const fileName = getFileName(entry);
      const storageUrl = DRY_RUN ? 'DRY' : await uploadImage(imageUrl, fileName, referer);
      if (!DRY_RUN) await sleep(100);
      for (const shop of shops) {
        const id = `${shop.id}_${name}`;
        if (!DRY_RUN) {
          const { error } = await supabase.from('therapists').insert({ id, shop_id: shop.id, name, image_url: storageUrl || null });
          if (error) { console.log(`\n❌ insert ${name}: ${error.message}`); failed++; }
          else { process.stdout.write('+'); inserted++; }
        } else { process.stdout.write('+'); inserted++; }
      }
    }
    if (!DRY_RUN) await sleep(80);
  }
  console.log(`\n追加 ${inserted}件 / 写真更新 ${updated}件 / スキップ ${skipped}件 / 失敗 ${failed}件`);
}

// ============================================================
// Love it（ラヴィット）29名
// ============================================================
const LOVEIT_DATA = [
  ['鳴海あお', 'https://loveit.love/data/staff/17/stf_69438c76273a7.jpg'],
  ['愛野えり', 'https://loveit.love/data/staff/14/stf_69b166d3231ca.jpg'],
  ['小倉ゆい', 'https://loveit.love/data/staff/39/stf_6948048ad31cc.jpg'],
  ['優木みなみ', 'https://loveit.love/data/staff/46/stf_6999a0ecb56d9.png'],
  ['天羽あすか', 'https://loveit.love/data/staff/34/stf_68ddb8ad4d937.jpg'],
  ['一条らな', 'https://loveit.love/data/staff/44/stf_68f31637d57ff.jpg'],
  ['逢沢えま', 'https://loveit.love/data/staff/37/stf_69f7426d27f24.jpg'],
  ['月星うさぎ', 'https://loveit.love/data/staff/12/stf_68540ddc2dfc1.jpg'],
  ['若菜みゆ', 'https://loveit.love/data/staff/13/stf_699f14f33152a.jpg'],
  ['花咲れあ', 'https://loveit.love/data/staff/18/stf_69f04ffe5ba24.png'],
  ['桜庭めぐ', 'https://loveit.love/data/staff/2/stf_6909486e63489.jpg'],
  ['水瀬みずき', 'https://loveit.love/data/staff/21/stf_69eee58ca657c.jpg'],
  ['美波せな', 'https://loveit.love/data/staff/36/stf_6995d7af80719.jpg'],
  ['新堂さら', 'https://loveit.love/data/staff/9/stf_699bad153ad56.jpg'],
  ['南まりん', 'https://loveit.love/data/staff/8/stf_689c3576c4aa8.png'],
  ['夢咲えれな', 'https://loveit.love/data/staff/26/stf_685129158b184.jpg'],
  ['小坂なほ', 'https://loveit.love/data/staff/1/stf_69a925bc0493b.jpg'],
  ['有栖ユマ', 'https://loveit.love/data/staff/22/stf_681001bf6345f.jpg'],
  ['日向ありさ', 'https://loveit.love/data/staff/3/stf_67edebab85b3d.jpg'],
  ['音花せいら', 'https://loveit.love/data/staff/10/stf_6979d243501c1.jpg'],
  ['藤堂さや', 'https://loveit.love/data/staff/43/stf_68e7511e0ffda.jpg'],
  ['宮羽るい', 'https://loveit.love/data/staff/41/stf_683f7385d6e67.jpg'],
  ['神楽りな', 'https://loveit.love/data/staff/29/stf_690a018396672.jpg'],
  ['茉白もね', 'https://loveit.love/data/staff/33/stf_69412124a3e26.jpg'],
  ['来栖わかな', 'https://loveit.love/data/staff/24/stf_690a13bc3e827.jpg'],
  ['雪城ほのか', 'https://loveit.love/data/staff/45/stf_68e8c7d2f173c.jpg'],
  ['星宮なぎさ', 'https://loveit.love/data/staff/40/stf_68a6a8c4df7ba.jpg'],
  ['夢眠なづ', 'https://loveit.love/data/staff/20/stf_68455f15ea14c.jpg'],
  ['苺みる', 'https://loveit.love/data/staff/30/stf_677e1c02ad095.jpg'],
];

// ============================================================
// アロマリゾート（Tokyo-Aroma-World）38名
// ============================================================
const AROMA_WORLD_DATA = [
  ['平野つき', '50'],
  ['工藤みお', '49'],
  ['瀬名ののか', '48'],
  ['蒼井るな', '45'],
  ['姫野まき', '43'],
  ['花宮あまね', '42'],
  ['日高るい', '9'],
  ['東雲まゆ', '10'],
  ['観月こはる', '11'],
  ['大森なこ', '12'],
  ['斉藤ゆか', '13'],
  ['桃瀬りんか', '14'],
  ['水瀬かえで', '15'],
  ['日向まいか', '16'],
  ['井上りお', '17'],
  ['葉山あずさ', '18'],
  ['川崎おとは', '19'],
  ['中村むつみ', '20'],
  ['一ノ瀬ねね', '21'],
  ['成瀬ひまり', '22'],
  ['星川ななせ', '23'],
  ['佐々木えみ', '24'],
  ['高田みな', '25'],
  ['高橋みさき', '26'],
  ['有栖りず', '27'],
  ['月見まい', '28'],
  ['佐藤りな', '29'],
  ['大野あん', '31'],
  ['小林きい', '32'],
  ['藤井らん', '33'],
  ['松浦あやみ', '34'],
  ['桜木まお', '35'],
  ['百田つばさ', '36'],
  ['月森あゆり', '37'],
  ['松本るり', '38'],
  ['春山わかな', '39'],
  ['寺西あい', '40'],
  ['葉月すずな', '41'],
];

// ============================================================
// ミセスの子守唄 31名
// ============================================================
const KOMORIUTA_DATA = [
  ['眞奈', 'https://mrs-komoriuta.com/wcms/gals/images/260/photo_thumb5_000_260504.jpg'],
  ['凛華', 'https://mrs-komoriuta.com/wcms/gals/images/255/photo_thumb5_000_260429.jpg'],
  ['真緒', 'https://mrs-komoriuta.com/wcms/gals/images/258/photo_thumb5_000_260424.jpg'],
  ['芹那', 'https://mrs-komoriuta.com/wcms/gals/images/247/photo_thumb5_000_260422.jpg'],
  ['桃々', 'https://mrs-komoriuta.com/wcms/gals/images/257/photo_thumb5_000_260419.jpg'],
  ['月美', 'https://mrs-komoriuta.com/wcms/gals/images/256/photo_thumb5_000_260415.jpg'],
  ['奈美', 'https://mrs-komoriuta.com/wcms/gals/images/48/photo_thumb5_001_221108.jpg'],
  ['志保', 'https://mrs-komoriuta.com/wcms/gals/images/135/photo_thumb5_007_241213.jpg'],
  ['真琴', 'https://mrs-komoriuta.com/wcms/gals/images/24/photo_thumb5_006_240816.jpg'],
  ['響', 'https://mrs-komoriuta.com/wcms/gals/images/160/photo_thumb5_006_251121.jpg'],
  ['南', 'https://mrs-komoriuta.com/wcms/gals/images/234/photo_thumb5_001_251112.jpg'],
  ['渉子', 'https://mrs-komoriuta.com/wcms/gals/images/228/photo_thumb5_000_251016.jpg'],
  ['乙葉', 'https://mrs-komoriuta.com/wcms/gals/images/168/photo_thumb5_002_250226.jpg'],
  ['七海', 'https://mrs-komoriuta.com/wcms/gals/images/113/photo_thumb5_010_250319.jpg'],
  ['茉白', 'https://mrs-komoriuta.com/wcms/gals/images/205/photo_thumb5_000_250606.jpg'],
  ['清美', 'https://mrs-komoriuta.com/wcms/gals/images/136/photo_thumb5_001_241213.jpg'],
  ['汐栞', 'https://mrs-komoriuta.com/wcms/gals/images/220/photo_thumb5_000_250822.jpg'],
  ['雫果', 'https://mrs-komoriuta.com/wcms/gals/images/244/photo_thumb5_000_260109.jpg'],
  ['花奈', 'https://mrs-komoriuta.com/wcms/gals/images/232/photo_thumb5_000_251108.jpg'],
  ['良子', 'https://mrs-komoriuta.com/wcms/gals/images/72/photo_thumb5_003_241213.jpg'],
  ['千明', 'https://mrs-komoriuta.com/wcms/gals/images/36/photo_thumb5_004_241213.jpg'],
  ['麗未', 'https://mrs-komoriuta.com/wcms/gals/images/253/photo_thumb5_000_260320.jpg'],
  ['光希', 'https://mrs-komoriuta.com/wcms/gals/images/196/photo_thumb5_000_250505.jpg'],
  ['由美子', 'https://mrs-komoriuta.com/wcms/gals/images/213/photo_thumb5_000_250703.jpg'],
  ['百恵', 'https://mrs-komoriuta.com/wcms/gals/images/57/photo_thumb5_003_241213.jpg'],
  ['果歩', 'https://mrs-komoriuta.com/wcms/gals/images/64/photo_thumb5_007_250825.jpg'],
  ['希望', 'https://mrs-komoriuta.com/wcms/gals/images/254/photo_thumb5_000_260330.jpg'],
  ['柚希', 'https://mrs-komoriuta.com/wcms/gals/images/252/photo_thumb5_000_260311.jpg'],
  ['彩芽', 'https://mrs-komoriuta.com/wcms/gals/images/250/photo_thumb5_000_260227.jpg'],
  ['美加', 'https://mrs-komoriuta.com/wcms/gals/images/123/photo_thumb5_014_241214.jpg'],
  ['美晴', 'https://mrs-komoriuta.com/wcms/gals/images/251/photo_thumb5_000_260313.jpg'],
];

// ============================================================
// ミセスムーンR 11名
// ============================================================
const MOONR_DATA = [
  ['きらら', 'https://www.moonr.jp/wcms/gals/images/1708/photo_003_260510.jpg'],
  ['はるか', 'https://www.moonr.jp/wcms/gals/images/1731/photo_002_260506.jpg'],
  ['れいな', 'https://www.moonr.jp/wcms/gals/images/1740/photo_004_260501.jpg'],
  ['さな', 'https://www.moonr.jp/wcms/gals/images/1713/photo_000_260426.jpg'],
  ['るい', 'https://www.moonr.jp/wcms/gals/images/1690/photo_000_260422.jpg'],
  ['はるき', 'https://www.moonr.jp/wcms/gals/images/1736/photo_001_260407.jpg'],
  ['のあ', 'https://www.moonr.jp/wcms/gals/images/1734/photo_006_260428.jpg'],
  ['ゆゆ', 'https://www.moonr.jp/wcms/gals/images/1735/photo_000_260406.jpg'],
  ['はじめ', 'https://www.moonr.jp/wcms/gals/images/1721/photo_006_260227.jpg'],
  ['ことの', 'https://www.moonr.jp/wcms/gals/images/897/photo_020_230422.jpg'],
  ['あけみ', 'https://www.moonr.jp/wcms/gals/images/656/photo_027_260309.jpg'],
];

// ============================================================
// うさぎのお部屋 75名
// ============================================================
const BUNNY_DATA = [
  ['西宮ゆめ', 'https://bunny-room.com/images_staff/245/041101301566.jpg'],
  ['色葉みさ', 'https://bunny-room.com/images_staff/476/041101311971.jpg'],
  ['小羽もも', 'https://bunny-room.com/images_staff/587/041101323569.jpg'],
  ['鈴村あいり', 'https://bunny-room.com/images_staff/191/041109251118.jpg'],
  ['音ノ瀬ゆい', 'https://bunny-room.com/images_staff/427/041109174248.jpg'],
  ['白銀あい', 'https://bunny-room.com/images_staff/623/041321243366.jpg'],
  ['宮脇かれん', 'https://bunny-room.com/images_staff/468/041109120299.jpg'],
  ['桜あおい', 'https://bunny-room.com/images_staff/267/041109283687.jpg'],
  ['神楽りり', 'https://bunny-room.com/images_staff/524/041109103082.jpg'],
  ['櫻井あゆ', 'https://bunny-room.com/images_staff/221/041109310874.jpg'],
  ['恋葉うらら', 'https://bunny-room.com/images_staff/596/041109145761.jpg'],
  ['滝沢はな', 'https://bunny-room.com/images_staff/566/041109314156.jpg'],
  ['るる', 'https://bunny-room.com/images_staff/541/041108172637.jpg'],
  ['星宮いちか', 'https://bunny-room.com/images_staff/655/042014104083.jpg'],
  ['宮月さな', 'https://bunny-room.com/images_staff/653/041621473765.jpg'],
  ['吉沢ましろ', 'https://bunny-room.com/images_staff/647/042019274551.jpeg'],
  ['西野らん', 'https://bunny-room.com/images_staff/485/041109211638.jpg'],
  ['井ノ上たきな', 'https://bunny-room.com/images_staff/335/041109352753.jpg'],
  ['月乃みる', 'https://bunny-room.com/images_staff/222/041109360433.jpg'],
  ['春しおん', 'https://bunny-room.com/images_staff/642/05012250486.jpg'],
  ['桜木あお', 'https://bunny-room.com/images_staff/620/041109221785.jpg'],
  ['有村りか', 'https://bunny-room.com/images_staff/644/041101173858.jpg'],
  ['深川なこ', 'https://bunny-room.com/images_staff/640/042019283711.jpeg'],
  ['西園寺あずさ', 'https://bunny-room.com/images_staff/657/042417195651.jpg'],
  ['柏木サラ', 'https://bunny-room.com/images_staff/660/042723195258.jpg'],
  ['清野はる', 'https://bunny-room.com/images_staff/639/042016321245.jpg'],
  ['芹沢のあ', 'https://bunny-room.com/images_staff/602/041109334076.jpg'],
  ['星乃おと', 'https://bunny-room.com/images_staff/632/042223501099.jpg'],
  ['朝比奈るい', 'https://bunny-room.com/images_staff/650/041320500581.jpg'],
  ['片桐ゆうか', 'https://bunny-room.com/images_staff/646/041109281171.jpg'],
  ['乙葉くるみ', 'https://bunny-room.com/images_staff/560/042112544418.jpg'],
  ['小紫のの', 'https://bunny-room.com/images_staff/454/041112202127.jpg'],
  ['立華きき', 'https://bunny-room.com/images_staff/598/042014510120.jpg'],
  ['綾瀬りさ', 'https://bunny-room.com/images_staff/570/041112001790.jpg'],
  ['椎名なつき', 'https://bunny-room.com/images_staff/630/041109204257.jpg'],
  ['みれい', 'https://bunny-room.com/images_staff/622/041112362199.jpg'],
  ['美波かのん', 'https://bunny-room.com/images_staff/374/041112165626.jpg'],
  ['柚瀬みこと', 'https://bunny-room.com/images_staff/350/041112140192.jpg'],
  ['望月りあ', 'https://bunny-room.com/images_staff/574/041111584170.jpg'],
  ['七海かりん', 'https://bunny-room.com/images_staff/616/041112272180.jpg'],
  ['仁兎まう', 'https://bunny-room.com/images_staff/556/041112005428.jpg'],
  ['来栖ティナ', 'https://bunny-room.com/images_staff/611/041112274479.jpg'],
  ['皐月うた', 'https://bunny-room.com/images_staff/559/04111200339.jpg'],
  ['花火せいな', 'https://bunny-room.com/images_staff/635/041112305160.jpg'],
  ['観月ふわ', 'https://bunny-room.com/images_staff/654/041815265285.jpg'],
  ['三上えりか', 'https://bunny-room.com/images_staff/645/041101151668.jpg'],
  ['結城さら', 'https://bunny-room.com/images_staff/648/041101022892.jpg'],
  ['春野わかな', 'https://bunny-room.com/images_staff/638/04110129059.jpg'],
  ['姫野カヤ', 'https://bunny-room.com/images_staff/626/041108154926.jpg'],
  ['美月のどか', 'https://bunny-room.com/images_staff/605/041112302022.jpg'],
  ['南雲のえる', 'https://bunny-room.com/images_staff/597/041111592620.jpg'],
  ['兎田ももな', 'https://bunny-room.com/images_staff/610/041112275892.jpg'],
  ['河北せな', 'https://bunny-room.com/images_staff/604/041112303633.jpg'],
  ['桜庭もね', 'https://bunny-room.com/images_staff/593/041112253985.jpg'],
  ['のん', 'https://bunny-room.com/images_staff/573/041112243387.jpg'],
  ['蒼井るな', 'https://bunny-room.com/images_staff/585/041108165993.jpg'],
  ['北川みかな', 'https://bunny-room.com/images_staff/520/041109161881.jpg'],
  ['四葉まゆ', 'https://bunny-room.com/images_staff/481/041112200138.jpg'],
  ['乾ほのか', 'https://bunny-room.com/images_staff/509/041112231633.jpg'],
  ['西園寺こころ', 'https://bunny-room.com/images_staff/588/041112265380.jpg'],
  ['羽宮あお', 'https://bunny-room.com/images_staff/487/041112184796.jpg'],
  ['岡咲せりな', 'https://bunny-room.com/images_staff/438/041112143163.jpg'],
  ['星野みらん', 'https://bunny-room.com/images_staff/533/041112213231.jpg'],
  ['影宮芹', 'https://bunny-room.com/images_staff/565/041112251192.jpg'],
  ['籠乃めあ', 'https://bunny-room.com/images_staff/621/041112311517.jpg'],
  ['メアリ', 'https://bunny-room.com/images_staff/432/041112162143.jpg'],
  ['朝比奈あみ', 'https://bunny-room.com/images_staff/589/041112262468.jpg'],
  ['夜空ゆのん', 'https://bunny-room.com/images_staff/516/041112224938.jpg'],
  ['篠崎きらら', 'https://bunny-room.com/images_staff/569/041112244926.jpg'],
  ['牧野のぞみ', 'https://bunny-room.com/images_staff/470/041109163811.jpg'],
  ['夢咲なゆ', 'https://bunny-room.com/images_staff/484/041112193970.jpg'],
  ['宇佐美みるく', 'https://bunny-room.com/images_staff/489/041112175477.jpg'],
  ['城乃ヒカリ', 'https://bunny-room.com/images_staff/508/041112234582.jpg'],
  ['佐藤さくら', 'https://bunny-room.com/images_staff/501/041112240840.jpg'],
  ['星咲うい', 'https://bunny-room.com/images_staff/492/041112173016.jpg'],
];

// ============================================================
// LIRICA OSAKA 41名: name → castId
// ============================================================
const LIRICA_DATA = [
  ['桜庭えみり', '569'],
  ['松本ゆりあ', '565'],
  ['百瀬ティアラ', '99'],
  ['白石めぐ', '442'],
  ['花咲しずく', '63'],
  ['愛舞みぃ', '249'],
  ['ゆずりはいのり', '142'],
  ['橘　あいか', '495'],
  ['桜井ココ', '180'],
  ['ゆめ', '538'],
  ['蒼井そら', '539'],
  ['京楽ゆら', '356'],
  ['はる', '546'],
  ['上条ももね', '547'],
  ['かんな', '479'],
  ['小島りのん', '233'],
  ['晴ノ日さくら', '268'],
  ['野々花なのか', '273'],
  ['木浪なる', '343'],
  ['明司りな', '36'],
  ['木崎さき', '405'],
  ['冨松はるな', '352'],
  ['間宮みや', '355'],
  ['七瀬なな', '172'],
  ['美愛乃えみ', '473'],
  ['響ゆうか', '361'],
  ['瀬木きせき', '491'],
  ['きほ', '494'],
  ['いちの聖', '523'],
  ['大沢ゆい', '490'],
  ['三上りお', '212'],
  ['真冬虹まゆき', '267'],
  ['白石莉奈', '524'],
  ['うみ', '520'],
  ['真城せりな', '514'],
  ['愛川おとは', '525'],
  ['ひすいひなた', '493'],
  ['高砂りんご', '528'],
  ['立花みさ', '486'],
  ['神木玲', '420'],
];

// ============================================================
// Fu-Ryu 54名: name → castId
// ============================================================
const FURYU_DATA = [
  ['ひめ', '468'],
  ['もも', '467'],
  ['じゅな', '466'],
  ['みな', '464'],
  ['みき', '462'],
  ['るな', '460'],
  ['せり', '459'],
  ['まどか', '457'],
  ['りえ', '456'],
  ['みれい', '451'],
  ['れみ', '449'],
  ['さあや', '447'],
  ['さつき', '446'],
  ['みく', '443'],
  ['のあ', '439'],
  ['らむ', '433'],
  ['ゆき', '432'],
  ['そら', '430'],
  ['みさと', '429'],
  ['とあ', '428'],
  ['あやな', '426'],
  ['いと', '424'],
  ['なるせ', '422'],
  ['かずは', '421'],
  ['さき', '417'],
  ['ひかり', '416'],
  ['らら', '412'],
  ['あおい', '410'],
  ['やよい', '409'],
  ['まお', '400'],
  ['めぐみ', '398'],
  ['らん', '393'],
  ['つかさ', '391'],
  ['ことの', '386'],
  ['さら', '385'],
  ['なな', '382'],
  ['べる', '373'],
  ['ひなの', '370'],
  ['ゆり', '368'],
  ['ももな', '360'],
  ['ゆめ', '323'],
  ['まや', '58'],
  ['るい', '12'],
  ['りあ', '326'],
  ['じゅん', '191'],
  ['すず', '211'],
  ['れん', '148'],
  ['ななこ', '277'],
  ['みなみ', '283'],
  ['かえで', '298'],
  ['れいか', '300'],
  ['かれん', '337'],
  ['めい', '355'],
  ['さくら', '64'],
];

if (DRY_RUN) {
  console.log(`【Love it】 ${LOVEIT_DATA.length}名`);
  LOVEIT_DATA.slice(0, 3).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  console.log(`\n【アロマリゾート】 ${AROMA_WORLD_DATA.length}名`);
  AROMA_WORLD_DATA.slice(0, 3).forEach(([n, c]) => console.log(`  ${n} → thumb_${c}.jpg`));
  console.log(`\n【ミセスの子守唄】 ${KOMORIUTA_DATA.length}名`);
  KOMORIUTA_DATA.slice(0, 3).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  console.log(`\n【ミセスムーンR】 ${MOONR_DATA.length}名`);
  MOONR_DATA.slice(0, 3).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  console.log(`\n【うさぎのお部屋】 ${BUNNY_DATA.length}名`);
  BUNNY_DATA.slice(0, 3).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  console.log(`\n【LIRICA OSAKA】 ${LIRICA_DATA.length}名`);
  LIRICA_DATA.slice(0, 3).forEach(([n, c]) => console.log(`  ${n} → thumb_${c}.jpg`));
  console.log(`\n【Fu-Ryu】 ${FURYU_DATA.length}名`);
  FURYU_DATA.slice(0, 3).forEach(([n, c]) => console.log(`  ${n} → thumb_${c}.jpg`));
  process.exit(0);
}

// ---- Love it ----
console.log('\n=== Love it ===');
await processShop(
  'loveit',
  LOVEIT_DATA,
  'https://loveit.love/',
  ([, url]) => url,
  ([, url]) => {
    const staffId = url.match(/\/staff\/(\d+)\//)?.[1] || 'unknown';
    const ext = url.split('.').pop();
    return `loveit_${staffId}.${ext}`;
  }
);

// ---- アロマリゾート ----
console.log('\n=== アロマリゾート（Tokyo-Aroma-World）===');
await processShop(
  'tokyo-aroma-world',
  AROMA_WORLD_DATA,
  'https://tokyo-aroma-world.jp/',
  ([, castId]) => `https://tokyo-aroma-world.jp/upload/cast/thumb_${castId}.jpg`,
  ([, castId]) => `tokyo_aroma_world_${castId}.jpg`
);

// ---- ミセスの子守唄 ----
console.log('\n=== ミセスの子守唄 ===');
await processShop(
  'komoriuta',
  KOMORIUTA_DATA,
  'https://mrs-komoriuta.com/',
  ([, url]) => url,
  ([, url]) => {
    const galsId = url.match(/\/images\/(\d+)\//)?.[1] || 'unknown';
    return `komoriuta_${galsId}.jpg`;
  }
);

// ---- ミセスムーンR ----
console.log('\n=== ミセスムーンR ===');
await processShop(
  'moonr',
  MOONR_DATA,
  'https://www.moonr.jp/',
  ([, url]) => url,
  ([, url]) => {
    const galsId = url.match(/\/images\/(\d+)\//)?.[1] || 'unknown';
    return `moonr_${galsId}.jpg`;
  }
);

// ---- うさぎのお部屋 ----
console.log('\n=== うさぎのお部屋 ===');
await processShop(
  'bunny-room',
  BUNNY_DATA,
  'https://bunny-room.com/',
  ([, url]) => url,
  ([, url]) => {
    const parts = url.split('/');
    const staffId = parts[parts.length - 2];
    const ext = parts[parts.length - 1].split('.').pop();
    return `bunny_room_${staffId}.${ext}`;
  }
);

// ---- LIRICA OSAKA ----
console.log('\n=== LIRICA OSAKA ===');
await processShop(
  'lirica-osaka',
  LIRICA_DATA,
  'https://lirica-osaka.com/',
  ([, castId]) => `https://lirica-osaka.com/upload/cast/thumb_${castId}.jpg`,
  ([, castId]) => `lirica_${castId}.jpg`
);

// ---- Fu-Ryu ----
console.log('\n=== Fu-Ryu（フウリュウ）===');
await processShop(
  'furyu.net',
  FURYU_DATA,
  'https://furyu.net/',
  ([, castId]) => `https://furyu.net/upload/cast/thumb_${castId}.jpg`,
  ([, castId]) => `furyu_${castId}.jpg`
);

console.log('\n完了');
