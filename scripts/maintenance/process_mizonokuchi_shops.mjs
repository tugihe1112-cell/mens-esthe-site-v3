/**
 * 溝の口エリア 7店舗 登録スクリプト
 *   - tan (タン)          1位 100名  images_staff (aroma-tan.net/staff.php)
 *   - Relaxia (リラクシア) 3位  49名  images_staff (aroma-relaxia.com/staff.php)
 *   - MOANA (モアナ)       4位  31名  wp-content   (ハードコード)
 *   - ACRO (アクロ)        6位  35名  caskan CDN   (acro-spa.com/therapist)
 *   - ORION SPA           8位  37名  images_staff (esthe-orion.net/staff.php)
 *   - 星の王子さま          9位  24名  Cloudflare   (ハードコード)
 *   - Feel (フィール)      10位  67名  名前のみ      (ハードコード)
 *   ※ エステ美人マダム(2位)・ラプソディースパ(7位)は武蔵小杉登録済み
 *   ※ doigt de fee(5位)は名前非公開のためスキップ
 *
 * 実行:
 *   node scripts/maintenance/process_mizonokuchi_shops.mjs --dry-run
 *   node scripts/maintenance/process_mizonokuchi_shops.mjs
 *   node scripts/maintenance/process_mizonokuchi_shops.mjs --shop tan
 *   node scripts/maintenance/process_mizonokuchi_shops.mjs --shop relaxia
 *   node scripts/maintenance/process_mizonokuchi_shops.mjs --shop moana
 *   node scripts/maintenance/process_mizonokuchi_shops.mjs --shop acro
 *   node scripts/maintenance/process_mizonokuchi_shops.mjs --shop orion
 *   node scripts/maintenance/process_mizonokuchi_shops.mjs --shop hoshi
 *   node scripts/maintenance/process_mizonokuchi_shops.mjs --shop feel
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

// ── ユーティリティ ──────────────────────────────────────────────
async function uploadImage(src, key, referer) {
  if (!src) return null;
  try {
    const res = await fetch(src, { headers: { 'User-Agent': UA, ...(referer ? { 'Referer': referer } : {}) } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = src.split('?')[0].toLowerCase();
    const ct = ext.endsWith('.png') ? 'image/png' : (ext.endsWith('.webp') ? 'image/webp' : 'image/jpeg');
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('E'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(shop) {
  if (DRY_RUN) { console.log(`  [DRY] ${shop.id}`); return; }
  const { error } = await supabase.from('shops').upsert(shop, { onConflict: 'id' });
  if (error) console.error('  Shop error:', error.message);
  else console.log(`  ✅ ${shop.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    if (DRY_RUN) { process.stdout.write('+'); ins++; continue; }
    const url = await uploadImage(t.src, t.key, referer);
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { err++; process.stdout.write('x'); }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`\n  挿入:${ins} スキップ:${skp} エラー:${err}`);
}

// ── 動的スクレイピング (images_staff) ─────────────────────────
async function fetchImagesStaff(url, keyPrefix, referer) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': referer } });
  const html = await res.text();
  const items = [], seen = new Set();
  const NOISE = /割引|キャンペーン|求人|banner|logo|LINE|Twitter|SNS|spacer|icon|btn|アイコン|予約|コース/i;
  const reg = /alt="([^"]+)"[^>]*src="([^"]+\/images_staff\/(\d+)\/[^"]+)"/gi;
  const reg2 = /src="([^"]+\/images_staff\/(\d+)\/[^"]+)"[^>]*alt="([^"]+)"/gi;
  let m;
  for (const [r, ni, si] of [[reg, 1, 3], [reg2, 3, 2]]) {
    r.lastIndex = 0;
    while ((m = r.exec(html)) !== null) {
      const name = m[ni].replace(/[\s　]+/g, '').trim();
      const src = m[si === 3 ? 2 : 1].split('?')[0];
      const sid = m[si];
      if (!name || name.length < 2 || name.length > 15 || seen.has(name) || NOISE.test(name)) continue;
      if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) continue;
      seen.add(name);
      items.push({ name, src, key: `${keyPrefix}_${sid}` });
    }
    if (items.length > 0) break;
  }
  return items;
}

// ── 動的スクレイピング (caskan) ────────────────────────────────
async function fetchCaskan(url, keyPrefix) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const items = [], seen = new Set();
  const NOISE = /割引|キャンペーン|早割|ACRO DAY|新人セラピスト|会員様限定/i;
  const reg = /alt="([^"]+)"[^>]*src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.[^"]+)"/gi;
  const reg2 = /src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.[^"]+)"[^>]*alt="([^"]+)"/gi;
  let m;
  for (const [r, ni, si, srci] of [[reg, 1, 3, 2], [reg2, 3, 2, 1]]) {
    r.lastIndex = 0;
    while ((m = r.exec(html)) !== null) {
      const name = m[ni].trim();
      const castId = m[si];
      const src = m[srci];
      if (!name || name.length < 2 || name.length > 15 || seen.has(name) || NOISE.test(name)) continue;
      seen.add(name);
      items.push({ name, castId, src, key: `${keyPrefix}_${castId}` });
    }
    if (items.length > 0) break;
  }
  return items;
}

// ── MOANA ハードコードデータ ──────────────────────────────────
const MOANA_THERAPISTS = [
  {name:'みさ',   src:'https://m-moana.com/wp-content/uploads/2026/05/misa2_eye-370x500.jpg',    key:'moana_misa2'},
  {name:'ゆあ',   src:'https://m-moana.com/wp-content/uploads/2026/05/yua_eye-370x500.jpg',      key:'moana_yua'},
  {name:'さくら', src:'https://m-moana.com/wp-content/uploads/2026/05/sakura_eye-370x500.jpg',   key:'moana_sakura'},
  {name:'つみき', src:'https://m-moana.com/wp-content/uploads/2026/03/tsumiki2_eye-370x500.jpg', key:'moana_tsumiki2'},
  {name:'かな',   src:'https://m-moana.com/wp-content/uploads/2026/02/kana2_eye-370x500.jpg',    key:'moana_kana2'},
  {name:'はるか', src:'https://m-moana.com/wp-content/uploads/2025/12/haruka2_eye-370x500.jpg',  key:'moana_haruka2'},
  {name:'りさ',   src:'https://m-moana.com/wp-content/uploads/2025/12/risa_eye2-370x500.jpg',   key:'moana_risa_eye2'},
  {name:'えりか', src:'https://m-moana.com/wp-content/uploads/2025/11/erika_eye-370x500.jpg',   key:'moana_erika'},
  {name:'もも',   src:null,                                                                        key:'moana_momo'},
  {name:'みつり', src:'https://m-moana.com/wp-content/uploads/2025/11/mitsuri_eye-370x500.jpg', key:'moana_mitsuri'},
  {name:'すみれ', src:'https://m-moana.com/wp-content/uploads/2025/10/sumire2_eye-370x500.jpg', key:'moana_sumire2'},
  {name:'にこ',   src:'https://m-moana.com/wp-content/uploads/2026/03/niko3_eye-370x500.jpg',   key:'moana_niko3'},
  {name:'あさ',   src:'https://m-moana.com/wp-content/uploads/2025/06/asa_eye-370x500.jpg',     key:'moana_asa'},
  {name:'れな',   src:'https://m-moana.com/wp-content/uploads/2025/11/rena_eye2-370x500.jpg',   key:'moana_rena_eye2'},
  {name:'にいな', src:'https://m-moana.com/wp-content/uploads/2025/04/niina2_eye-370x500.jpg',  key:'moana_niina2'},
  {name:'りか',   src:'https://m-moana.com/wp-content/uploads/2025/04/rika_eye2-370x500.jpg',   key:'moana_rika_eye2'},
  {name:'りあ',   src:null,                                                                        key:'moana_ria'},
  {name:'かのあ', src:'https://m-moana.com/wp-content/uploads/2025/01/kanoa6_eye-370x500.jpg',  key:'moana_kanoa6'},
  {name:'るい',   src:'https://m-moana.com/wp-content/uploads/2024/11/rui3_eye-370x500.jpg',    key:'moana_rui3'},
  {name:'あや',   src:'https://m-moana.com/wp-content/uploads/2024/08/aya_eye-370x500.jpg',     key:'moana_aya'},
  {name:'みなみ', src:'https://m-moana.com/wp-content/uploads/2025/06/minami7_eye-370x500.jpg', key:'moana_minami7'},
  {name:'れみ',   src:'https://m-moana.com/wp-content/uploads/2024/06/remi3_eye-370x500.jpg',   key:'moana_remi3'},
  {name:'なお',   src:'https://m-moana.com/wp-content/uploads/2024/05/nao2_eye-370x500.jpg',    key:'moana_nao2'},
  {name:'みずき', src:'https://m-moana.com/wp-content/uploads/2024/03/mizuki3_eye-370x500.jpg', key:'moana_mizuki3'},
  {name:'すい',   src:'https://m-moana.com/wp-content/uploads/2023/12/sui3_eye-370x500.jpg',    key:'moana_sui3'},
  {name:'ひな',   src:'https://m-moana.com/wp-content/uploads/2023/08/hina%EF%BC%93_eye-370x500.jpg', key:'moana_hina3'},
  {name:'かれん', src:'https://m-moana.com/wp-content/uploads/2023/07/karen2_eye-370x500.jpg',  key:'moana_karen2'},
  {name:'ゆい',   src:'https://m-moana.com/wp-content/uploads/2023/07/yui4_eye-370x500.jpg',    key:'moana_yui4'},
  {name:'ひまり', src:null,                                                                        key:'moana_himari'},
  {name:'めい',   src:'https://m-moana.com/wp-content/uploads/2023/01/mei3_eye-370x500.jpg',    key:'moana_mei3'},
  {name:'あお',   src:null,                                                                        key:'moana_ao'},
];

// ── 星の王子さま ハードコードデータ ──────────────────────────
const HOSHI_THERAPISTS = [
  {name:'鈴村れみ',    src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/eb65673e-8813-40a4-dcab-c5130b000400/member', key:'hoshi_eb65673e'},
  {name:'青山あさみ',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/d22ea3ba-96e9-4ddf-3f3f-61d6d9732d00/member', key:'hoshi_d22ea3ba'},
  {name:'柊木めい',    src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/07df30b0-00c6-49aa-14d6-19369378e200/member', key:'hoshi_07df30b0'},
  {name:'鮎川ひとみ',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/a475dc3e-2744-48be-a90c-f3391f517800/member', key:'hoshi_a475dc3e'},
  {name:'白石ひめか',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/69ed4cdd-b4da-48b1-48fb-aff35957be00/member', key:'hoshi_69ed4cdd'},
  {name:'小倉まあや',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/d898b6b2-e834-46f5-6a1f-fe66fb74aa00/member', key:'hoshi_d898b6b2'},
  {name:'星川あおい',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/75e15258-4c68-48d2-0e57-ef826530b600/member', key:'hoshi_75e15258'},
  {name:'七沢ゆら',    src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/4399aa1e-fcb1-4fbb-7215-425849c17a00/member', key:'hoshi_4399aa1e'},
  {name:'藤崎もえか',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/7349e295-fc05-407f-1ff8-610924cbee00/member', key:'hoshi_7349e295'},
  {name:'初音ゆりな',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/78dc98dc-7d00-40b3-2195-7c2265b1f400/member', key:'hoshi_78dc98dc'},
  {name:'佐々木ひなの',src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/88b51d8c-3340-4881-134a-bd9d1253b100/member', key:'hoshi_88b51d8c'},
  {name:'雪乃あやね',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/38afb6f0-a1a7-44e4-cebd-7ec7b9fd4100/member', key:'hoshi_38afb6f0'},
  {name:'芹沢ゆな',    src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/40a9a816-ec72-4c44-c5ed-aa1985092500/member', key:'hoshi_40a9a816'},
  {name:'藤原ほのか',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/b8213296-efd7-4908-9a20-788ec942b200/member', key:'hoshi_b8213296'},
  {name:'倉持えみり',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/cecac4ed-57b4-4502-7a2a-2ce4a4481f00/member', key:'hoshi_cecac4ed'},
  {name:'米倉あんり',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/29429d41-aa71-4249-6656-49377b77b900/member', key:'hoshi_29429d41'},
  {name:'月野さら',    src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/a8228f24-6897-41a4-c034-f6598486d100/member', key:'hoshi_a8228f24'},
  {name:'清原ゆうか',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/8cdf6cd6-b6c5-46f6-5eeb-de23e2f4a200/member', key:'hoshi_8cdf6cd6'},
  {name:'麻美まゆ',    src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/e12129d7-a6a8-487d-99ec-047ccd2eeb00/member', key:'hoshi_e12129d7'},
  {name:'三上りあ',    src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/125e3848-0ee5-4a8f-d630-d00793a9b900/member', key:'hoshi_125e3848'},
  {name:'浅田みれい',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/91acb282-6649-4bb0-41f4-26db46946800/member', key:'hoshi_91acb282'},
  {name:'海老原まい',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/cabd5e0a-5a64-4324-034a-f0f10f052300/member', key:'hoshi_cabd5e0a'},
  {name:'長澤ひなの',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/9e4fbc17-7e94-4f1f-5f9e-feec39510f00/member', key:'hoshi_9e4fbc17'},
  {name:'芦田まりな',  src:'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/3027fb05-69d3-47a9-77ee-a80d5f7c9c00/member', key:'hoshi_3027fb05'},
];

// ── Feel ハードコードデータ (名前のみ) ─────────────────────────
const FEEL_THERAPISTS = [
  'きこ','さな','ひめか','みく','りん','みこ','りの','るり','せな','えな',
  'さくら','るい','かのん','ゆめ','ねい','りり','のあ','しほ','れいか','まな',
  'もも','りむ','はな','なぎ','まこ','れん','まゆ','るな','あいり','りょう',
  'あみ','みゆ','せり','もえ','ゆう','かほ','まい','りこ','えれん','めい',
  'ゆみ','ねね','もか','りま','あい','れみ','みか','りさ','みき','すず',
  'りか','あき','さち','みつき','ほのか','あかり','ひめ','みらい','えみり',
  'かれん','あんず','めあ','ゆい','かんな','まりか','まみ','かりん',
].map(name => ({ name, src: null, key: `feel_${name}` }));

// ── 店舗定義 ──────────────────────────────────────────────────
const SHOPS = [
  {
    arg: 'tan',
    shop: { id: 'kanagawa_kawasaki_mizonokuchi_tan', name: 'tan (タン)', website_url: 'http://aroma-tan.net/', schedule_url: 'http://aroma-tan.net/schedule.php', image_url: null, raw_data: { prefecture: '神奈川県', area: '溝の口' } },
    fetchFn: () => fetchImagesStaff('https://aroma-tan.net/staff.php', 'tan', 'https://aroma-tan.net/'),
    referer: 'https://aroma-tan.net/',
  },
  {
    arg: 'relaxia',
    shop: { id: 'kanagawa_kawasaki_mizonokuchi_relaxia', name: 'Relaxia (リラクシア)', website_url: 'https://aroma-relaxia.com/', schedule_url: 'https://aroma-relaxia.com/schedule.php', image_url: null, raw_data: { prefecture: '神奈川県', area: '溝の口' } },
    fetchFn: () => fetchImagesStaff('https://aroma-relaxia.com/staff.php', 'relaxia', 'https://aroma-relaxia.com/'),
    referer: 'https://aroma-relaxia.com/',
  },
  {
    arg: 'moana',
    shop: { id: 'kanagawa_kawasaki_mizonokuchi_moana', name: 'Moana (モアナ) 溝の口', website_url: 'https://m-moana.com/', schedule_url: 'https://m-moana.com/schedule/', image_url: null, raw_data: { prefecture: '神奈川県', area: '溝の口' } },
    fetchFn: async () => MOANA_THERAPISTS,
    referer: 'https://m-moana.com/',
  },
  {
    arg: 'acro',
    shop: { id: 'kanagawa_kawasaki_mizonokuchi_acro', name: 'ACRO (アクロ)', website_url: 'https://acro-spa.com/', schedule_url: 'https://acro-spa.com/schedule', image_url: null, raw_data: { prefecture: '神奈川県', area: '溝の口' } },
    fetchFn: () => fetchCaskan('https://acro-spa.com/therapist', 'acro'),
    referer: null,
  },
  {
    arg: 'orion',
    shop: { id: 'kanagawa_kawasaki_mizonokuchi_orion_spa', name: 'ORION SPA (オリオンスパ)', website_url: 'https://esthe-orion.net/', schedule_url: 'https://esthe-orion.net/schedule.php', image_url: null, raw_data: { prefecture: '神奈川県', area: '溝の口' } },
    fetchFn: () => fetchImagesStaff('https://esthe-orion.net/staff.php', 'orion', 'https://esthe-orion.net/'),
    referer: 'https://esthe-orion.net/',
  },
  {
    arg: 'hoshi',
    shop: { id: 'kanagawa_kawasaki_mizonokuchi_hoshi_ojisama', name: '星の王子さま', website_url: 'https://hoshiohji.com/', schedule_url: 'https://hoshiohji.com/schedule/', image_url: null, raw_data: { prefecture: '神奈川県', area: '溝の口' } },
    fetchFn: async () => HOSHI_THERAPISTS,
    referer: null,
  },
  {
    arg: 'feel',
    shop: { id: 'kanagawa_kawasaki_mizonokuchi_feel', name: 'Feel (フィール) 溝の口', website_url: 'https://mensesthefeel.com/', schedule_url: 'https://mensesthefeel.com/schedule/', image_url: null, raw_data: { prefecture: '神奈川県', area: '溝の口' } },
    fetchFn: async () => FEEL_THERAPISTS,
    referer: null,
  },
];

// ── メイン ────────────────────────────────────────────────────
async function main() {
  console.log(`=== 溝の口7店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);
  for (const { arg, shop, fetchFn, referer } of SHOPS) {
    if (!run(arg)) continue;
    console.log(`--- ${shop.name} ---`);
    await registerShop(shop);
    const therapists = await fetchFn();
    console.log(`  ${therapists.length}名取得`);
    if (therapists.length === 0) { console.log('  ⚠️ 取得失敗'); continue; }
    await registerTherapists(shop.id, therapists, referer);
  }
  console.log('\n=== 完了 ===');
}
main().catch(console.error);
