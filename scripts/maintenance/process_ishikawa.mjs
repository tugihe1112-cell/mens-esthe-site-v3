/**
 * 石川県（金沢） 全shop＋セラピスト登録
 * 実行: node scripts/maintenance/process_ishikawa.mjs [--dry-run]
 *
 * 店舗一覧（9店舗 計331名）:
 *   1. AromaBell (91名) - VOTEC CMS moto_lid.jpg
 *   2. Rritz (20名)     - VOTEC CMS moto_lid.jpg
 *   3. 蛍屋 (38名)      - 独自CGI /therapist/img/{status}-1.jpg
 *   4. Lunaria (33名)   - esthe-hp.com optImg CDN
 *   5. 癒し処 和華 (12名) - estama CDN 直接URL
 *   6. COCO (23名)      - タイムスタンプURL /photos/{lid}/{ts}-{fn}.jpeg
 *   7. Mary Geoise (6名) - estama CDN 直接URL
 *   8. LOHAS (81名)     - タイムスタンプURL（profile page fetch）
 *   9. Lush & Hush (27名) - タイムスタンプURL /photos/{lid}/{ts}-{fn}.jpeg
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function pAll(items, fn, concurrency = 8) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const r = await Promise.all(batch.map(fn));
    results.push(...r);
  }
  return results;
}

async function getOgImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = s => html.match(new RegExp(s))?.[1];
    return $('<meta[^>]+property="og:image"[^>]+content="([^"]+)"')
        || $('<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"')
        || null;
  } catch { return null; }
}

async function uploadImage(srcUrl, storageKey, referer = null) {
  if (!srcUrl) return null;
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(srcUrl, { headers });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: res.headers.get('content-type') || 'image/jpeg',
      upsert: true,
    });
    if (error) { console.error(`  Storage error ${storageKey}:`, error.message); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) { return null; }
}

// ─── SHOP データ ───────────────────────────────────────────────────────────────
const SHOPS = [
  {
    id: 'ishikawa_kanazawa_aromabelle',
    name: 'AromaBell（アロマベル）',
    website_url: 'https://aromabelle-esthe.com/',
    schedule_url: 'https://aromabelle-esthe.com/schedule',
    area: '金沢', prefecture: '石川県',
  },
  {
    id: 'ishikawa_kanazawa_rritz',
    name: 'Rritz（アールリッツ）',
    website_url: 'https://r-ritz.com/',
    schedule_url: 'https://r-ritz.com/schedule',
    area: '金沢', prefecture: '石川県',
  },
  {
    id: 'ishikawa_kanazawa_hotaruya',
    name: '蛍屋',
    website_url: 'https://www.hotaruya-kanazawa.com/',
    schedule_url: 'https://www.hotaruya-kanazawa.com/therapist/schedule.cgi',
    area: '金沢', prefecture: '石川県',
  },
  {
    id: 'ishikawa_kanazawa_lunaria',
    name: 'Lunaria（ルナーリア）',
    website_url: 'https://lunaria0505.esthe-hp.com/',
    schedule_url: 'https://lunaria0505.esthe-hp.com/scheduleList.html',
    area: '金沢', prefecture: '石川県',
  },
  {
    id: 'ishikawa_kanazawa_waka',
    name: '癒し処 和華',
    website_url: 'https://iyasidokoro-waka.com/',
    schedule_url: 'https://estama.jp/shop/23505/schedule/',
    area: '金沢', prefecture: '石川県',
  },
  {
    id: 'ishikawa_kanazawa_coco',
    name: 'COCO（ココ）',
    website_url: 'https://cocoesthe.com/',
    schedule_url: 'https://cocoesthe.com/schedule',
    area: '金沢', prefecture: '石川県',
  },
  {
    id: 'ishikawa_kanazawa_mary_geoise',
    name: 'Mary Geoise（マリージョア）',
    website_url: 'https://mary-geoise.com/',
    schedule_url: 'https://estama.jp/shop/38542/schedule/',
    area: '金沢', prefecture: '石川県',
  },
  {
    id: 'ishikawa_kanazawa_lohas',
    name: 'LOHAS（ロハス）',
    website_url: 'https://spa-lohas.com/top',
    schedule_url: 'https://spa-lohas.com/schedule',
    area: '金沢', prefecture: '石川県',
  },
  {
    id: 'ishikawa_kanazawa_lush_hush',
    name: 'Lush & Hush',
    website_url: 'https://lush-and-hush.com/',
    schedule_url: 'https://lush-and-hush.com/schedule',
    area: '金沢', prefecture: '石川県',
  },
];

// ─── セラピストデータ ───────────────────────────────────────────────────────────

// AromaBell: VOTEC CMS /photos/{lid}/moto_{lid}.jpg
const AROMABELLE_THERAPISTS = [
  {lid:180,name:'そら'},{lid:17,name:'伊吹'},{lid:226,name:'まりな'},{lid:247,name:'みゆき'},
  {lid:256,name:'くみ'},{lid:249,name:'みお'},{lid:254,name:'まほ'},{lid:250,name:'えいみ'},
  {lid:244,name:'うみ'},{lid:246,name:'ねむ'},{lid:243,name:'れいら'},{lid:62,name:'くらん'},
  {lid:155,name:'みさと'},{lid:189,name:'美怜'},{lid:110,name:'さつき'},{lid:207,name:'千夏'},
  {lid:139,name:'ももな'},{lid:71,name:'のあ'},{lid:87,name:'すず'},{lid:164,name:'はるひ'},
  {lid:120,name:'えま'},{lid:150,name:'もか'},{lid:188,name:'双葉'},{lid:67,name:'うた'},
  {lid:182,name:'ここあ'},{lid:115,name:'あかね'},{lid:168,name:'ゆゆ'},{lid:39,name:'利花'},
  {lid:202,name:'つばさ'},{lid:51,name:'優木'},{lid:37,name:'みゆ'},{lid:58,name:'杏'},
  {lid:53,name:'ひなみ'},{lid:190,name:'にな'},{lid:38,name:'しお'},{lid:236,name:'かなた'},
  {lid:138,name:'ひなの'},{lid:46,name:'はるか'},{lid:165,name:'しおん'},{lid:6,name:'梨乃'},
  {lid:145,name:'りあ'},{lid:158,name:'せいか'},{lid:181,name:'蛍'},{lid:132,name:'きょうか'},
  {lid:20,name:'神楽'},{lid:248,name:'花恋'},{lid:106,name:'白石'},{lid:218,name:'みつは'},
  {lid:216,name:'光凛'},{lid:230,name:'けいな'},{lid:205,name:'かよ'},{lid:235,name:'るり'},
  {lid:234,name:'きらら'},{lid:241,name:'絵名'},{lid:154,name:'しいな'},{lid:223,name:'妃咲'},
  {lid:224,name:'あすみ'},{lid:199,name:'あやめ'},{lid:198,name:'まひる'},{lid:237,name:'渚'},
  {lid:208,name:'ゆい'},{lid:257,name:'三咲',imgFile:'main_257.jpg'},{lid:255,name:'りょうか'},
  {lid:231,name:'ゆうあ'},{lid:196,name:'宮城'},{lid:251,name:'しおり'},{lid:162,name:'舞桜'},
  {lid:95,name:'結丹'},{lid:161,name:'まりん'},{lid:239,name:'あおば'},{lid:233,name:'はるる'},
  {lid:217,name:'さゆ'},{lid:213,name:'なの'},{lid:215,name:'りょう'},{lid:221,name:'てぃな'},
  {lid:209,name:'えり'},{lid:12,name:'なみ'},{lid:186,name:'いのり'},{lid:195,name:'あいな'},
  {lid:193,name:'さわ'},{lid:174,name:'さくらこ'},{lid:157,name:'さえか'},{lid:167,name:'れみ'},
  {lid:98,name:'かぐや'},{lid:123,name:'あやか'},{lid:83,name:'せれな'},{lid:116,name:'茅乃'},
  {lid:242,name:'ルカ'},{lid:1,name:'橋本'},{lid:134,name:'なつ'},{lid:25,name:'杏里'},
];

// Rritz: VOTEC CMS
const RRITZ_THERAPISTS = [
  {lid:42,name:'四季'},{lid:39,name:'福永'},{lid:12,name:'夢華'},{lid:19,name:'千冬'},
  {lid:20,name:'片瀬'},{lid:32,name:'市川'},{lid:31,name:'朱里'},{lid:21,name:'胡桃'},
  {lid:18,name:'雪乃'},{lid:15,name:'一華'},{lid:30,name:'蛍'},{lid:22,name:'小泉'},
  {lid:37,name:'かよ'},{lid:33,name:'まりん'},{lid:35,name:'宮城'},{lid:40,name:'しおり'},
  {lid:14,name:'白石'},{lid:34,name:'結丹'},{lid:16,name:'寧々'},{lid:24,name:'茅乃'},
];

// 蛍屋: status → name, image: /therapist/img/{status}-1.jpg
const HOTARUYA_THERAPISTS = [
  {status:'268',name:'星七'},{status:'210',name:'彩花'},{status:'141',name:'涼'},
  {status:'174',name:'織乃'},{status:'267',name:'恋春'},{status:'250',name:'亜鳥'},
  {status:'201',name:'真理'},{status:'230',name:'夏希'},{status:'266',name:'桃華'},
  {status:'265',name:'茜'},{status:'264',name:'真琴'},{status:'263',name:'葵'},
  {status:'262',name:'優樹菜'},{status:'261',name:'謡楽'},{status:'259',name:'未央'},
  {status:'257',name:'神楽'},{status:'253',name:'咲華'},{status:'252',name:'桃'},
  {status:'251',name:'椿'},{status:'249',name:'円香'},{status:'246',name:'花乃'},
  {status:'238',name:'麻里亜'},{status:'235',name:'凛々花'},{status:'231',name:'麗未'},
  {status:'228',name:'波瑠香'},{status:'227',name:'瑠璃'},{status:'223',name:'理沙'},
  {status:'220',name:'恵里菜'},{status:'219',name:'那奈'},{status:'218',name:'牡丹'},
  {status:'217',name:'幸歌'},{status:'216',name:'日奈子'},{status:'200',name:'餡蜜'},
  {status:'180',name:'百合'},{status:'177',name:'未来'},{status:'145',name:'恵麻'},
  {status:'139',name:'奈緒'},{status:'138',name:'優花里'},
];

// Lunaria: esthe-hp.com optImg CDN (直接URL使用)
const LUNARIA_THERAPISTS = [
  {name:'Sena',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10040328/11146790_640_0.jpg'},
  {name:'Yumeka', imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10039671/11143144_640_0.jpg'},
  {name:'Waka',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10039453/11136183_640_0.jpg'},
  {name:'Sora',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10039361/11146914_640_0.jpg'},
  {name:'Kurumi', imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10038652/11126013_640_0.jpg'},
  {name:'Mii',    imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10037730/11120472_640_0.jpg'},
  {name:'Erika',  imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10037534/11119493_640_0.jpg'},
  {name:'Jyunna', imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10037370/front_640_0.jpg'},
  {name:'Mashiro',imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10036536/11114669_640_0.jpg'},
  {name:'Karen',  imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10036285/11113725_640_0.jpg'},
  {name:'Moca',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10036253/11119542_640_0.jpg'},
  {name:'Ran',    imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10030273/11115868_640_0.jpg'},
  {name:'Airi',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10032916/11109845_640_0.jpg'},
  {name:'Rika',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10028138/11073727_640_0.jpg'},
  {name:'Chiaki', imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10023680/11052608_640_0.jpg'},
  {name:'Nanase', imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10025874/11104035_640_0.jpg'},
  {name:'Yuki',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10013420/11051727_640_0.jpg'},
  {name:'Mio',    imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10030620/11114841_640_0.jpg'},
  {name:'Suzu',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10030797/11087761_640_0.jpg'},
  {name:'Nana',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10029352/11113354_640_0.jpg'},
  {name:'Hikaru', imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10014928/11102809_640_0.jpg'},
  {name:'Azu',    imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10022613/11118216_640_0.jpg'},
  {name:'Karina', imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10023933/11103441_640_0.jpg'},
  {name:'Kanon',  imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10015648/11110261_640_0.jpg'},
  {name:'Honoka', imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10033899/11103585_640_0.jpg'},
  {name:'Yuu',    imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10031946/11094712_640_0.jpg'},
  {name:'Coco',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10032712/11098890_640_0.jpg'},
  {name:'Hinata', imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10013306/11119804_640_0.jpg'},
  {name:'Reo',    imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10031959/front_640_0.jpg'},
  {name:'Reina',  imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10014688/11111069_640_0.jpg'},
  {name:'Kaede',  imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10024676/11062537_640_0.jpg'},
  {name:'Momo',   imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10027243/11071441_640_0.jpg'},
  {name:'Ryo',    imgUrl:'https://lunaria0505.esthe-hp.com/optImg/1004082/item/10033542/11102072_640_0.jpg'},
];

// 癒し処 和華: estama CDN 直接URL
const WAKA_THERAPISTS = [
  {name:'れな',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_5zimu_20220817124026.jpg'},
  {name:'石川',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_5bt2z_20230129162035.jpg'},
  {name:'坂',    imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_axskr_20220817125956.jpg'},
  {name:'堀北',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_3l9ci_20221209163334.jpg'},
  {name:'井上',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/b9rdd_20241111211052.jpg'},
  {name:'三崎',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_1irxj_20221212105327.jpg'},
  {name:'平見',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_a9k8p_20220817130320.jpg'},
  {name:'河合',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/ecq1l_20231013175700.jpg'},
  {name:'永井',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_b4ert_20220817124204.jpg'},
  {name:'浅田',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_ec3hf_20220817131135.jpg'},
  {name:'あや',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_7j0s2_20220817125851.jpg'},
  {name:'武田',  imgUrl:'https://img.estama.jp/shop_data/00000023505/cast/main/357x556/img_euw27_20230705180707.jpg'},
];

// COCO: タイムスタンプURL
const COCO_THERAPISTS = [
  {lid:31,name:'つばき',imgUrl:'https://cocoesthe.com/photos/31/20260528204050-IMG_6577.jpeg'},
  {lid:30,name:'しずく',imgUrl:'https://cocoesthe.com/photos/30/20260512231620-IMG_8646.jpeg'},
  {lid:29,name:'りな',  imgUrl:'https://cocoesthe.com/photos/29/20260428023320-IMG_8484.jpeg'},
  {lid:26,name:'せいら',imgUrl:'https://cocoesthe.com/photos/26/20251210063125-IMG_6037.jpeg'},
  {lid:25,name:'ゆい',  imgUrl:'https://cocoesthe.com/photos/25/20251208033748-IMG_5866.jpeg'},
  {lid:24,name:'おとは',imgUrl:'https://cocoesthe.com/photos/24/20251127132949-IMG_5345.jpeg'},
  {lid:20,name:'まい',  imgUrl:'https://cocoesthe.com/photos/20/20251013202627-IMG_2718.jpeg'},
  {lid:3, name:'なこ',  imgUrl:'https://cocoesthe.com/photos/3/20260528201843-IMG_1652.jpeg'},
  {lid:23,name:'まり',  imgUrl:'https://cocoesthe.com/photos/23/20251126201431-IMG_5002.jpeg'},
  {lid:19,name:'りこ',  imgUrl:'https://cocoesthe.com/photos/19/20250904025724-IMG_1958.jpeg'},
  {lid:21,name:'きらら',imgUrl:'https://cocoesthe.com/photos/21/20251031160241-IMG_3442.jpeg'},
  {lid:18,name:'みどり',imgUrl:'https://cocoesthe.com/photos/18/20250626175943-F53DB197-E2B1-428D-942F-53D62892D52E.jpeg'},
  {lid:5, name:'えりか',imgUrl:'https://cocoesthe.com/photos/5/20241002221240-893C205C-69D1-486A-9A9E-E48576E63186.jpeg'},
  {lid:13,name:'さな',  imgUrl:'https://cocoesthe.com/photos/13/20250310192130-06917862-05B0-48A8-8B15-7E00B894B696.jpeg'},
  {lid:9, name:'みれい',imgUrl:'https://cocoesthe.com/photos/9/20241201221921-A77A44C2-F89F-4268-8932-AB6A163C96A6.jpeg'},
  {lid:6, name:'しほ',  imgUrl:'https://cocoesthe.com/photos/6/20241007005552-458DC533-7FC9-48B6-AEC8-5E94A1909CD2.jpeg'},
  {lid:2, name:'りか',  imgUrl:'https://cocoesthe.com/photos/2/20240930030726-6836B8B1-AEA2-4FCF-A4F2-F0975E8B86A2.jpeg'},
  {lid:17,name:'さゆり',imgUrl:'https://cocoesthe.com/photos/17/20250522225315-A4E37575-4F2E-444C-8CBC-2BBE7F89CDB3.jpeg'},
  {lid:16,name:'なな',  imgUrl:null},
  {lid:15,name:'あいり',imgUrl:null},
  {lid:14,name:'ひな',  imgUrl:'https://cocoesthe.com/photos/14/20250327044748-0CBDE541-C3FF-4EA8-AD2D-FAFD586DE06D.jpeg'},
  {lid:12,name:'はな',  imgUrl:'https://cocoesthe.com/photos/12/20250304014044-A78F8065-36E5-4969-B63A-C1B5DAAA46FF.jpeg'},
  {lid:8, name:'まりえ',imgUrl:null},
];

// Mary Geoise: estama CDN 直接URL
const MARY_GEOISE_THERAPISTS = [
  {name:'えみ',  imgUrl:'https://img.estama.jp/shop_data/00000038542/cast/main/357x556/eqim8_20260529012802.jpg'},
  {name:'かのん',imgUrl:'https://img.estama.jp/shop_data/00000038542/cast/main/357x556/2d2ha_20260502143348.jpg'},
  {name:'さくら',imgUrl:'https://img.estama.jp/shop_data/00000038542/cast/main/357x556/23xe8_20260603053715.jpg'},
  {name:'ゆき',  imgUrl:'https://img.estama.jp/shop_data/00000038542/cast/main/357x556/8snii_20260501132856.jpg'},
  {name:'りさ',  imgUrl:'https://img.estama.jp/shop_data/00000038542/cast/main/357x556/35aqc_20260222231024.jpg'},
  {name:'なな',  imgUrl:'https://img.estama.jp/shop_data/00000038542/cast/main/357x556/7n585_20260503213501.jpg'},
];

// LOHAS: lid + name (画像はスクリプト内でfetch)
const LOHAS_LIDS = [
  {lid:100,name:'りこ'},{lid:99,name:'みく'},{lid:98,name:'えま'},{lid:97,name:'ましろ'},
  {lid:96,name:'みさき'},{lid:95,name:'ひなた'},{lid:94,name:'くうな'},{lid:93,name:'しゅら'},
  {lid:92,name:'くるみ'},{lid:91,name:'ひじり'},{lid:88,name:'あゆ'},{lid:77,name:'かれん'},
  {lid:53,name:'めい'},{lid:89,name:'とあ'},{lid:54,name:'みゆ'},{lid:86,name:'みおり'},
  {lid:85,name:'みつき'},{lid:84,name:'つき'},{lid:82,name:'さら'},{lid:81,name:'ゆいか'},
  {lid:80,name:'ここな'},{lid:78,name:'さや'},{lid:76,name:'かえで'},{lid:75,name:'みゆき'},
  {lid:74,name:'ひなの'},{lid:73,name:'ことは'},{lid:79,name:'まや'},{lid:72,name:'りりす'},
  {lid:90,name:'みうな'},{lid:71,name:'るり'},{lid:69,name:'れい'},{lid:68,name:'りおな'},
  {lid:66,name:'ゆき'},{lid:65,name:'ありす'},{lid:64,name:'すず'},{lid:63,name:'ふみの'},
  {lid:62,name:'えり'},{lid:70,name:'くう'},{lid:61,name:'せり'},{lid:59,name:'かんな'},
  {lid:58,name:'あいみ'},{lid:56,name:'あいの'},{lid:55,name:'うみ'},{lid:52,name:'うい'},
  {lid:57,name:'あんな'},{lid:51,name:'かのん'},{lid:50,name:'ろあ'},{lid:49,name:'かりな'},
  {lid:47,name:'えな'},{lid:46,name:'ゆま'},{lid:45,name:'ひめの'},{lid:44,name:'ゆうり'},
  {lid:43,name:'わかな'},{lid:42,name:'うた'},{lid:41,name:'にこ'},{lid:40,name:'ふうか'},
  {lid:39,name:'えみり'},{lid:83,name:'りん'},{lid:38,name:'ゆうか'},{lid:37,name:'はる'},
  {lid:36,name:'ももほ'},{lid:35,name:'なぎさ'},{lid:34,name:'かほ'},{lid:33,name:'みり'},
  {lid:32,name:'りり'},{lid:31,name:'まりあ'},{lid:30,name:'りな'},{lid:28,name:'りさ'},
  {lid:26,name:'こころ'},{lid:25,name:'りょう'},{lid:24,name:'さえこ'},{lid:22,name:'みお'},
  {lid:21,name:'いろは'},{lid:20,name:'るな'},{lid:19,name:'はな'},{lid:18,name:'りま'},
  {lid:17,name:'ゆかり'},{lid:16,name:'りほ'},{lid:15,name:'れみ'},{lid:14,name:'ふう'},
  {lid:12,name:'じゅん'},
];

// Lush & Hush: タイムスタンプURL
const LUSH_HUSH_THERAPISTS = [
  {lid:1, name:'ひな',  imgUrl:'https://lush-and-hush.com/photos/1/20260518003629-IMG_6838.jpeg'},
  {lid:4, name:'ねる',  imgUrl:'https://lush-and-hush.com/photos/4/20260518145705-IMG_5288.jpeg'},
  {lid:10,name:'みゆ',  imgUrl:'https://lush-and-hush.com/photos/10/20260601004330-IMG_0043.jpeg'},
  {lid:14,name:'れおな',imgUrl:'https://lush-and-hush.com/photos/14/20260610181313-IMG_0190.jpeg'},
  {lid:9, name:'ゆの',  imgUrl:'https://lush-and-hush.com/photos/9/20260518150611-IMG_5272.jpeg'},
  {lid:21,name:'あかり',imgUrl:'https://lush-and-hush.com/photos/21/20260518153007-IMG_5329.jpeg'},
  {lid:23,name:'ゆきの',imgUrl:'https://lush-and-hush.com/photos/23/20260530191804-IMG_0113.jpeg'},
  {lid:19,name:'なお',  imgUrl:'https://lush-and-hush.com/photos/19/20260518152811-IMG_5323.jpeg'},
  {lid:28,name:'あみ',  imgUrl:'https://lush-and-hush.com/photos/28/20260518153752-IMG_5350.jpeg'},
  {lid:2, name:'れな',  imgUrl:'https://lush-and-hush.com/photos/2/20260518145103-IMG_5283.jpeg'},
  {lid:26,name:'みのり',imgUrl:'https://lush-and-hush.com/photos/26/20260518153428-IMG_5332.jpeg'},
  {lid:27,name:'かりん',imgUrl:'https://lush-and-hush.com/photos/27/20260518153653-IMG_5342.jpeg'},
  {lid:20,name:'ちさと',imgUrl:'https://lush-and-hush.com/photos/20/20260518152913-IMG_5325.jpeg'},
  {lid:18,name:'れいな',imgUrl:'https://lush-and-hush.com/photos/18/20260518152653-IMG_5321.jpeg'},
  {lid:15,name:'れい',  imgUrl:'https://lush-and-hush.com/photos/15/20260518151756-IMG_5319.jpeg'},
  {lid:8, name:'なな',  imgUrl:'https://lush-and-hush.com/photos/8/20260518150456-IMG_5304.jpeg'},
  {lid:31,name:'えみり',imgUrl:'https://lush-and-hush.com/photos/31/20260530210921-IMG_7021.jpeg'},
  {lid:3, name:'ゆか',  imgUrl:'https://lush-and-hush.com/photos/3/20260518145339-IMG_5285.jpeg'},
  {lid:5, name:'あおい',imgUrl:'https://lush-and-hush.com/photos/5/20260518150000-IMG_5263.jpeg'},
  {lid:7, name:'りみ',  imgUrl:'https://lush-and-hush.com/photos/7/20260518150323-IMG_5299.jpeg'},
  {lid:16,name:'みい',  imgUrl:'https://lush-and-hush.com/photos/16/20260520111925-IMG_6886.jpeg'},
  {lid:12,name:'もも',  imgUrl:'https://lush-and-hush.com/photos/12/20260518150909-IMG_5268.jpeg'},
  {lid:6, name:'りあ',  imgUrl:'https://lush-and-hush.com/photos/6/20260518150135-IMG_5294.jpeg'},
  {lid:13,name:'みな',  imgUrl:'https://lush-and-hush.com/photos/13/20260518151253-IMG_5267.jpeg'},
  {lid:11,name:'あゆか',imgUrl:'https://lush-and-hush.com/photos/11/20260606152429-IMG_7128.jpeg'},
  {lid:24,name:'にこ',  imgUrl:'https://lush-and-hush.com/photos/24/20260531165026-IMG_7023.jpeg'},
  {lid:29,name:'らん',  imgUrl:null},
];

// ─── メイン処理 ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`=== 石川県 登録${isDryRun ? ' (dry-run)' : ''} ===`);

  // ── Phase 1: Shop登録 ──────────────────────────────────────────────────────
  console.log('\n[Phase 1] shop登録...');
  const shopRows = await pAll(SHOPS, async s => {
    const imgUrl = await getOgImage(s.website_url);
    return { ...s, image_url: imgUrl, raw_data: { area: s.area, prefecture: s.prefecture } };
  }, 5);

  if (!isDryRun) {
    const { error } = await supabase.from('shops').upsert(
      shopRows.map(({ area, prefecture, ...rest }) => rest),
      { onConflict: 'id' }
    );
    if (error) console.error('Shop upsert error:', error.message);
    else console.log(`  ✅ ${shopRows.length}店舗登録`);
  } else {
    shopRows.forEach(s => console.log(`  [dry] shop: ${s.id} og:${s.image_url?.slice(0,60)||'null'}`));
  }

  // ── Phase 2: AromaBell セラピスト ──────────────────────────────────────────
  console.log('\n[Phase 2] AromaBell (91名)...');
  const aromabelleRows = await pAll(AROMABELLE_THERAPISTS, async t => {
    const imgFile = t.imgFile || `moto_${t.lid}.jpg`;
    const srcUrl = `https://aromabelle-esthe.com/photos/${t.lid}/${imgFile}`;
    const storageKey = `aromabelle_${t.lid}.jpg`;
    const imgUrl = isDryRun ? srcUrl : await uploadImage(srcUrl, storageKey, 'https://aromabelle-esthe.com/');
    return {
      id: `ishikawa_kanazawa_aromabelle_${t.name}`,
      shop_id: 'ishikawa_kanazawa_aromabelle',
      name: t.name, image_url: imgUrl,
    };
  }, 8);
  if (!isDryRun) {
    const { error } = await supabase.from('therapists').upsert(aromabelleRows, { onConflict: 'id' });
    if (error) console.error('AromaBelle error:', error.message);
    else console.log(`  ✅ ${aromabelleRows.length}名`);
  } else {
    console.log(`  [dry] ${aromabelleRows.length}名 (AromaBell)`);
  }

  // ── Phase 3: Rritz セラピスト ──────────────────────────────────────────────
  console.log('\n[Phase 3] Rritz (20名)...');
  const rritzRows = await pAll(RRITZ_THERAPISTS, async t => {
    const srcUrl = `https://r-ritz.com/photos/${t.lid}/moto_${t.lid}.jpg`;
    const storageKey = `rritz_${t.lid}.jpg`;
    const imgUrl = isDryRun ? srcUrl : await uploadImage(srcUrl, storageKey, 'https://r-ritz.com/');
    return {
      id: `ishikawa_kanazawa_rritz_${t.name}`,
      shop_id: 'ishikawa_kanazawa_rritz',
      name: t.name, image_url: imgUrl,
    };
  }, 8);
  if (!isDryRun) {
    const { error } = await supabase.from('therapists').upsert(rritzRows, { onConflict: 'id' });
    if (error) console.error('Rritz error:', error.message);
    else console.log(`  ✅ ${rritzRows.length}名`);
  } else {
    console.log(`  [dry] ${rritzRows.length}名 (Rritz)`);
  }

  // ── Phase 4: 蛍屋 セラピスト ──────────────────────────────────────────────
  console.log('\n[Phase 4] 蛍屋 (38名)...');
  const hotaruyaRows = await pAll(HOTARUYA_THERAPISTS, async t => {
    const srcUrl = `https://www.hotaruya-kanazawa.com/therapist/img/${t.status}-1.jpg`;
    const storageKey = `hotaruya_${t.status}.jpg`;
    const imgUrl = isDryRun ? srcUrl : await uploadImage(srcUrl, storageKey, 'https://www.hotaruya-kanazawa.com/');
    return {
      id: `ishikawa_kanazawa_hotaruya_${t.name}`,
      shop_id: 'ishikawa_kanazawa_hotaruya',
      name: t.name, image_url: imgUrl,
    };
  }, 8);
  if (!isDryRun) {
    const { error } = await supabase.from('therapists').upsert(hotaruyaRows, { onConflict: 'id' });
    if (error) console.error('蛍屋 error:', error.message);
    else console.log(`  ✅ ${hotaruyaRows.length}名`);
  } else {
    console.log(`  [dry] ${hotaruyaRows.length}名 (蛍屋)`);
  }

  // ── Phase 5: Lunaria セラピスト ────────────────────────────────────────────
  console.log('\n[Phase 5] Lunaria (33名)...');
  const lunariaRows = await pAll(LUNARIA_THERAPISTS, async t => {
    const hash = t.imgUrl.split('/').pop().replace('_640_0.jpg', '');
    const storageKey = `lunaria_${hash}.jpg`;
    const imgUrl = isDryRun ? t.imgUrl : await uploadImage(t.imgUrl, storageKey, 'https://lunaria0505.esthe-hp.com/');
    return {
      id: `ishikawa_kanazawa_lunaria_${t.name}`,
      shop_id: 'ishikawa_kanazawa_lunaria',
      name: t.name, image_url: imgUrl,
    };
  }, 8);
  if (!isDryRun) {
    const { error } = await supabase.from('therapists').upsert(lunariaRows, { onConflict: 'id' });
    if (error) console.error('Lunaria error:', error.message);
    else console.log(`  ✅ ${lunariaRows.length}名`);
  } else {
    console.log(`  [dry] ${lunariaRows.length}名 (Lunaria)`);
  }

  // ── Phase 6: 癒し処 和華 セラピスト (estama直接URL) ──────────────────────
  console.log('\n[Phase 6] 癒し処 和華 (12名)...');
  const wakaRows = WAKA_THERAPISTS.map(t => ({
    id: `ishikawa_kanazawa_waka_${t.name}`,
    shop_id: 'ishikawa_kanazawa_waka',
    name: t.name, image_url: t.imgUrl,
  }));
  if (!isDryRun) {
    const { error } = await supabase.from('therapists').upsert(wakaRows, { onConflict: 'id' });
    if (error) console.error('和華 error:', error.message);
    else console.log(`  ✅ ${wakaRows.length}名`);
  } else {
    console.log(`  [dry] ${wakaRows.length}名 (和華)`);
  }

  // ── Phase 7: COCO セラピスト ──────────────────────────────────────────────
  console.log('\n[Phase 7] COCO (23名)...');
  const cocoRows = await pAll(COCO_THERAPISTS, async t => {
    const storageKey = `coco_${t.lid}.jpeg`;
    const imgUrl = (isDryRun || !t.imgUrl) ? t.imgUrl : await uploadImage(t.imgUrl, storageKey, 'https://cocoesthe.com/');
    return {
      id: `ishikawa_kanazawa_coco_${t.name}`,
      shop_id: 'ishikawa_kanazawa_coco',
      name: t.name, image_url: imgUrl,
    };
  }, 8);
  if (!isDryRun) {
    const { error } = await supabase.from('therapists').upsert(cocoRows, { onConflict: 'id' });
    if (error) console.error('COCO error:', error.message);
    else console.log(`  ✅ ${cocoRows.length}名`);
  } else {
    console.log(`  [dry] ${cocoRows.length}名 (COCO)`);
  }

  // ── Phase 8: Mary Geoise セラピスト (estama直接URL) ──────────────────────
  console.log('\n[Phase 8] Mary Geoise (6名)...');
  const maryRows = MARY_GEOISE_THERAPISTS.map(t => ({
    id: `ishikawa_kanazawa_mary_geoise_${t.name}`,
    shop_id: 'ishikawa_kanazawa_mary_geoise',
    name: t.name, image_url: t.imgUrl,
  }));
  if (!isDryRun) {
    const { error } = await supabase.from('therapists').upsert(maryRows, { onConflict: 'id' });
    if (error) console.error('Mary Geoise error:', error.message);
    else console.log(`  ✅ ${maryRows.length}名`);
  } else {
    console.log(`  [dry] ${maryRows.length}名 (Mary Geoise)`);
  }

  // ── Phase 9: LOHAS セラピスト (profile fetch) ──────────────────────────────
  console.log('\n[Phase 9] LOHAS (81名) - profile fetch中...');
  const lohasRows = await pAll(LOHAS_LIDS, async t => {
    let imgUrl = null;
    try {
      const r = await fetch(`https://spa-lohas.com/profile?lid=${t.lid}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await r.text();
      const m = html.match(/src="(https?:\/\/spa-lohas\.com\/photos\/\d+\/[^"]+\.(?:jpg|jpeg|png|webp))"/i);
      if (m) {
        const storageKey = `lohas_${t.lid}.jpg`;
        imgUrl = isDryRun ? m[1] : await uploadImage(m[1], storageKey, 'https://spa-lohas.com/');
      }
    } catch {}
    return {
      id: `ishikawa_kanazawa_lohas_${t.name}`,
      shop_id: 'ishikawa_kanazawa_lohas',
      name: t.name, image_url: imgUrl,
    };
  }, 8);
  if (!isDryRun) {
    const { error } = await supabase.from('therapists').upsert(lohasRows, { onConflict: 'id' });
    if (error) console.error('LOHAS error:', error.message);
    else console.log(`  ✅ ${lohasRows.length}名 (画像あり: ${lohasRows.filter(r=>r.image_url).length}名)`);
  } else {
    console.log(`  [dry] ${lohasRows.length}名 (LOHAS)`);
  }

  // ── Phase 10: Lush & Hush セラピスト ────────────────────────────────────
  console.log('\n[Phase 10] Lush & Hush (27名)...');
  const lushRows = await pAll(LUSH_HUSH_THERAPISTS, async t => {
    const storageKey = `lushhush_${t.lid}.jpeg`;
    const imgUrl = (isDryRun || !t.imgUrl) ? t.imgUrl : await uploadImage(t.imgUrl, storageKey, 'https://lush-and-hush.com/');
    return {
      id: `ishikawa_kanazawa_lush_hush_${t.name}`,
      shop_id: 'ishikawa_kanazawa_lush_hush',
      name: t.name, image_url: imgUrl,
    };
  }, 8);
  if (!isDryRun) {
    const { error } = await supabase.from('therapists').upsert(lushRows, { onConflict: 'id' });
    if (error) console.error('Lush & Hush error:', error.message);
    else console.log(`  ✅ ${lushRows.length}名`);
  } else {
    console.log(`  [dry] ${lushRows.length}名 (Lush & Hush)`);
  }

  const total = aromabelleRows.length + rritzRows.length + hotaruyaRows.length +
    lunariaRows.length + wakaRows.length + cocoRows.length + maryRows.length +
    lohasRows.length + lushRows.length;
  console.log(`\n=== 完了 ${SHOPS.length}店舗 / ${total}名 ===`);
}

main().catch(console.error);
