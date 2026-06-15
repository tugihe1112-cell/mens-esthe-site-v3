import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const BASE_URL = getEnv('VITE_SUPABASE_URL');
const STORAGE_BUCKET = 'therapist-images';
const PREF = '熊本県';
const AREA = '熊本';

// --- Helpers ---
async function getOgImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    return $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content')
      || $('link[rel="apple-touch-icon"]').attr('href')
      || null;
  } catch { return null; }
}

async function uploadImage(imageUrl, storageKey, referer = null) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imageUrl, { headers });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ct = res.headers.get('content-type') || 'image/jpeg';
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storageKey, buf, { contentType: ct, upsert: true });
    if (error) { console.error(`Upload error ${storageKey}:`, error.message); return null; }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storageKey);
    return data.publicUrl;
  } catch (e) { console.error(`Fetch error ${imageUrl}:`, e.message); return null; }
}

const pAll = (fns, concurrency = 5) => new Promise((resolve) => {
  const results = new Array(fns.length);
  let idx = 0, done = 0;
  const run = async () => {
    while (idx < fns.length) {
      const i = idx++;
      results[i] = await fns[i]();
      if (++done === fns.length) resolve(results);
    }
  };
  for (let i = 0; i < Math.min(concurrency, fns.length); i++) run();
});

// --- Shop definitions ---
const SHOPS = [
  {
    id: 'kumamoto_kumamoto_sweeeety',
    name: 'Sweeeety (スウィーティー)',
    website_url: 'https://www.sweeeety.com/',
    schedule_url: 'https://www.sweeeety.com/schedule',
    area: AREA, prefecture: PREF,
  },
  {
    id: 'kumamoto_kumamoto_flower',
    name: 'Flower (フラワー)',
    website_url: 'https://esthe-flower.net/',
    schedule_url: 'https://esthe-flower.net/schedule',
    area: AREA, prefecture: PREF,
  },
  {
    id: 'kumamoto_kumamoto_mitsu',
    name: '蜜',
    website_url: 'https://www.esthe-mitsu.com/',
    schedule_url: null,
    area: AREA, prefecture: PREF,
  },
  {
    id: 'kumamoto_kumamoto_nonfiction_spa',
    name: 'Nonfiction Spa (ノンフィクションスパ)',
    website_url: 'https://nonfiction-spa.com/',
    schedule_url: 'https://nonfiction-spa.com/schedule',
    area: AREA, prefecture: PREF,
  },
  {
    id: 'kumamoto_kumamoto_mr',
    name: 'M&R',
    website_url: 'https://massarelax.com/',
    schedule_url: null,
    area: AREA, prefecture: PREF,
  },
  {
    id: 'kumamoto_kumamoto_estela',
    name: 'Estela (エステラ)',
    website_url: 'https://estela03.com/',
    schedule_url: null,
    area: AREA, prefecture: PREF,
  },
  {
    id: 'kumamoto_kumamoto_aby',
    name: 'Aby (アビー)',
    website_url: 'https://salon-aby.com/',
    schedule_url: null,
    area: AREA, prefecture: PREF,
  },
  {
    id: 'kumamoto_kumamoto_palette',
    name: 'palette (パレット)',
    website_url: 'https://palette2022.com/',
    schedule_url: 'https://palette2022.com/daily/',
    area: AREA, prefecture: PREF,
  },
  {
    id: 'kumamoto_kumamoto_lemarge',
    name: 'Le Marge (ルマージュ)',
    website_url: 'https://le-marge.jp/',
    schedule_url: null,
    area: AREA, prefecture: PREF,
  },
];

// --- Therapist data ---
const SWEEEETY = [
  {pid:'361',name:'りお'},{pid:'360',name:'すず'},{pid:'42',name:'上条あいみ'},
  {pid:'199',name:'森みらい'},{pid:'204',name:'胡蝶あやな'},{pid:'320',name:'如月きょう'},
  {pid:'292',name:'黒咲のあ'},{pid:'301',name:'華園ひめか'},{pid:'321',name:'せな'},
  {pid:'354',name:'ゆの'},{pid:'355',name:'えりか'},{pid:'350',name:'みゆ'},
  {pid:'356',name:'もも'},{pid:'324',name:'るな'},{pid:'358',name:'うる'},
  {pid:'339',name:'こはる'},{pid:'333',name:'れいら'},{pid:'334',name:'ありさ'},
  {pid:'343',name:'さな'},{pid:'221',name:'小鳥遊もえ'},{pid:'351',name:'りりあ'},
  {pid:'349',name:'なな'},{pid:'348',name:'ちとせ'},{pid:'332',name:'ねね'},
  {pid:'331',name:'みずき'},{pid:'359',name:'せりな'},{pid:'250',name:'しおん'},
  {pid:'313',name:'そら'},{pid:'260',name:'なのは'},{pid:'338',name:'あまね'},
  {pid:'342',name:'ゆうな'},{pid:'330',name:'ひより'},{pid:'276',name:'かりん'},
  {pid:'254',name:'一ノ瀬ちひろ'},{pid:'257',name:'玉城ひびき'},
];

const FLOWER = [
  {lid:'36',name:'朝比奈まい',imgSrc:'https://esthe-flower.net/photos/36/20250520134417-moto_36.jpg'},
  {lid:'71',name:'百瀬あや',imgSrc:'https://esthe-flower.net/photos/71/20260413204901-1776080894170.jpg'},
  {lid:'83',name:'伊藤心乃葉',imgSrc:'https://esthe-flower.net/photos/83/20260330173503-20260330_173317_882.jpg'},
  {lid:'85',name:'三上こはる',imgSrc:'https://esthe-flower.net/photos/85/20260323015547-1774198505738.jpg'},
  {lid:'73',name:'椿かれん',imgSrc:'https://esthe-flower.net/photos/73/20260112144001-diaries_372285763_file_name20251213140918.jpg'},
  {lid:'87',name:'坂口あやか',imgSrc:'https://esthe-flower.net/photos/87/20260611004049-20260610_233507_009.png'},
  {lid:'37',name:'桜ゆい',imgSrc:'https://esthe-flower.net/photos/37/20250520134118-moto_37.jpg'},
  {lid:'40',name:'夏目ゆう',imgSrc:'https://esthe-flower.net/photos/40/20250520134139-moto_40.jpg'},
  {lid:'74',name:'吉川なみ',imgSrc:'https://esthe-flower.net/photos/74/20251014144858-20251014_144604_174.jpg'},
  {lid:'64',name:'相沢いちか',imgSrc:'https://esthe-flower.net/photos/64/20260102201628-1767011394654.jpg'},
  {lid:'92',name:'山本みなみ',imgSrc:'https://esthe-flower.net/photos/92/20260611213016-20260611_202126_918.jpg'},
  {lid:'91',name:'鈴音もも',imgSrc:null},
  {lid:'90',name:'伊吹さやか',imgSrc:'https://esthe-flower.net/photos/90/20260602233858-20260602_233824_618.jpg'},
  {lid:'76',name:'丘えりな',imgSrc:'https://esthe-flower.net/photos/76/20251112162918-20251109_203827_625.jpg'},
  {lid:'61',name:'綾瀬まお',imgSrc:'https://esthe-flower.net/photos/61/20250721052339-img1_20250708000720.jpg'},
  {lid:'77',name:'星野るり',imgSrc:'https://esthe-flower.net/photos/77/20251121230505-20251118_215637_985.jpg'},
  {lid:'86',name:'九栗はな',imgSrc:'https://esthe-flower.net/photos/86/20260325233045-1774358314064.jpg'},
  {lid:'89',name:'松原いよ',imgSrc:'https://esthe-flower.net/photos/89/20260430004813-1777477646376.jpg'},
  {lid:'58',name:'真白にこ',imgSrc:'https://esthe-flower.net/photos/58/20250616121225-20250615_020648_514.jpg'},
  {lid:'82',name:'黒宮ゆな',imgSrc:'https://esthe-flower.net/photos/82/20260316033304-1771508416945.jpg'},
  {lid:'17',name:'松岡みほ',imgSrc:'https://esthe-flower.net/photos/17/20250723003029-1753188803858.jpg'},
  {lid:'54',name:'藤田びび',imgSrc:'https://esthe-flower.net/photos/54/20250520133944-moto_54.jpg'},
  {lid:'16',name:'白石ひな',imgSrc:'https://esthe-flower.net/photos/16/20250520133825-moto_16.jpg'},
  {lid:'10',name:'永瀬みらい',imgSrc:'https://esthe-flower.net/photos/10/20250520134204-moto_10.jpg'},
  {lid:'60',name:'浅井もか',imgSrc:null},
  {lid:'69',name:'林ねね',imgSrc:'https://esthe-flower.net/photos/69/20250906061707-20250905_003457_675.jpg'},
  {lid:'66',name:'西野さら',imgSrc:'https://esthe-flower.net/photos/66/20250823071022-20250822_235237_806.jpg'},
  {lid:'67',name:'山下あい',imgSrc:'https://esthe-flower.net/photos/67/20251204114732-1760580677221.jpg'},
  {lid:'81',name:'神谷ひより',imgSrc:'https://esthe-flower.net/photos/81/20260108105032-20251214_201642_386.jpg'},
  {lid:'27',name:'白川ゆいか',imgSrc:'https://esthe-flower.net/photos/27/20250520131916-moto_27.png'},
  {lid:'44',name:'一ノ瀬りの',imgSrc:'https://esthe-flower.net/photos/44/20250520134100-moto_44.jpg'},
  {lid:'32',name:'桜井みやび',imgSrc:'https://esthe-flower.net/photos/32/20250520133707-moto_32.png'},
  {lid:'42',name:'小林まりか',imgSrc:'https://esthe-flower.net/photos/42/20250520133724-moto_42.jpg'},
  {lid:'56',name:'皐月ひよな',imgSrc:'https://esthe-flower.net/photos/56/20250531163130-20250531_162804_504.jpg'},
  {lid:'3',name:'橘るい',imgSrc:'https://esthe-flower.net/photos/3/20250520132021-moto_3.jpg'},
  {lid:'21',name:'如月紅亜',imgSrc:'https://esthe-flower.net/photos/21/20250520133518-moto_21.jpg'},
  {lid:'12',name:'米田りょうこ',imgSrc:'https://esthe-flower.net/photos/12/20250520131628-moto_12.jpg'},
  {lid:'11',name:'杉本まなみ',imgSrc:'https://esthe-flower.net/photos/11/20250520131829-moto_11.jpg'},
  {lid:'68',name:'千歳もも',imgSrc:null},
  {lid:'65',name:'真島れいな',imgSrc:null},
  {lid:'15',name:'泉ゆうき',imgSrc:'https://esthe-flower.net/photos/15/20250520131255-moto_15.jpg'},
  {lid:'20',name:'福田ひかり',imgSrc:'https://esthe-flower.net/photos/20/20250520131551-moto_20.jpg'},
  {lid:'45',name:'加賀ちひろ',imgSrc:'https://esthe-flower.net/photos/45/20250520133609-moto_45.jpg'},
  {lid:'39',name:'雨宮かれん',imgSrc:'https://esthe-flower.net/photos/39/20250520133746-moto_39.jpg'},
  {lid:'8',name:'一条かすみ',imgSrc:'https://esthe-flower.net/photos/8/20250520133550-moto_8.jpg'},
  {lid:'9',name:'高橋のぞみ',imgSrc:'https://esthe-flower.net/photos/9/20250520131850-moto_9.jpg'},
];

const MITSU = [
  {uid:'2816',name:'れい'},{uid:'2822',name:'なお'},{uid:'2823',name:'なこ'},
  {uid:'2815',name:'りりこ'},{uid:'2820',name:'しずく'},{uid:'4393',name:'ゆづき'},
  {uid:'4971',name:'いぶき'},{uid:'7772',name:'もか'},{uid:'6228',name:'あすか'},
  {uid:'6312',name:'くみ'},{uid:'6253',name:'なな'},{uid:'6326',name:'まりえ'},
  {uid:'6444',name:'ゆき'},{uid:'6873',name:'えいる'},{uid:'7547',name:'あや'},
  {uid:'7785',name:'るい'},{uid:'8092',name:'つばさ'},{uid:'8094',name:'かずは'},
  {uid:'8125',name:'みく'},{uid:'8219',name:'るな'},{uid:'8222',name:'うらん'},
];

const NONFICTION = [
  {lid:'148',name:'さくら',hasPhoto:false},{lid:'147',name:'なの',hasPhoto:false},
  {lid:'144',name:'ゆい',hasPhoto:true},{lid:'143',name:'さり',hasPhoto:true},
  {lid:'141',name:'れな',hasPhoto:true},{lid:'123',name:'めい',hasPhoto:true},
  {lid:'137',name:'なぎさ',hasPhoto:false},{lid:'136',name:'りの',hasPhoto:false},
  {lid:'134',name:'じゅら',hasPhoto:false},{lid:'101',name:'あおば',hasPhoto:true},
  {lid:'130',name:'らら',hasPhoto:true},{lid:'129',name:'まりん',hasPhoto:true},
  {lid:'128',name:'らむ',hasPhoto:true},{lid:'127',name:'えな',hasPhoto:true},
  {lid:'124',name:'ゆり',hasPhoto:true},{lid:'122',name:'もも',hasPhoto:true},
  {lid:'117',name:'ひなた',hasPhoto:true},{lid:'113',name:'ゆめ',hasPhoto:true},
  {lid:'111',name:'かずは',hasPhoto:true},{lid:'109',name:'るな',hasPhoto:true},
  {lid:'105',name:'はる',hasPhoto:true},{lid:'87',name:'さな',hasPhoto:true},
  {lid:'85',name:'ゆな',hasPhoto:true},{lid:'60',name:'えりか',hasPhoto:true},
  {lid:'7',name:'ゆあ',hasPhoto:true},{lid:'102',name:'いろは',hasPhoto:true},
  {lid:'126',name:'じゅり',hasPhoto:false},{lid:'4',name:'さら',hasPhoto:true},
  {lid:'3',name:'かんな',hasPhoto:true},
];

const MR_NAMES = ['野田','木村','草山','黒沢','一条','浦田','吉川','松下','瀬戸','桐月','伊藤','坂本','立花','竹原','戸田','福本','清水','石田','前川','太田','増田','葉月','細川','日野','川上','平子'];
const ESTELA_NAMES = ['しずく','あかり','ゆう','まどか','なお','あい','りこ','ゆか','えりか','みわ','エマ'];
const ABY_NAMES = ['リコ','レイナ','つむぎ','エリカ'];

const PALETTE = [
  {name:'野中あおい',src:'https://palette2022.com/wp/wp-content/uploads/2025/02/1000003393.jpg'},
  {name:'丸山ねここ',src:'https://palette2022.com/wp/wp-content/uploads/2025/06/1000004150.jpg'},
  {name:'南ちあき',src:'https://palette2022.com/wp/wp-content/uploads/2025/05/SNOW_20231124_220434_800.jpg'},
  {name:'二宮まりん',src:'https://palette2022.com/wp/wp-content/uploads/2025/03/1742978089548-1.jpg'},
  {name:'月島なな',src:'https://palette2022.com/wp/wp-content/uploads/2024/11/SNOW_20241124_133804_758-1.jpg'},
  {name:'平本かんな',src:'https://palette2022.com/wp/wp-content/uploads/2024/11/SNOW_20241117_170422_955-1.jpg'},
  {name:'山口りょうこ',src:'https://palette2022.com/wp/wp-content/uploads/2024/11/SNOW_20241103_155314_286.jpg'},
  {name:'春日えな',src:'https://palette2022.com/wp/wp-content/uploads/2024/10/SNOW_20241017_181452_750.jpg'},
  {name:'永野みほ',src:'https://palette2022.com/wp/wp-content/uploads/2024/09/SNOW_20240920_165824_380-1.jpg'},
  {name:'藤森りほ',src:'https://palette2022.com/wp/wp-content/uploads/2024/08/SNOW_20240814_161054_722.jpg'},
  {name:'竹内みほ',src:'https://palette2022.com/wp/wp-content/uploads/2024/06/SNOW_20240619_155222_813.jpg'},
  {name:'風間ゆり',src:'https://palette2022.com/wp/wp-content/uploads/2024/06/image_6483441.jpg'},
  {name:'七瀬めい',src:'https://palette2022.com/wp/wp-content/uploads/2024/05/SNOW_20240604_215909_857.jpg'},
  {name:'立花れん',src:'https://palette2022.com/wp/wp-content/uploads/2024/04/SNOW_20240421_135255_399.jpg'},
  {name:'山田ひより',src:'https://palette2022.com/wp/wp-content/uploads/2024/04/SNOW_20240410_161450_924.jpg'},
  {name:'松田ゆうこ',src:'https://palette2022.com/wp/wp-content/uploads/2023/11/108_144.jpg'},
  {name:'光吉なみ',src:'https://palette2022.com/wp/wp-content/uploads/2023/11/SNOW_20240722_165929_790.jpg'},
  {name:'三上はる',src:'https://palette2022.com/wp/wp-content/uploads/2023/10/SNOW_20231015_155700_779.jpg'},
  {name:'白濱れいか',src:'https://palette2022.com/wp/wp-content/uploads/2023/09/SNOW_20230922_184320_868.jpg'},
  {name:'相沢かれん',src:'https://palette2022.com/wp/wp-content/uploads/2023/08/SNOW_20231012_080749_985.jpg'},
  {name:'吉本あずさ',src:'https://palette2022.com/wp/wp-content/uploads/2023/08/instagram_profile_image.jpg'},
  {name:'椎名みい',src:'https://palette2022.com/wp/wp-content/uploads/2023/08/SNOW_20230922_184129_597.jpg'},
  {name:'宮脇はるか',src:'https://palette2022.com/wp/wp-content/uploads/2023/06/1689775919850.jpg'},
  {name:'本条みか',src:'https://palette2022.com/wp/wp-content/uploads/2023/02/SNOW_20230925_194206_564.jpg'},
];

const LEMARGE = [
  {name:'南由美',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2024/01/minami01.jpg'},
  {name:'月嶋澪',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2025/09/IMG_7814.jpeg'},
  {name:'水野千尋',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2026/04/IMG_9269.jpeg'},
  {name:'桜羽舞彩',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2024/08/IMG_1213.jpeg'},
  {name:'芹沢あみ',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2026/04/serizawa.jpg'},
  {name:'土屋愛',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2025/05/IMG_6481.jpeg'},
  {name:'神山翠月',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2024/11/IMG_1752.jpeg'},
  {name:'綾瀬るい',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2026/04/IMG_3976.jpeg'},
  {name:'朝倉美咲',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2026/03/IMG_9072.jpeg'},
  {name:'広瀬りほ',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2023/07/IMG_6338-1.jpeg'},
  {name:'星野ひより',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2026/04/IMG_4582.jpeg'},
  {name:'園村柚月',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2025/08/IMG_7516.jpeg'},
  {name:'中田ゆき',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2026/04/IMG_9235.jpeg'},
  {name:'水嶋えりか',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2026/01/IMG_8841.jpeg'},
  {name:'一条れあ',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2025/11/IMG_8284.jpeg'},
  {name:'灰原めぐみ',src:'https://le-marge.jp/wp_lemarge/wp-content/uploads/2026/04/IMG_3512.jpg'},
];

// --- Main ---
async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== LIVE RUN ===');

  // 1. Register shops
  console.log('\n[1] Registering shops...');
  for (const shop of SHOPS) {
    const imageUrl = await getOgImage(shop.website_url);
    const row = {
      id: shop.id,
      name: shop.name,
      website_url: shop.website_url,
      schedule_url: shop.schedule_url,
      image_url: imageUrl,
      raw_data: { area: shop.area, prefecture: shop.prefecture },
    };
    console.log(`  ${shop.id}: image=${imageUrl ? '✓' : 'null'}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('shops').upsert(row, { onConflict: 'id' });
      if (error) console.error(`  ERROR: ${error.message}`);
    }
  }

  // 2. Register therapists
  console.log('\n[2] Registering therapists...');
  let totalInserted = 0;

  // --- Sweeeety ---
  console.log('\n  [Sweeeety] 35名...');
  const sweeetyRows = await pAll(SWEEEETY.map(t => async () => {
    const imgUrl = `https://www.sweeeety.com/prof/${t.pid}/top.jpg`;
    const storageKey = `sweeeety_${t.pid}.jpg`;
    const storedUrl = DRY_RUN ? imgUrl : await uploadImage(imgUrl, storageKey, 'https://www.sweeeety.com/');
    return { id: `kumamoto_kumamoto_sweeeety_${t.name}`, shop_id: 'kumamoto_kumamoto_sweeeety', name: t.name, image_url: storedUrl };
  }), 5);
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').upsert(sweeetyRows, { onConflict: 'id' });
    if (error) console.error('Sweeeety error:', error.message);
  }
  console.log(`    => ${sweeetyRows.length}名 (${sweeetyRows.filter(r=>r.image_url).length}名画像あり)`);
  totalInserted += sweeetyRows.length;

  // --- Flower ---
  console.log('\n  [Flower] 46名...');
  const flowerRows = await pAll(FLOWER.map(t => async () => {
    let storedUrl = null;
    if (t.imgSrc) {
      const ext = t.imgSrc.split('.').pop().toLowerCase();
      const storageKey = `flower_${t.lid}.${ext}`;
      storedUrl = DRY_RUN ? t.imgSrc : await uploadImage(t.imgSrc, storageKey, 'https://esthe-flower.net/');
    }
    return { id: `kumamoto_kumamoto_flower_${t.name}`, shop_id: 'kumamoto_kumamoto_flower', name: t.name, image_url: storedUrl };
  }), 5);
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').upsert(flowerRows, { onConflict: 'id' });
    if (error) console.error('Flower error:', error.message);
  }
  console.log(`    => ${flowerRows.length}名 (${flowerRows.filter(r=>r.image_url).length}名画像あり)`);
  totalInserted += flowerRows.length;

  // --- 蜜 ---
  console.log('\n  [蜜] 21名...');
  const mitsuRows = await pAll(MITSU.map(t => async () => {
    const imgUrl = `https://www.esthe-mitsu.com/images/ml_11_1_${t.uid}.jpeg`;
    const storageKey = `mitsu_${t.uid}.jpg`;
    const storedUrl = DRY_RUN ? imgUrl : await uploadImage(imgUrl, storageKey, 'https://www.esthe-mitsu.com/');
    return { id: `kumamoto_kumamoto_mitsu_${t.name}`, shop_id: 'kumamoto_kumamoto_mitsu', name: t.name, image_url: storedUrl };
  }), 5);
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').upsert(mitsuRows, { onConflict: 'id' });
    if (error) console.error('蜜 error:', error.message);
  }
  console.log(`    => ${mitsuRows.length}名 (${mitsuRows.filter(r=>r.image_url).length}名画像あり)`);
  totalInserted += mitsuRows.length;

  // --- Nonfiction Spa ---
  console.log('\n  [Nonfiction Spa] 29名...');
  const nonfictionRows = await pAll(NONFICTION.map(t => async () => {
    let storedUrl = null;
    if (t.hasPhoto) {
      const imgUrl = `https://nonfiction-spa.com/photos/${t.lid}/raw_${t.lid}.jpg`;
      const storageKey = `nonfiction_${t.lid}.jpg`;
      storedUrl = DRY_RUN ? imgUrl : await uploadImage(imgUrl, storageKey, 'https://nonfiction-spa.com/');
    }
    return { id: `kumamoto_kumamoto_nonfiction_spa_${t.name}`, shop_id: 'kumamoto_kumamoto_nonfiction_spa', name: t.name, image_url: storedUrl };
  }), 5);
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').upsert(nonfictionRows, { onConflict: 'id' });
    if (error) console.error('Nonfiction error:', error.message);
  }
  console.log(`    => ${nonfictionRows.length}名 (${nonfictionRows.filter(r=>r.image_url).length}名画像あり)`);
  totalInserted += nonfictionRows.length;

  // --- M&R (names only) ---
  console.log('\n  [M&R] 26名 (names only)...');
  const mrRows = MR_NAMES.map(name => ({ id: `kumamoto_kumamoto_mr_${name}`, shop_id: 'kumamoto_kumamoto_mr', name, image_url: null }));
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').upsert(mrRows, { onConflict: 'id' });
    if (error) console.error('M&R error:', error.message);
  }
  console.log(`    => ${mrRows.length}名`);
  totalInserted += mrRows.length;

  // --- Estela (names only) ---
  console.log('\n  [Estela] 11名 (names only)...');
  const estelaRows = ESTELA_NAMES.map(name => ({ id: `kumamoto_kumamoto_estela_${name}`, shop_id: 'kumamoto_kumamoto_estela', name, image_url: null }));
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').upsert(estelaRows, { onConflict: 'id' });
    if (error) console.error('Estela error:', error.message);
  }
  console.log(`    => ${estelaRows.length}名`);
  totalInserted += estelaRows.length;

  // --- Aby (names only) ---
  console.log('\n  [Aby] 4名 (names only)...');
  const abyRows = ABY_NAMES.map(name => ({ id: `kumamoto_kumamoto_aby_${name}`, shop_id: 'kumamoto_kumamoto_aby', name, image_url: null }));
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').upsert(abyRows, { onConflict: 'id' });
    if (error) console.error('Aby error:', error.message);
  }
  console.log(`    => ${abyRows.length}名`);
  totalInserted += abyRows.length;

  // --- palette (WP uploads) ---
  console.log('\n  [palette] 24名...');
  const paletteRows = await pAll(PALETTE.map(t => async () => {
    const filename = t.src.split('/').pop();
    const ext = filename.split('.').pop().toLowerCase();
    const storageKey = `palette_${filename}`;
    const storedUrl = DRY_RUN ? t.src : await uploadImage(t.src, storageKey, 'https://palette2022.com/');
    return { id: `kumamoto_kumamoto_palette_${t.name}`, shop_id: 'kumamoto_kumamoto_palette', name: t.name, image_url: storedUrl };
  }), 5);
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').upsert(paletteRows, { onConflict: 'id' });
    if (error) console.error('palette error:', error.message);
  }
  console.log(`    => ${paletteRows.length}名 (${paletteRows.filter(r=>r.image_url).length}名画像あり)`);
  totalInserted += paletteRows.length;

  // --- Le Marge (WP uploads) ---
  console.log('\n  [Le Marge] 16名...');
  const lemargeRows = await pAll(LEMARGE.map(t => async () => {
    const filename = t.src.split('/').pop();
    const storageKey = `lemarge_${filename}`;
    const storedUrl = DRY_RUN ? t.src : await uploadImage(t.src, storageKey, 'https://le-marge.jp/');
    return { id: `kumamoto_kumamoto_lemarge_${t.name}`, shop_id: 'kumamoto_kumamoto_lemarge', name: t.name, image_url: storedUrl };
  }), 5);
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').upsert(lemargeRows, { onConflict: 'id' });
    if (error) console.error('Le Marge error:', error.message);
  }
  console.log(`    => ${lemargeRows.length}名 (${lemargeRows.filter(r=>r.image_url).length}名画像あり)`);
  totalInserted += lemargeRows.length;

  console.log(`\n=== DONE: ${SHOPS.length}店舗・${totalInserted}名 ===`);
}

main().catch(console.error);
