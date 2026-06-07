/**
 * Chrome経由で取得したデータを登録
 * Rose(15名) / Eden Spa(53名) / 大人のNEVERLAND(32名)
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
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
    const storageKey = `${key}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storageKey, buf, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true,
    });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(storageKey).data.publicUrl;
  } catch { return null; }
}

const SHOPS = [
  {
    shopId: 'chiba_matsudo_rose',
    referer: 'https://esthetic-rose.com/',
    therapists: [
      { name: '黒田みお', url: 'https://esthetic-rose.com/wp-content/uploads/2025/08/IMG_4185.jpeg' },
      { name: '橘なみ', url: 'https://esthetic-rose.com/wp-content/uploads/2024/09/IMG_2121.jpeg' },
      { name: '田中かれん', url: 'https://esthetic-rose.com/wp-content/uploads/2026/05/IMG_4478.jpeg' },
      { name: '花澤ゆい', url: 'https://esthetic-rose.com/wp-content/uploads/2026/05/IMG_4501-scaled.jpg' },
      { name: '櫻井ふわ', url: 'https://esthetic-rose.com/wp-content/uploads/2026/05/beauty_1779031054809.jpeg' },
      { name: '川井ちか', url: 'https://esthetic-rose.com/wp-content/uploads/2026/05/IMG_4120.jpeg' },
      { name: '月野しょう', url: 'https://esthetic-rose.com/wp-content/uploads/2026/05/beauty_1778550621962.jpeg' },
      { name: '杉山ゆうき', url: 'https://esthetic-rose.com/wp-content/uploads/2026/04/IMG_3933.jpeg' },
      { name: '山崎ココ', url: 'https://esthetic-rose.com/wp-content/uploads/2026/05/IMG_4182.jpeg' },
      { name: '白鳥まりな', url: 'https://esthetic-rose.com/wp-content/uploads/2026/01/IMG_1989.jpeg' },
      { name: '真戸アキラ', url: 'https://esthetic-rose.com/wp-content/uploads/2025/04/matsudo_esthe_mado5.jpeg' },
      { name: '成瀬もも', url: 'https://esthetic-rose.com/wp-content/uploads/2024/11/IMG_3152.jpeg' },
      { name: '藍沢しずく', url: 'https://esthetic-rose.com/wp-content/uploads/2025/07/IMG_9733.jpeg' },
      { name: '一ノ瀬りさ', url: 'https://esthetic-rose.com/wp-content/uploads/2025/07/IMG_9446.jpeg' },
      { name: '藤原かな', url: 'https://esthetic-rose.com/wp-content/uploads/2026/04/IMG_3705.jpeg' },
    ],
  },
  {
    shopId: 'chiba_kashiwa_eden_spa',
    referer: 'https://eden-spa.net/',
    therapists: [
      { name: 'まりな', url: 'https://eden-spa.net/photos/129/moto_129.jpg' },
      { name: 'みゆ', url: 'https://eden-spa.net/photos/128/moto_128.jpg' },
      { name: 'あき', url: 'https://eden-spa.net/photos/127/moto_127.jpg' },
      { name: 'えり', url: 'https://eden-spa.net/photos/126/moto_126.jpg' },
      { name: 'ひろか', url: 'https://eden-spa.net/photos/125/moto_125.jpg' },
      { name: 'みお', url: 'https://eden-spa.net/photos/119/moto_119.jpg' },
      { name: 'すい', url: 'https://eden-spa.net/photos/115/moto_115.jpg' },
      { name: 'あやね', url: 'https://eden-spa.net/photos/114/moto_114.jpg' },
      { name: 'あんな', url: 'https://eden-spa.net/photos/46/moto_46.jpg' },
      { name: 'あかね', url: 'https://eden-spa.net/photos/108/moto_108.jpg' },
      { name: 'れみ', url: 'https://eden-spa.net/photos/66/moto_66.jpg' },
      { name: 'ゆづ', url: 'https://eden-spa.net/photos/84/moto_84.jpg' },
      { name: 'なな', url: 'https://eden-spa.net/photos/54/moto_54.jpg' },
      { name: 'はるな', url: 'https://eden-spa.net/photos/78/moto_78.jpg' },
      { name: 'もえか', url: 'https://eden-spa.net/photos/65/moto_65.jpg' },
      { name: 'るな', url: 'https://eden-spa.net/photos/104/moto_104.jpg' },
      { name: 'ゆにか', url: 'https://eden-spa.net/photos/102/moto_102.jpg' },
      { name: 'ひなの', url: 'https://eden-spa.net/photos/62/moto_62.jpg' },
      { name: 'まい', url: 'https://eden-spa.net/photos/92/moto_92.jpg' },
      { name: 'ほのか', url: 'https://eden-spa.net/photos/95/moto_95.jpg' },
      { name: 'りか', url: 'https://eden-spa.net/photos/57/moto_57.jpg' },
      { name: 'ふうか', url: 'https://eden-spa.net/photos/116/moto_116.jpg' },
      { name: 'しおん', url: 'https://eden-spa.net/photos/88/moto_88.jpg' },
      { name: 'みる', url: 'https://eden-spa.net/photos/98/moto_98.jpg' },
      { name: 'はる', url: 'https://eden-spa.net/photos/111/moto_111.jpg' },
      { name: 'ねね', url: 'https://eden-spa.net/photos/100/moto_100.jpg' },
      { name: 'こはる', url: 'https://eden-spa.net/photos/90/moto_90.jpg' },
      { name: 'ことの', url: 'https://eden-spa.net/photos/105/moto_105.jpg' },
      { name: 'しずく', url: 'https://eden-spa.net/photos/83/moto_83.jpg' },
      { name: 'ありさ', url: 'https://eden-spa.net/photos/49/moto_49.jpg' },
      { name: 'さら', url: 'https://eden-spa.net/photos/106/moto_106.jpg' },
      { name: 'あこ', url: 'https://eden-spa.net/photos/72/moto_72.jpg' },
      { name: 'あいり', url: 'https://eden-spa.net/photos/75/moto_75.jpg' },
      { name: 'ななせ', url: 'https://eden-spa.net/photos/67/moto_67.jpg' },
      { name: 'らら', url: 'https://eden-spa.net/photos/91/moto_91.jpg' },
      { name: 'もも', url: 'https://eden-spa.net/photos/48/moto_48.jpg' },
      { name: 'ゆう', url: 'https://eden-spa.net/photos/16/moto_16.jpg' },
      { name: 'さとみ', url: 'https://eden-spa.net/photos/103/moto_103.jpg' },
      { name: 'にいな', url: 'https://eden-spa.net/photos/79/moto_79.jpg' },
      { name: 'つばき', url: 'https://eden-spa.net/photos/42/moto_42.jpg' },
      { name: 'ふみ', url: 'https://eden-spa.net/photos/11/moto_11.jpg' },
      { name: 'みく', url: 'https://eden-spa.net/photos/7/moto_7.jpg' },
      { name: 'あい', url: 'https://eden-spa.net/photos/9/moto_9.jpg' },
      { name: 'ちさと', url: 'https://eden-spa.net/photos/23/moto_23.jpg' },
      { name: 'さつき', url: 'https://eden-spa.net/photos/8/moto_8.jpg' },
      { name: 'えれな', url: 'https://eden-spa.net/photos/4/moto_4.jpg' },
      { name: 'あやめ', url: 'https://eden-spa.net/photos/15/moto_15.jpg' },
      { name: 'ゆみ', url: 'https://eden-spa.net/photos/43/moto_43.jpg' },
      { name: 'るき', url: 'https://eden-spa.net/photos/52/moto_52.jpg' },
      { name: 'まどか', url: 'https://eden-spa.net/photos/110/moto_110.jpg' },
      { name: 'はな', url: 'https://eden-spa.net/photos/35/moto_35.jpg' },
      { name: 'ゆき', url: 'https://eden-spa.net/photos/97/moto_97.jpg' },
      { name: 'ちはや', url: 'https://eden-spa.net/photos/13/moto_13.jpg' },
    ],
  },
  {
    shopId: 'saitama_kawagoe_otona_neverland',
    referer: 'https://otona-neverland.net/',
    therapists: [
      { name: 'りく', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1772_20260319022805_900_1200_0.jpg' },
      { name: 'みさき', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1803_20260415212557_900_1200_0.jpg' },
      { name: 'みなみ', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1811_20260316141624_900_1200_0.jpg' },
      { name: 'ゆん', url: 'https://otona-neverland.net/wp-content/uploads/2025/09/2225_20260417202946_900_1200_0.jpg' },
      { name: 'はづき', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1776_20260414134032_900_1200_0.jpg' },
      { name: 'りり', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1807_20260302135659_900_1200_0.jpg' },
      { name: 'もも', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1795_20260411155048_900_1200_0.jpg' },
      { name: 'あすか', url: 'https://otona-neverland.net/wp-content/uploads/2026/06/4212_20260606180955_900_1200_0.jpg' },
      { name: 'ひなた', url: 'https://otona-neverland.net/wp-content/uploads/2026/05/4125_20260524170910_900_1200_0.jpg' },
      { name: 'めい', url: 'https://otona-neverland.net/wp-content/uploads/2026/04/3971_20260502201914_900_1200_0.jpg' },
      { name: 'れいら', url: 'https://otona-neverland.net/wp-content/uploads/2026/04/3944_20260514182447_900_1200_0.jpg' },
      { name: 'かほ', url: 'https://otona-neverland.net/wp-content/uploads/2026/04/3896_20260514230606_900_1200_0.jpg' },
      { name: 'かりな', url: 'https://otona-neverland.net/wp-content/uploads/2026/04/3873_20260425174127_900_1200_0.jpg' },
      { name: 'はる', url: 'https://otona-neverland.net/wp-content/uploads/2026/04/3858_20260425164113_900_1200_0.jpg' },
      { name: 'める', url: 'https://otona-neverland.net/wp-content/uploads/2026/03/3846_20260430235641_900_1200_0.jpg' },
      { name: 'はな', url: 'https://otona-neverland.net/wp-content/uploads/2025/12/2874_20260606203109_900_1200_0.jpg' },
      { name: 'つばさ', url: 'https://otona-neverland.net/wp-content/uploads/2025/10/2387_20260529165839_900_1200_0.jpg' },
      { name: 'まりん', url: 'https://otona-neverland.net/wp-content/uploads/2025/11/2589_20260403171025_900_1200_0.jpg' },
      { name: 'しおん', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1782_20260307201741_900_1200_0.jpg' },
      { name: 'あん', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1819_20260201185216_900_1200_0.jpg' },
      { name: 'なごみ', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1835_20260207000145_900_1200_0.jpg' },
      { name: 'ゆう', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1823_20260410224428_900_1200_0.jpg' },
      { name: 'じゅり', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1799_20260516174430_900_1200_0.jpg' },
      { name: 'よる', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1839_20260411183120_900_1200_0.jpg' },
      { name: 'いぶき', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1786_20251205213633_900_1200_0.jpg' },
      { name: 'かな', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1855_20260201191051_900_1200_0.jpg' },
      { name: 'ゆき', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1831_20260201190539_900_1200_0.jpg' },
      { name: 'みつは', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1851_20260201192504_900_1200_0.jpg' },
      { name: 'なぎさ', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1859_20251226170802_900_1200_0.jpg' },
      { name: 'りこ', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1843_20260514221349_900_1200_0.jpg' },
      { name: 'えみり', url: 'https://otona-neverland.net/wp-content/uploads/2025/06/1868_20260201195921_900_1200_0.jpg' },
      { name: 'りの', url: 'https://estemax.net/neverland/wp-content/uploads/2025/06/Rino_221_800_1067.jpg' },
    ],
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
      if (existingNames.has(t.name.replace(/[\s　]/g, ''))) { process.stdout.write('s'); continue; }
      const storageKey = `${shop.shopId}_${t.name}`.replace(/[^\w-]/g, '_');
      const imageUrl = await uploadImage(t.url, storageKey, shop.referer);
      await sleep(200);
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
