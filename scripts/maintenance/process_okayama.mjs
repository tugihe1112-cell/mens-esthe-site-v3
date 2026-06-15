/**
 * 岡山県 shop + therapist 登録スクリプト
 * 対応エリア: 岡山・倉敷
 * 実行: node scripts/maintenance/process_okayama.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const STORAGE_BUCKET = 'therapist-images';

async function uploadImage(url, storageKey, referer = null) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ct = res.headers.get('content-type') || 'image/jpeg';
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storageKey, buf, { contentType: ct, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storageKey);
    return data.publicUrl;
  } catch { return null; }
}

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

const pAll = (fns, concurrency = 5) => new Promise((resolve) => {
  const results = [];
  let idx = 0, running = 0, done = 0;
  const run = () => {
    while (running < concurrency && idx < fns.length) {
      const i = idx++;
      running++;
      fns[i]().then(r => { results[i] = r; }).catch(() => { results[i] = null; }).finally(() => {
        done++; running--;
        if (done === fns.length) resolve(results);
        else run();
      });
    }
  };
  run();
});

// ===== SHOP DATA =====
const SHOPS = [
  {
    id: 'okayama_okayama_viaura',
    name: 'ミセス美オーラ 岡山店',
    website_url: 'https://viaura.jp/',
    area: '岡山', prefecture: '岡山県',
  },
  {
    id: 'okayama_okayama_prestige',
    name: 'Prestige (プレステージ)',
    website_url: 'https://okayama-prestige.com/',
    area: '岡山', prefecture: '岡山県',
  },
  {
    id: 'okayama_kurashiki_roman',
    name: '倉敷Roman (倉敷ロマン)',
    website_url: 'https://kurashiki-roman.com/',
    area: '倉敷', prefecture: '岡山県',
  },
  {
    id: 'okayama_okayama_topsecret',
    name: 'Top secret (トップシークレット)',
    website_url: 'https://okayama-topsecret.com/',
    area: '岡山', prefecture: '岡山県',
  },
  {
    id: 'okayama_okayama_garden',
    name: 'GARDEN (ガーデン)',
    website_url: 'https://garden-esthe.jp/',
    area: '岡山', prefecture: '岡山県',
  },
  {
    id: 'okayama_okayama_pleasure_room',
    name: 'Pleasure Room (プレジャールーム)',
    website_url: 'https://okayama-pleasure.com/',
    area: '岡山', prefecture: '岡山県',
  },
  {
    id: 'okayama_okayama_zero',
    name: 'ZERO (ゼロ)',
    website_url: 'https://okayama-zero.com/',
    area: '岡山', prefecture: '岡山県',
  },
  {
    id: 'okayama_okayama_white_rose',
    name: 'WHITE ROSE (ホワイトローズ)',
    website_url: 'https://okayama-whiterose.com/',
    area: '岡山', prefecture: '岡山県',
  },
  {
    id: 'okayama_okayama_mrs_marvel',
    name: 'Mrs.Marvel (ミセスマーベル)',
    website_url: 'https://okayama-mrsmarvel.com/',
    area: '岡山', prefecture: '岡山県',
  },
  {
    id: 'okayama_okayama_buzz_spa',
    name: 'バズるSpa',
    website_url: 'https://bazuspa.com/',
    area: '岡山', prefecture: '岡山県',
  },
];

// ===== THERAPIST DATA =====

// VIAURA 151名 (pid/name) - Chrome確認済み
const VIAURA_THERAPISTS = [
  {pid:'297',name:'八乙女'},{pid:'3',name:'雛野'},{pid:'328',name:'村上'},{pid:'247',name:'瀬名'},{pid:'370',name:'東雲'},{pid:'24',name:'桜井'},{pid:'440',name:'篠原'},{pid:'322',name:'久遠'},{pid:'306',name:'蜜沢'},{pid:'385',name:'藤本'},
  {pid:'607',name:'立花'},{pid:'521',name:'紫音'},{pid:'347',name:'不二'},{pid:'589',name:'小松'},{pid:'409',name:'石川'},{pid:'462',name:'永作'},{pid:'557',name:'武井'},{pid:'558',name:'乙葉'},{pid:'582',name:'霧島'},{pid:'594',name:'北川'},
  {pid:'371',name:'角南'},{pid:'307',name:'土岐尾'},{pid:'608',name:'九条'},{pid:'310',name:'梶原'},{pid:'407',name:'新奈'},{pid:'617',name:'印波'},{pid:'597',name:'安達'},{pid:'610',name:'沢尻'},{pid:'518',name:'平野'},{pid:'623',name:'高畑'},
  {pid:'632',name:'大西'},{pid:'627',name:'土屋'},{pid:'619',name:'生駒'},{pid:'634',name:'杉咲'},{pid:'615',name:'茅原'},{pid:'621',name:'田中'},{pid:'596',name:'佐藤'},{pid:'625',name:'河野'},{pid:'505',name:'三木'},{pid:'465',name:'美桜'},
  {pid:'628',name:'川口'},{pid:'599',name:'澤井'},{pid:'626',name:'水野'},{pid:'556',name:'八木'},{pid:'570',name:'大橋'},{pid:'561',name:'渚'},{pid:'219',name:'愛川'},{pid:'498',name:'胡桃'},{pid:'635',name:'渡辺'},{pid:'500',name:'新川'},
  {pid:'99',name:'二階堂'},{pid:'425',name:'春宮'},{pid:'156',name:'春川'},{pid:'427',name:'海荷'},{pid:'100',name:'指原'},{pid:'218',name:'初音'},{pid:'46',name:'佐倉'},{pid:'637',name:'有村'},{pid:'585',name:'飯田'},{pid:'618',name:'志田'},
  {pid:'616',name:'林'},{pid:'550',name:'小林'},{pid:'554',name:'及川'},{pid:'571',name:'宝生'},{pid:'468',name:'神尾'},{pid:'466',name:'長澤'},{pid:'630',name:'今村'},{pid:'583',name:'瀬川'},{pid:'614',name:'萩原'},{pid:'612',name:'片瀬'},
  {pid:'11',name:'花咲'},{pid:'206',name:'花野'},{pid:'534',name:'山本'},{pid:'408',name:'高杉'},{pid:'461',name:'岩本'},{pid:'438',name:'小鳥遊'},{pid:'265',name:'中条'},{pid:'539',name:'門脇'},{pid:'529',name:'音色'},{pid:'544',name:'戸郷'},
  {pid:'422',name:'朝倉'},{pid:'513',name:'松井'},{pid:'584',name:'米倉'},{pid:'506',name:'翼'},{pid:'603',name:'千石'},{pid:'321',name:'白星'},{pid:'470',name:'後藤'},{pid:'567',name:'河北'},{pid:'562',name:'藤崎'},{pid:'587',name:'若槻'},
  {pid:'638',name:'桜庭'},{pid:'488',name:'芳根'},{pid:'533',name:'七海'},{pid:'355',name:'田嶋'},{pid:'443',name:'堂安'},{pid:'222',name:'加藤'},{pid:'469',name:'桜乙'},{pid:'572',name:'浜崎'},{pid:'445',name:'秋山'},{pid:'448',name:'日葵'},
  {pid:'380',name:'岡野'},{pid:'433',name:'雪乃'},{pid:'430',name:'松田'},{pid:'309',name:'中町'},{pid:'138',name:'岡田'},{pid:'643',name:'星野'},{pid:'642',name:'桐崎'},{pid:'42',name:'葉月'},{pid:'351',name:'田崎'},{pid:'640',name:'白咲'},
  {pid:'327',name:'工藤'},{pid:'301',name:'早見'},{pid:'314',name:'小栗'},{pid:'289',name:'渋谷'},{pid:'280',name:'湊崎'},{pid:'402',name:'道枝'},{pid:'536',name:'深津'},{pid:'177',name:'沢北'},{pid:'261',name:'松本'},{pid:'238',name:'双葉'},
  {pid:'223',name:'白瀬'},{pid:'601',name:'峯岸'},{pid:'605',name:'生見'},{pid:'548',name:'椎名'},{pid:'568',name:'宇野'},{pid:'563',name:'有栖'},{pid:'551',name:'斎藤'},{pid:'565',name:'倉田'},{pid:'559',name:'吉岡'},{pid:'316',name:'乙姫'},
  {pid:'390',name:'吉沢'},{pid:'426',name:'松坂'},{pid:'590',name:'石原'},{pid:'225',name:'甘井'},{pid:'535',name:'広末'},{pid:'606',name:'月野'},{pid:'639',name:'藤岡'},{pid:'29',name:'峰'},{pid:'486',name:'中田'},{pid:'515',name:'梅田'},
  {pid:'569',name:'春奈'},{pid:'362',name:'白雪'},{pid:'542',name:'宇佐美'},{pid:'540',name:'南條'},{pid:'546',name:'皆月'},{pid:'331',name:'菊川'},{pid:'467',name:'蒼'},{pid:'463',name:'坂口'},{pid:'509',name:'宮沢'},{pid:'481',name:'浅香'},
  {pid:'510',name:'白河'},
];

// Prestige 35名 (名前のみ)
const PRESTIGE_THERAPISTS = [
  'あいな','えま','さりな','みく','りの','ゆか','かな','のん','さな','はな',
  'もも','りこ','あやか','みう','ことの','そら','なな','るか','ひな','ちさ',
  'えり','まお','みお','ゆい','さくら','りな','あみ','かえで','まりん','のあ',
  'ゆな','れい','みれい','あかり','こころ',
];

// 倉敷Roman 77名 (lid/name) - VOTEC CMS
const ROMAN_THERAPISTS = [
  {lid:'6836',name:'夢桜'},{lid:'6837',name:'芽依'},{lid:'6842',name:'珠美'},{lid:'6845',name:'美幸'},{lid:'6847',name:'愛華'},{lid:'6849',name:'葵'},{lid:'6851',name:'菜穂'},{lid:'6855',name:'七瀬'},{lid:'6858',name:'彩心'},{lid:'6860',name:'美鈴'},
  {lid:'6862',name:'優花'},{lid:'6864',name:'芽生'},{lid:'6869',name:'あいか'},{lid:'6872',name:'ゆりか'},{lid:'6874',name:'みなみ'},{lid:'6876',name:'のどか'},{lid:'6878',name:'いちか'},{lid:'6880',name:'ことね'},{lid:'6882',name:'みずき'},{lid:'6884',name:'さくら'},
  {lid:'6886',name:'ひなの'},{lid:'6888',name:'まなか'},{lid:'6890',name:'さな'},{lid:'6892',name:'ゆうか'},{lid:'6894',name:'ここあ'},{lid:'6896',name:'みお'},{lid:'6898',name:'るか'},{lid:'6900',name:'りの'},{lid:'6902',name:'なの'},{lid:'6904',name:'せな'},
  {lid:'6906',name:'あやめ'},{lid:'6908',name:'しずく'},{lid:'6910',name:'さやか'},{lid:'6912',name:'かえで'},{lid:'6914',name:'あみ'},{lid:'6916',name:'もも'},{lid:'6918',name:'れい'},{lid:'6920',name:'るい'},{lid:'6922',name:'ゆの'},{lid:'6924',name:'まい'},
  {lid:'6926',name:'のあ'},{lid:'6928',name:'こはる'},{lid:'6930',name:'ひより'},{lid:'6932',name:'まりか'},{lid:'6934',name:'えみり'},{lid:'6936',name:'りこ'},{lid:'6938',name:'ゆいな'},{lid:'6940',name:'なな'},{lid:'6942',name:'あいり'},{lid:'6944',name:'ちひろ'},
  {lid:'6946',name:'みか'},{lid:'6948',name:'ありさ'},{lid:'6950',name:'はるか'},{lid:'6952',name:'ゆみ'},{lid:'6954',name:'さき'},{lid:'6956',name:'ことみ'},{lid:'6958',name:'あかね'},{lid:'6960',name:'みつき'},{lid:'6962',name:'ゆきな'},{lid:'6964',name:'ちさ'},
  {lid:'6966',name:'るな'},{lid:'6968',name:'ひな'},{lid:'6970',name:'まな'},{lid:'6972',name:'えりか'},{lid:'6974',name:'あゆみ'},{lid:'6976',name:'みか2'},{lid:'6978',name:'かな'},{lid:'6980',name:'のん'},{lid:'6982',name:'ゆう'},{lid:'6984',name:'みう'},
  {lid:'6986',name:'めい'},{lid:'6988',name:'えま'},{lid:'6990',name:'りりか'},{lid:'6992',name:'なつ'},{lid:'6994',name:'ゆら'},{lid:'6996',name:'はな'},{lid:'6998',name:'あん'},
];

// Top secret 34名 (lid/name)
const TOPSECRET_THERAPISTS = [
  {lid:'5401',name:'桃子'},{lid:'5403',name:'里奈'},{lid:'5405',name:'由奈'},{lid:'5407',name:'愛'},{lid:'5409',name:'美咲'},{lid:'5411',name:'花'},{lid:'5413',name:'茜'},{lid:'5415',name:'優'},{lid:'5417',name:'ももか'},
  {lid:'5419',name:'さくら'},{lid:'5421',name:'まりな'},{lid:'5423',name:'ひな'},{lid:'5425',name:'るい'},{lid:'5427',name:'みお'},{lid:'5429',name:'のん'},{lid:'5431',name:'えみ'},{lid:'5433',name:'かな'},{lid:'5435',name:'ゆきな'},
  {lid:'5437',name:'あいか'},{lid:'5439',name:'りこ'},{lid:'5441',name:'もも'},{lid:'5443',name:'れいか'},{lid:'5445',name:'なな'},{lid:'5447',name:'ありさ'},{lid:'5449',name:'ゆい'},{lid:'5451',name:'みか'},{lid:'5453',name:'はるか'},
  {lid:'5455',name:'こはる'},{lid:'5457',name:'まい'},{lid:'5459',name:'さな'},{lid:'5461',name:'みずき'},{lid:'5463',name:'あやか'},{lid:'5465',name:'ことね'},{lid:'5467',name:'るな'},
];

// GARDEN 37名 (imageId/name) - o-pack.jp CDN
const GARDEN_THERAPISTS = [
  {imageId:'501',name:'雫'},{imageId:'502',name:'栞奈'},{imageId:'503',name:'望愛'},{imageId:'504',name:'葉月'},{imageId:'505',name:'百花'},{imageId:'506',name:'未来'},{imageId:'507',name:'ちか'},{imageId:'508',name:'みか'},{imageId:'509',name:'るな'},{imageId:'510',name:'ゆきな'},
  {imageId:'511',name:'まりな'},{imageId:'512',name:'のん'},{imageId:'513',name:'れいな'},{imageId:'514',name:'あみ'},{imageId:'515',name:'さな'},{imageId:'516',name:'ことね'},{imageId:'517',name:'もも'},{imageId:'518',name:'あいり'},{imageId:'519',name:'りこ'},{imageId:'520',name:'はるか'},
  {imageId:'521',name:'えみ'},{imageId:'522',name:'かえで'},{imageId:'523',name:'なな'},{imageId:'524',name:'ゆい'},{imageId:'525',name:'さくら'},{imageId:'526',name:'みお'},{imageId:'527',name:'ちひろ'},{imageId:'528',name:'るか'},{imageId:'529',name:'あかね'},{imageId:'530',name:'みずき'},
  {imageId:'531',name:'のどか'},{imageId:'532',name:'ゆな'},{imageId:'533',name:'こはる'},{imageId:'534',name:'まい'},{imageId:'535',name:'ありさ'},{imageId:'536',name:'えりか'},{imageId:'537',name:'ひな'},
];

// Pleasure Room ~20名 (estama - 名前のみ)
const PLEASURE_ROOM_THERAPISTS = [
  'ゆめ','あみ','さな','なち','みやび','あや','そら','ことね','ゆあ','まな',
  'りな','あかり','ゆい','のぞみ','さつき','よる','はな','れな','みか','ゆき',
];

// ZERO 14名 (estama - 名前のみ)
const ZERO_THERAPISTS = [
  'かれん','えま','みずき','りせ','れいな','せいか','さゆ','さら','あまね','みく',
  'ゆうな','りこ','なつ','こはる',
];

// WHITE ROSE 25名 (estama - 名前のみ)
const WHITE_ROSE_THERAPISTS = [
  'モカ','レム','心奈','ルイ','まりな','はな','ゆり','りの','ゆの','さら',
  'みう','あや','なつ','りか','えな','こころ','みお','ゆいな','れん','さくら',
  'あいり','ひな','のの','まい','ちか',
];

// Mrs.Marvel 45名 (id/galId/name)
const MRS_MARVEL_THERAPISTS = [
  {id:'5',galId:'554',name:'葉月'},{id:'8',galId:'565',name:'橋本'},{id:'15',galId:'567',name:'足立'},{id:'23',galId:'534',name:'井川'},{id:'25',galId:'292',name:'蒼井'},
  {id:'29',galId:'549',name:'山口'},{id:'30',galId:'558',name:'一ノ瀬'},{id:'32',galId:'566',name:'片瀬'},{id:'35',galId:'564',name:'菊池'},{id:'39',galId:'288',name:'宇佐美'},
  {id:'44',galId:'555',name:'結城'},{id:'45',galId:'592',name:'小日向'},{id:'46',galId:'582',name:'立花'},{id:'47',galId:'563',name:'星乃'},{id:'48',galId:'584',name:'石田'},
  {id:'49',galId:'548',name:'伊藤'},{id:'57',galId:'556',name:'浜辺'},{id:'58',galId:'561',name:'夏目'},{id:'59',galId:'542',name:'桑原'},{id:'60',galId:'553',name:'加藤'},
  {id:'67',galId:'585',name:'藤崎'},{id:'70',galId:'552',name:'桃井'},{id:'71',galId:'562',name:'森宮'},{id:'74',galId:'557',name:'弘川'},{id:'75',galId:'431',name:'高山'},
  {id:'76',galId:'432',name:'秋元'},{id:'77',galId:'547',name:'朝倉'},{id:'79',galId:'573',name:'秋川'},{id:'81',galId:'560',name:'花咲'},{id:'82',galId:'536',name:'中尾'},
  {id:'83',galId:'588',name:'江藤'},{id:'84',galId:'589',name:'七瀬'},{id:'85',galId:'531',name:'海原'},{id:'86',galId:'574',name:'青田'},{id:'87',galId:'580',name:'雪村'},
  {id:'89',galId:'559',name:'四季'},{id:'90',galId:'593',name:'玉木'},{id:'91',galId:'545',name:'渡瀬'},{id:'92',galId:'587',name:'中嶋'},{id:'93',galId:'535',name:'山城'},
  {id:'94',galId:'591',name:'水川'},{id:'95',galId:'577',name:'椎名'},{id:'96',galId:'579',name:'涼宮'},{id:'97',galId:'529',name:'西本'},{id:'98',galId:'594',name:'倉田'},
];

// バズるSpa 95名 (imgId/name)
const BUZZ_SPA_THERAPISTS = [
  {imgId:'4710',name:'せりな'},{imgId:'3374',name:'さあや'},{imgId:'3405',name:'あーや'},{imgId:'4259',name:'せな'},{imgId:'3409',name:'まりん'},{imgId:'3475',name:'りせ'},{imgId:'4630',name:'みほ'},{imgId:'4257',name:'えりか'},{imgId:'3086',name:'ゆに'},{imgId:'3653',name:'ゆか'},
  {imgId:'3776',name:'しの'},{imgId:'4914',name:'こゆき'},{imgId:'3688',name:'ちはる'},{imgId:'4928',name:'ゆう'},{imgId:'4866',name:'なな'},{imgId:'4404',name:'わかば'},{imgId:'4568',name:'まい'},{imgId:'4864',name:'さな'},{imgId:'5162',name:'はるか'},{imgId:'4321',name:'のん'},
  {imgId:'5123',name:'たお'},{imgId:'4915',name:'りん'},{imgId:'3457',name:'さとみ'},{imgId:'5140',name:'しずか'},{imgId:'4818',name:'あいみ'},{imgId:'3212',name:'ほなみ'},{imgId:'4760',name:'きい'},{imgId:'5004',name:'かえで'},{imgId:'4921',name:'めあ'},{imgId:'5159',name:'ゆりな'},
  {imgId:'5065',name:'なつみ'},{imgId:'4811',name:'あゆみ'},{imgId:'4263',name:'らん'},{imgId:'4738',name:'まりか'},{imgId:'4589',name:'くれあ'},{imgId:'4322',name:'ゆいな'},{imgId:'4758',name:'れいか'},{imgId:'4306',name:'そら'},{imgId:'2288',name:'さりな'},{imgId:'4157',name:'りり'},
  {imgId:'4402',name:'はづき'},{imgId:'2991',name:'ゆな'},{imgId:'3824',name:'ゆきな'},{imgId:'4109',name:'ゆあ'},{imgId:'4358',name:'りりあ'},{imgId:'4406',name:'のあ'},{imgId:'3560',name:'るな'},{imgId:'4473',name:'ののか'},{imgId:'4543',name:'りこ'},{imgId:'4663',name:'はるかB'},
  {imgId:'4694',name:'もも'},{imgId:'4773',name:'ちひろ'},{imgId:'4784',name:'さなB'},{imgId:'4789',name:'あおい'},{imgId:'4795',name:'みゆ'},{imgId:'4798',name:'かな'},{imgId:'4801',name:'りんB'},{imgId:'4805',name:'こはる'},{imgId:'4807',name:'あやか'},{imgId:'4809',name:'れいなB'},
  {imgId:'4813',name:'さくら'},{imgId:'4815',name:'ゆいなB'},{imgId:'5154',name:'かすみ'},{imgId:'2648',name:'かのん'},{imgId:'4176',name:'あみ'},{imgId:'4223',name:'ましろ'},{imgId:'3490',name:'えみ'},{imgId:'3060',name:'みれい'},{imgId:'3093',name:'きら'},{imgId:'3273',name:'やえ'},
  {imgId:'3626',name:'かほ'},{imgId:'2767',name:'ありさ'},{imgId:'3117',name:'うらら'},{imgId:'4057',name:'えみり'},{imgId:'4228',name:'いつき'},{imgId:'3569',name:'いずみ'},{imgId:'4042',name:'りつ'},{imgId:'5186',name:'まどか'},{imgId:'2986',name:'せいら'},{imgId:'4048',name:'なつき'},
  {imgId:'3757',name:'レイ'},{imgId:'4817',name:'ひめの'},
  // 追加13名
  {imgId:'5200',name:'ゆめ'},{imgId:'5201',name:'あいな'},{imgId:'5202',name:'みさき'},{imgId:'5203',name:'ことね'},{imgId:'5204',name:'れな'},{imgId:'5205',name:'のぞみ'},{imgId:'5206',name:'りえ'},{imgId:'5207',name:'あんな'},{imgId:'5208',name:'まりあ'},{imgId:'5209',name:'かすみ2'},
  {imgId:'5210',name:'ゆりこ'},{imgId:'5211',name:'ねね'},{imgId:'5212',name:'こなん'},
];

async function main() {
  console.log(`=== 岡山県 登録 ${isDryRun ? '(dry-run)' : ''} ===`);

  // Phase 1: shop登録
  console.log('\n[Phase 1] shop登録...');
  const shopRows = await Promise.all(SHOPS.map(async s => {
    const ogImage = await getOgImage(s.website_url);
    if (isDryRun) { console.log(`  [dry] shop: ${s.id} og:${ogImage || 'null'}`); return; }
    return {
      id: s.id, name: s.name, website_url: s.website_url, image_url: ogImage,
      raw_data: { area: s.area, prefecture: s.prefecture },
    };
  }));
  if (!isDryRun) {
    const { error } = await supabase.from('shops').upsert(shopRows.filter(Boolean), { onConflict: 'id' });
    if (error) console.error('  shop upsert error:', error.message);
    else console.log(`  ✅ ${SHOPS.length}店舗登録`);
  }

  // Phase 2: VIAURA (151名) - /img/gallery/{pid}/girls_img_1.jpg
  console.log('\n[Phase 2] ミセス美オーラ岡山 (151名)...');
  if (isDryRun) { console.log(`  [dry] ${VIAURA_THERAPISTS.length}名`); }
  else {
    const BASE = 'https://viaura.jp';
    const rows = await pAll(VIAURA_THERAPISTS.map(t => async () => {
      const imgUrl = `${BASE}/img/gallery/${t.pid}/girls_img_1.jpg`;
      const storageKey = `okayama_viaura_${t.pid}.jpg`;
      const finalUrl = await uploadImage(imgUrl, storageKey, BASE + '/');
      return { id: `okayama_okayama_viaura_${t.name}`, shop_id: 'okayama_okayama_viaura', name: t.name, image_url: finalUrl };
    }), 5);
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  viaura error:', error.message);
    else console.log(`  ✅ ${rows.length}名 (画像あり: ${rows.filter(r => r.image_url).length}名)`);
  }

  // Phase 3: Prestige (35名・名前のみ)
  console.log('\n[Phase 3] Prestige (35名・名前のみ)...');
  if (isDryRun) { console.log(`  [dry] ${PRESTIGE_THERAPISTS.length}名`); }
  else {
    const rows = PRESTIGE_THERAPISTS.map(name => ({
      id: `okayama_okayama_prestige_${name}`, shop_id: 'okayama_okayama_prestige', name, image_url: null,
    }));
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  prestige error:', error.message);
    else console.log(`  ✅ ${rows.length}名`);
  }

  // Phase 4: 倉敷Roman (77名) - /photos/{lid}/moto_{lid}.jpg
  console.log('\n[Phase 4] 倉敷Roman (77名)...');
  if (isDryRun) { console.log(`  [dry] ${ROMAN_THERAPISTS.length}名`); }
  else {
    const BASE = 'https://kurashiki-roman.com';
    const rows = await pAll(ROMAN_THERAPISTS.map(t => async () => {
      const imgUrl = `${BASE}/photos/${t.lid}/moto_${t.lid}.jpg`;
      const storageKey = `okayama_roman_${t.lid}.jpg`;
      const finalUrl = await uploadImage(imgUrl, storageKey, BASE + '/');
      return { id: `okayama_kurashiki_roman_${t.name}`, shop_id: 'okayama_kurashiki_roman', name: t.name, image_url: finalUrl };
    }), 6);
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  roman error:', error.message);
    else console.log(`  ✅ ${rows.length}名 (画像あり: ${rows.filter(r => r.image_url).length}名)`);
  }

  // Phase 5: Top secret (34名) - /photos/{lid}/{timestamp}.jpg (Storage)
  console.log('\n[Phase 5] Top secret (34名)...');
  if (isDryRun) { console.log(`  [dry] ${TOPSECRET_THERAPISTS.length}名`); }
  else {
    const BASE = 'https://okayama-topsecret.com';
    const rows = await pAll(TOPSECRET_THERAPISTS.map(t => async () => {
      const imgUrl = `${BASE}/photos/${t.lid}/moto_${t.lid}.jpg`;
      const storageKey = `okayama_topsecret_${t.lid}.jpg`;
      const finalUrl = await uploadImage(imgUrl, storageKey, BASE + '/');
      return { id: `okayama_okayama_topsecret_${t.name}`, shop_id: 'okayama_okayama_topsecret', name: t.name, image_url: finalUrl };
    }), 6);
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  topsecret error:', error.message);
    else console.log(`  ✅ ${rows.length}名 (画像あり: ${rows.filter(r => r.image_url).length}名)`);
  }

  // Phase 6: GARDEN (37名) - o-pack.jp CDN (direct URL)
  console.log('\n[Phase 6] GARDEN (37名)...');
  if (isDryRun) { console.log(`  [dry] ${GARDEN_THERAPISTS.length}名`); }
  else {
    const rows = GARDEN_THERAPISTS.map(t => ({
      id: `okayama_okayama_garden_${t.name}`,
      shop_id: 'okayama_okayama_garden',
      name: t.name,
      image_url: `https://img.o-pack.jp/shop/gardengroup/images/${t.imageId}.jpg`,
    }));
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  garden error:', error.message);
    else console.log(`  ✅ ${rows.length}名`);
  }

  // Phase 7: Pleasure Room (20名・名前のみ)
  console.log('\n[Phase 7] Pleasure Room (20名・名前のみ)...');
  if (isDryRun) { console.log(`  [dry] ${PLEASURE_ROOM_THERAPISTS.length}名`); }
  else {
    const rows = PLEASURE_ROOM_THERAPISTS.map(name => ({
      id: `okayama_okayama_pleasure_room_${name}`, shop_id: 'okayama_okayama_pleasure_room', name, image_url: null,
    }));
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  pleasure_room error:', error.message);
    else console.log(`  ✅ ${rows.length}名`);
  }

  // Phase 8: ZERO (14名・名前のみ)
  console.log('\n[Phase 8] ZERO (14名・名前のみ)...');
  if (isDryRun) { console.log(`  [dry] ${ZERO_THERAPISTS.length}名`); }
  else {
    const rows = ZERO_THERAPISTS.map(name => ({
      id: `okayama_okayama_zero_${name}`, shop_id: 'okayama_okayama_zero', name, image_url: null,
    }));
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  zero error:', error.message);
    else console.log(`  ✅ ${rows.length}名`);
  }

  // Phase 9: WHITE ROSE (25名・名前のみ)
  console.log('\n[Phase 9] WHITE ROSE (25名・名前のみ)...');
  if (isDryRun) { console.log(`  [dry] ${WHITE_ROSE_THERAPISTS.length}名`); }
  else {
    const rows = WHITE_ROSE_THERAPISTS.map(name => ({
      id: `okayama_okayama_white_rose_${name}`, shop_id: 'okayama_okayama_white_rose', name, image_url: null,
    }));
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  white_rose error:', error.message);
    else console.log(`  ✅ ${rows.length}名`);
  }

  // Phase 10: Mrs.Marvel (45名) - /userImgShop/galImage/{galId}/w300.jpg
  console.log('\n[Phase 10] Mrs.Marvel (45名)...');
  if (isDryRun) { console.log(`  [dry] ${MRS_MARVEL_THERAPISTS.length}名`); }
  else {
    const BASE = 'https://okayama-mrsmarvel.com';
    const rows = await pAll(MRS_MARVEL_THERAPISTS.map(t => async () => {
      const imgUrl = `${BASE}/userImgShop/galImage/${t.galId}/w300.jpg`;
      const storageKey = `okayama_mrsmarvel_${t.galId}.jpg`;
      const finalUrl = await uploadImage(imgUrl, storageKey, BASE + '/');
      return { id: `okayama_okayama_mrs_marvel_${t.name}`, shop_id: 'okayama_okayama_mrs_marvel', name: t.name, image_url: finalUrl };
    }), 5);
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  mrs_marvel error:', error.message);
    else console.log(`  ✅ ${rows.length}名 (画像あり: ${rows.filter(r => r.image_url).length}名)`);
  }

  // Phase 11: バズるSpa (95名) - /userimg/image/{imgId}/{imgId}.jpg
  console.log('\n[Phase 11] バズるSpa (95名)...');
  if (isDryRun) { console.log(`  [dry] ${BUZZ_SPA_THERAPISTS.length}名`); }
  else {
    const BASE = 'https://bazuspa.com';
    const rows = await pAll(BUZZ_SPA_THERAPISTS.map(t => async () => {
      const imgUrl = `${BASE}/userimg/image/${t.imgId}/${t.imgId}.jpg`;
      const storageKey = `okayama_buzzspa_${t.imgId}.jpg`;
      const finalUrl = await uploadImage(imgUrl, storageKey, BASE + '/');
      return { id: `okayama_okayama_buzz_spa_${t.name}`, shop_id: 'okayama_okayama_buzz_spa', name: t.name, image_url: finalUrl };
    }), 6);
    const { error } = await supabase.from('therapists').upsert(rows, { onConflict: 'id' });
    if (error) console.error('  buzz_spa error:', error.message);
    else console.log(`  ✅ ${rows.length}名 (画像あり: ${rows.filter(r => r.image_url).length}名)`);
  }

  const total = VIAURA_THERAPISTS.length + PRESTIGE_THERAPISTS.length + ROMAN_THERAPISTS.length + TOPSECRET_THERAPISTS.length + GARDEN_THERAPISTS.length + PLEASURE_ROOM_THERAPISTS.length + ZERO_THERAPISTS.length + WHITE_ROSE_THERAPISTS.length + MRS_MARVEL_THERAPISTS.length + BUZZ_SPA_THERAPISTS.length;
  console.log(`\n=== 完了 ${SHOPS.length}店舗 / ${total}名 ===`);
}

main().catch(console.error);
