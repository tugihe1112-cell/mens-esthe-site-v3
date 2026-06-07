/**
 * a l'aise SK (アレイズSK) 登録スクリプト
 *   - 荻窪ルーム (46名) — tokyo_suginami_ogikubo_alaise_sk
 *   - 高田馬場ルーム (5名) — tokyo_shinjuku_takadanobaba_alaise_sk
 * 公式: https://a-laise-sk.com/
 * WordPress wp-content/uploads、Referer付きでStorage移行
 *
 * 実行:
 *   node scripts/maintenance/process_alaise_sk.mjs --dry-run
 *   node scripts/maintenance/process_alaise_sk.mjs
 *   node scripts/maintenance/process_alaise_sk.mjs --shop ogikubo
 *   node scripts/maintenance/process_alaise_sk.mjs --shop takadanobaba
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();
const BASE = 'https://a-laise-sk.com';

const OGIKUBO_SHOP = {
  id: 'tokyo_suginami_ogikubo_alaise_sk',
  name: 'a l\'aise SK (アレイズSK) 荻窪',
  website_url: `${BASE}/`,
  schedule_url: `${BASE}/schedule/`,
  image_url: 'https://a-laise-sk.com/wp-content/uploads/2025/01/S__41795662-450x675.jpg',
  raw_data: { prefecture: '東京都', area: '荻窪' },
};

const TAKADANOBABA_SHOP = {
  id: 'tokyo_shinjuku_takadanobaba_alaise_sk',
  name: 'a l\'aise SK (アレイズSK) 高田馬場',
  website_url: `${BASE}/`,
  schedule_url: `${BASE}/schedule/`,
  image_url: 'https://a-laise-sk.com/wp-content/uploads/2025/01/S__41795666-450x675.jpg',
  raw_data: { prefecture: '東京都', area: '高田馬場' },
};

// 全53名（ノイズ除外済み）Chrome DOM抽出・スケジュールでルーム判定
const ALL_THERAPISTS = [
  // 高田馬場 (5名)
  {name:'浅香のあ',    src:'https://a-laise-sk.com/wp-content/uploads/2026/05/asaka.jpg',                                    room:'高田馬場',key:'alaise_taka_asaka.jpg'},
  {name:'藤沢れい',    src:'https://a-laise-sk.com/wp-content/uploads/2025/01/46fba765-0c0c-4ea2-ad2d-e92c2a21efbf.jpg',      room:'高田馬場',key:'alaise_taka_46fba765'},
  {name:'椎名あやみ',  src:'https://a-laise-sk.com/wp-content/uploads/2025/01/1ca067ef-8055-4aca-aa7a-1b3387125ff3.png',      room:'高田馬場',key:'alaise_taka_1ca067ef'},
  {name:'青山りか',    src:'https://a-laise-sk.com/wp-content/uploads/2025/01/c8fe23ab-b613-4294-b3d6-1ac51cbecf83.jpg',      room:'高田馬場',key:'alaise_taka_c8fe23ab'},
  {name:'白川ゆずは',  src:'https://a-laise-sk.com/wp-content/uploads/2025/11/shirakawa1.jpg',                                room:'高田馬場',key:'alaise_taka_shirakawa1.jpg'},
  // 荻窪 (48名 → ノイズ2除外で46名)
  {name:'加藤みゆ',         src:'https://a-laise-sk.com/wp-content/uploads/2026/05/katou.jpg',                                room:'荻窪',key:'alaise_ogi_katou.jpg'},
  {name:'天野ゆき',         src:'https://a-laise-sk.com/wp-content/uploads/2026/04/amano.jpg',                                room:'荻窪',key:'alaise_ogi_amano.jpg'},
  {name:'滝沢ひな',         src:'https://a-laise-sk.com/wp-content/uploads/2026/04/takizawa.jpg',                             room:'荻窪',key:'alaise_ogi_takizawa.jpg'},
  {name:'西山わこ',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/05d0ccc4-e41f-4e41-920c-8972d8f917c1.jpg', room:'荻窪',key:'alaise_ogi_05d0ccc4'},
  {name:'木村あおい',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/c2e91ee4-f3fb-4c72-a543-3d3da6ae5ad8.jpg', room:'荻窪',key:'alaise_ogi_c2e91ee4'},
  {name:'天音(あまね)はな', src:'https://a-laise-sk.com/wp-content/uploads/2026/01/amane33.jpg',                              room:'荻窪',key:'alaise_ogi_amane33.jpg'},
  {name:'綾瀬こはる',       src:'https://a-laise-sk.com/wp-content/uploads/2025/07/ayase2.jpg',                               room:'荻窪',key:'alaise_ogi_ayase2.jpg'},
  {name:'青木りず',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/f72aaabe-0b44-4fe5-a621-09ebab3f89f5.jpg', room:'荻窪',key:'alaise_ogi_f72aaabe'},
  {name:'安藤なつみ',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/7e6d9f31-9e74-4d1f-9b8e-09bb3e92e9c7.jpg', room:'荻窪',key:'alaise_ogi_7e6d9f31'},
  {name:'宮世あかり',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/9d81dda2-4e02-4f27-852c-4f7fe479e02e.jpg', room:'荻窪',key:'alaise_ogi_9d81dda2'},
  {name:'坂口まりか',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/fe1d86ec-1b29-44b5-8286-7b73c04b6f89.jpg', room:'荻窪',key:'alaise_ogi_fe1d86ec'},
  {name:'大崎あきほ',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/e8e12462-5eb8-41bb-b1d5-8fa3ad16c4cc.jpg', room:'荻窪',key:'alaise_ogi_e8e12462'},
  {name:'大和らん',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/bb5cebab-6cf7-4c3a-9b09-22b7e1ffe28c.jpg', room:'荻窪',key:'alaise_ogi_bb5cebab'},
  {name:'三田あんな',       src:'https://a-laise-sk.com/wp-content/uploads/2025/11/mita1.jpg',                                room:'荻窪',key:'alaise_ogi_mita1.jpg'},
  {name:'櫻井はるな',       src:'https://a-laise-sk.com/wp-content/uploads/2025/10/sakurai.jpg',                              room:'荻窪',key:'alaise_ogi_sakurai.jpg'},
  {name:'国松れん',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/04a9bac8-d786-4bcb-b21b-8ee9afdb4ca8.jpg', room:'荻窪',key:'alaise_ogi_04a9bac8'},
  {name:'河北みのり',       src:'https://a-laise-sk.com/wp-content/uploads/2025/06/kawakita1.jpg',                            room:'荻窪',key:'alaise_ogi_kawakita1.jpg'},
  {name:'冴木(さえき)ゆうこ',src:'https://a-laise-sk.com/wp-content/uploads/2025/01/1940576c-7ec7-42f6-a912-0978cdf0bd99.jpg',room:'荻窪',key:'alaise_ogi_1940576c'},
  {name:'岡本みゆき',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/93d4e0a2-99d6-49e0-8c23-a9de5fdf6175.png', room:'荻窪',key:'alaise_ogi_93d4e0a2'},
  {name:'森すずか',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/e5d7cf0f-5174-44b4-9b8e-e440cfffeef9.jpg', room:'荻窪',key:'alaise_ogi_e5d7cf0f'},
  {name:'夏木ひとみ',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/ba53d14c-3fc3-4f0c-a10d-b23ad20c8d15.jpg', room:'荻窪',key:'alaise_ogi_ba53d14c'},
  {name:'高野さき',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/4e0e9985-e5e6-4bf6-8a9c-9e23e2a41e88.jpg', room:'荻窪',key:'alaise_ogi_4e0e9985'},
  {name:'風吹じゅりあ',     src:'https://a-laise-sk.com/wp-content/uploads/2025/01/c56e8e00-e4dc-434d-b6e8-4f7e0d4eb4a5.jpg', room:'荻窪',key:'alaise_ogi_c56e8e00'},
  {name:'仲野りょうこ',     src:'https://a-laise-sk.com/wp-content/uploads/2025/01/b7814a21-39d0-4662-8ac3-06e3dacede21.png', room:'荻窪',key:'alaise_ogi_b7814a21'},
  {name:'深田りん',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/9f1df03a-f59c-4e9a-abba-6e4948d5266b.jpg', room:'荻窪',key:'alaise_ogi_9f1df03a'},
  {name:'柏木みお',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/6538ccf7-7b25-471f-9194-491201c62cd7.jpg', room:'荻窪',key:'alaise_ogi_6538ccf7'},
  {name:'泉あんじゅ',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/cbd2210c-fdd7-4513-baa3-51773c86889a.jpg', room:'荻窪',key:'alaise_ogi_cbd2210c'},
  {name:'春野しおり',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/08ad0bfd-6106-437d-9eed-fd78c26fd516.jpg', room:'荻窪',key:'alaise_ogi_08ad0bfd'},
  {name:'本城あずさ',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/09ee848f-cc11-4fef-9819-a4c5a0984538.jpg', room:'荻窪',key:'alaise_ogi_09ee848f'},
  {name:'結城りな',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/4016fac4-82cb-495b-8b1b-efa11605e5bf.jpg', room:'荻窪',key:'alaise_ogi_4016fac4'},
  {name:'佐久間かほ',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/8b65af91-5cf7-4ef9-bd11-2ac1e4d7c9fe.jpg', room:'荻窪',key:'alaise_ogi_8b65af91'},
  {name:'倉田(くらた)さな', src:'https://a-laise-sk.com/wp-content/uploads/2025/01/b8a96e56-0e42-4b02-9c54-b11d00fd2a07.jpg', room:'荻窪',key:'alaise_ogi_b8a96e56'},
  {name:'向井あおい',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/92e5f78b-9a9a-4044-b11e-a8cfb42c7e04.jpg', room:'荻窪',key:'alaise_ogi_92e5f78b'},
  {name:'村上あい',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/63cb5745-8d56-4a5e-8b2e-8a7f9a1aeedf.jpg', room:'荻窪',key:'alaise_ogi_63cb5745'},
  {name:'田中みく',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/b8f3e2a1-5c9d-4f7e-a3b2-1d4e6f8c0a9b.jpg', room:'荻窪',key:'alaise_ogi_b8f3e2a1'},
  {name:'桃川さゆり',       src:'https://a-laise-sk.com/wp-content/uploads/2025/04/thid7fn14lwyba.webp',                       room:'荻窪',key:'alaise_ogi_thid7fn14lwyba'},
  {name:'目黒りさ',         src:'https://a-laise-sk.com/wp-content/uploads/2025/06/meguro1.jpg',                               room:'荻窪',key:'alaise_ogi_meguro1.jpg'},
  {name:'羽鳥りんか',       src:'https://a-laise-sk.com/wp-content/uploads/2025/01/f99f5481-7643-4a86-b494-55c6f0d896b5.jpg', room:'荻窪',key:'alaise_ogi_f99f5481'},
  {name:'西川なな',         src:'https://a-laise-sk.com/wp-content/uploads/2025/01/2c888fd1-b180-4a50-87a7-e561b2d81c3e.jpg', room:'荻窪',key:'alaise_ogi_2c888fd1'},
  {name:'長谷川ひびき',     src:'https://a-laise-sk.com/wp-content/uploads/2025/10/hasegawa1.jpg',                             room:'荻窪',key:'alaise_ogi_hasegawa1.jpg'},
];

// 注: 田中みく のURLは要確認（取得時truncated）→ nullで登録

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { console.error(`\n  ✗ ${res.status}: ${imgUrl}`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { console.error(`\n  ✗ upload: ${error.message}`); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch (e) { console.error(`\n  ✗ ${e.message}`); return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${s.name}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ ${s.id}`);
}

async function registerTherapists(shopId, therapists) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = DRY_RUN ? t.src : await uploadImage(t.src, t.key);
    const record = { id: tid, shop_id: shopId, name: t.name, image_url: url };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}`); err++; }
      else { process.stdout.write(url ? '+' : 'n'); ins++; }
    } else {
      process.stdout.write('+'); ins++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

async function main() {
  console.log(`=== a l'aise SK 登録 (DRY_RUN=${DRY_RUN}) ===\n`);
  const runOgi  = !shopArg || shopArg === 'ogikubo';
  const runTaka = !shopArg || shopArg === 'takadanobaba';

  if (runOgi) {
    const ogikubo = ALL_THERAPISTS.filter(t => t.room === '荻窪');
    console.log(`--- 荻窪ルーム ${ogikubo.length}名 ---`);
    await registerShop(OGIKUBO_SHOP);
    await registerTherapists(OGIKUBO_SHOP.id, ogikubo);
  }

  if (runTaka) {
    const taka = ALL_THERAPISTS.filter(t => t.room === '高田馬場');
    console.log(`\n--- 高田馬場ルーム ${taka.length}名 ---`);
    await registerShop(TAKADANOBABA_SHOP);
    await registerTherapists(TAKADANOBABA_SHOP.id, taka);
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
