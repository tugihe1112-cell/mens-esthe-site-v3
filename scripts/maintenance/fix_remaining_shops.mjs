/**
 * Chrome経由データ登録 (残りshop)
 * aroma_liberty(21名) / magokoro(42名) / bariano(56名/名前のみ) / bijo_spa(9名/名前のみ)
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);
const BUCKET = 'therapist-images';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function uploadImage(url, key, referer) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.split('?')[0].split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
    const k = `${key}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(k, buf, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true,
    });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(k).data.publicUrl;
  } catch { return null; }
}

const BASE = 'https://magokoro-spa.com/manage/image/up/';

const SHOPS = [
  {
    shopId: 'saitama_koshigaya_aroma_liberty',
    referer: 'https://aromaliberty.com/',
    therapists: [
      { name: '篠崎 茜',  url: 'https://aromaliberty.com/therapist/161_1.jpg' },
      { name: '後藤 有紀', url: 'https://aromaliberty.com/therapist/238_1.jpg' },
      { name: '倉木 亜佑美', url: 'https://aromaliberty.com/therapist/239_1.jpg' },
      { name: '高橋 鈴',  url: 'https://aromaliberty.com/therapist/265_1.jpg' },
      { name: '五十嵐 結', url: 'https://aromaliberty.com/therapist/264_1.jpg' },
      { name: '磯山 萌香', url: 'https://aromaliberty.com/therapist/263_1.jpg' },
      { name: '井本 沙也花', url: 'https://aromaliberty.com/therapist/262_1.jpg' },
      { name: '花村 優香', url: 'https://aromaliberty.com/therapist/261_1.jpg' },
      { name: '村上 宏美', url: 'https://aromaliberty.com/therapist/260_1.jpg' },
      { name: '坂井 秋',  url: 'https://aromaliberty.com/therapist/259_1.jpg' },
      { name: '北川 葵',  url: 'https://aromaliberty.com/therapist/258_1.jpg' },
      { name: '福永 莉子', url: 'https://aromaliberty.com/therapist/257_1.jpg' },
      { name: '杉下 蘭',  url: 'https://aromaliberty.com/therapist/254_1.jpg' },
      { name: '倖田 愛美', url: 'https://aromaliberty.com/therapist/253_1.jpg' },
      { name: '谷村 綾',  url: 'https://aromaliberty.com/therapist/228_1.jpg' },
      { name: '加藤 優子', url: 'https://aromaliberty.com/therapist/226_1.jpg' },
      { name: '佐藤 恵',  url: 'https://aromaliberty.com/therapist/193_1.jpg' },
      { name: '矢部 優香里', url: 'https://aromaliberty.com/therapist/192_1.jpg' },
      { name: '平山 美保', url: 'https://aromaliberty.com/therapist/173_1.jpg' },
      { name: '藤木 奈緒子', url: 'https://aromaliberty.com/therapist/160_1.jpg' },
      { name: '美月 悠',  url: 'https://aromaliberty.com/therapist/143_1.jpg' },
    ],
  },
  {
    shopId: 'saitama_warabi_magokoro_spa',
    referer: 'https://magokoro-spa.com/',
    therapists: [
      { name: 'かぐや', url: BASE+'20260603182502_8316651307_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'ゆうな', url: BASE+'20260517164935_7402664561_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'そら',   url: BASE+'20260530210628_4895462736_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'ましろ', url: BASE+'20260507152014_4023163349_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'あいり', url: BASE+'20260520141036_884649318_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'あみか', url: BASE+'20260520134132_9036349217_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'りさ',   url: BASE+'20260504202752_5628564983_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'あおい', url: BASE+'20260423010754_8923619380_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'りお',   url: BASE+'20260525234337_2731925057_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'あすか', url: BASE+'20260524145901_859363240_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'かりん', url: BASE+'20260306070843_9442307093_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'はるき', url: BASE+'20260407194812_8420452147_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'ゆめ',   url: BASE+'20251225023134_9649064444_cast_subphoto_img_url_0_w500xh750.png' },
      { name: 'つむぎ', url: BASE+'20260122130223_6103519390_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'くるみ', url: BASE+'20260414025413_7633539869_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'さき',   url: BASE+'20260327021327_8291852148_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'つばき', url: BASE+'20250715105329_8265350809_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'さつき', url: BASE+'20251118133344_2506052145_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'まゆみ', url: BASE+'20250924202456_2433656250_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'じゅり', url: BASE+'20251218061737_3488923473_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'まどか', url: BASE+'20250826232749_6751943952_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'しほ',   url: BASE+'20260420002908_3761856245_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'ゆい',   url: BASE+'20260322214747_6042427568_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'うた',   url: BASE+'20251217045037_9838411186_cast_subphoto_img_url_0_w500xh750.png' },
      { name: 'このみ', url: BASE+'20251217045921_5229835773_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'さくら', url: BASE+'20260321054333_6453019387_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'はな',   url: BASE+'20251122051340_8316460348_cast_subphoto_img_url_0_w500xh750.png' },
      { name: 'みやび', url: BASE+'20260301220103_7566215285_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'ももか', url: BASE+'20251208231716_7816911188_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'じゅん', url: BASE+'20260301220038_9980915285_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'ひかり', url: BASE+'20260301220140_9884715285_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'みな',   url: BASE+'20260301220009_3307515285_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'るい',   url: BASE+'20251102200528_3693043954_cast_subphoto_img_url_0_w500xh750.png' },
      { name: 'ひとみ', url: BASE+'20250720111634_3496661620_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'みこと', url: BASE+'20251116235608_3762931668_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'ゆり',   url: BASE+'20251129213909_4294327578_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'やすこ', url: BASE+'20251207151148_1999464432_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'あや',   url: BASE+'20251116103103_1908364443_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'ゆうこ', url: BASE+'20251029182129_4553811195_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'いろは', url: BASE+'20251117101207_4586052149_cast_subphoto_img_url_0_w500xh750.jpg' },
      { name: 'みお',   url: BASE+'20260301081627_6988027577_cast_subphoto_img_url_0_w500xh750.webp' },
      { name: 'ともみ', url: BASE+'20260124224942_5965548058_cast_subphoto_img_url_0_w500xh750.jpg' },
    ],
  },
  {
    // 画像なし（JSレンダリングで取得不可）
    shopId: 'saitama_tokorozawa_bariano',
    referer: null,
    therapists: [
      '朝比奈','琴石','桃瀬','藤咲','浜辺','雨霧','一ノ瀬','弘中','月島','飛山',
      '目黒','黒崎','川上','天月','七瀬','寺本','深川','紫乃','三好','中村',
      '佐久間','海野','田川','野村','小暮','辻','清華','仲藤','水沢','佐々木',
      '大西','美空','高梨','九条','月森','花咲','深田','田中','矢井田','葉月',
      '春奈','姫野','平野','安藤','柳','夏目','葵','白雪','胡桃','愛野',
      '七海','白河','小松','白波','佐伯','紺野',
    ].map(name => ({ name, url: null })),
  },
  {
    // 画像なし（CMS制限）
    shopId: 'chiba_kashiwa_bijo_spa',
    referer: null,
    therapists: [
      'ジュナ','ユリ','ユラン','ウリン','エナ','ナツキ','ユズネ','スズ','アオバ',
    ].map(name => ({ name, url: null })),
  },
];

async function main() {
  let total = 0;
  for (const shop of SHOPS) {
    console.log(`\n[${shop.shopId}] ${shop.therapists.length}名`);
    const { data: existing } = await supabase.from('therapists').select('name').eq('shop_id', shop.shopId);
    const existingNames = new Set(existing?.map(t => t.name.replace(/[\s　]/g, '')) || []);
    let inserted = 0;
    for (const t of shop.therapists) {
      const normName = t.name.replace(/[\s　]/g, '');
      if (existingNames.has(normName)) { process.stdout.write('s'); continue; }
      let imageUrl = null;
      if (t.url && shop.referer) {
        const storageKey = `${shop.shopId}_${t.name}`.replace(/[^\w-]/g, '_');
        imageUrl = await uploadImage(t.url, storageKey, shop.referer);
        await sleep(150);
      }
      const { error } = await supabase.from('therapists').insert({
        id: `${shop.shopId}_${t.name}`,
        shop_id: shop.shopId,
        name: t.name,
        image_url: imageUrl,
      });
      if (!error || error.code === '23505') { process.stdout.write(imageUrl ? '+' : 'n'); inserted++; }
      else process.stdout.write('E');
    }
    console.log(`\n  登録: ${inserted}名`);
    total += inserted;
  }
  console.log(`\n完了: 合計${total}名登録`);
}

main();
