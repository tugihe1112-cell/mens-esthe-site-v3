/**
 * 池袋2店舗 登録スクリプト
 *   - LOVE LAND (love-land.jp) — 48名
 *   - OTONATIC (mens-esthe-salon.net) — 41名
 *
 * 実行:
 *   node scripts/maintenance/process_ikebukuro_shops.mjs --dry-run
 *   node scripts/maintenance/process_ikebukuro_shops.mjs
 *   node scripts/maintenance/process_ikebukuro_shops.mjs --shop loveland
 *   node scripts/maintenance/process_ikebukuro_shops.mjs --shop otonatic
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

// ============================================================
// LOVE LAND
// ============================================================
const LOVELAND_SHOP = {
  id: 'tokyo_toshima_ikebukuro_loveland',
  name: 'LOVE LAND (ラブランド)',
  website_url: 'https://love-land.jp/',
  schedule_url: 'https://love-land.jp/schedule',
  image_url: 'https://cdn2-caskan.com/caskan/img/shop_logo/1053_logo_1651116524.jpg',
  raw_data: { prefecture: '東京都', area: '池袋' },
};

// /therapist ページから取得（48名）
// imgUrl: null = comingsoon（写真未掲載）
// castIdがStorageファイル名キー
const LOVELAND_THERAPISTS = [
  { name: 'ななせ',  castId: 5744,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1780385814_0228713.jpeg' },
  { name: 'るる',    castId: 56525, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1780313030_2545995.jpeg' },
  { name: 'みゆ',    castId: 1483,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1638598208_2208498.jpg' },
  { name: 'さくら',  castId: 8455,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1777688529_2687090.jpeg' },
  { name: 'れい',    castId: 36960, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1753605249_2667122.jpeg' },
  { name: 'ゆき',    castId: 49359, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774159816_6729108.jpeg' },
  { name: 'もなか',  castId: 46371, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1779107448_9465889.jpeg' },
  { name: 'いずみ',  castId: 65613, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1780299467_4209689.jpeg' },
  { name: 'えま',    castId: 10642, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1778405952_2724838.jpeg' },
  { name: 'らら',    castId: 2027,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1780144271_9987327.jpeg' },
  { name: 'もか',    castId: 1659,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1779783342_0825409.jpeg' },
  { name: 'ひめか',  castId: 4447,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1778311220_9474182.jpeg' },
  { name: 'いおり',  castId: 17472, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1779346009_2200374.jpeg' },
  { name: 'のん',    castId: 66538, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1778395144_5348123.jpeg' },
  { name: 'るの',    castId: 17487, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1778219731_3381507.jpeg' },
  { name: 'みな',    castId: 1489,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1779600176_3794017.jpeg' },
  { name: 'もも',    castId: 60878, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773043323_0951401.jpeg' },
  { name: 'みのり',  castId: 1467,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1779280443_2159416.png' },
  { name: 'れな',    castId: 8453,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1778768062_8337186.png' },
  { name: 'つかさ',  castId: 3949,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1777891454_3302533.jpeg' },
  { name: 'なずな',  castId: 63683, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776147797_8827040.jpeg' },
  { name: 'ゆりな',  castId: 24131, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776340486_8173895.jpeg' },
  { name: 'るい',    castId: 65381, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1780141212_6246410.jpeg' },
  { name: 'くろえ',  castId: 16758, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1777545476_1725591.jpeg' },
  { name: 'ゆのん',  castId: 62015, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776851237_3415601.png' },
  { name: 'りか',    castId: 1461,  imgUrl: null },
  { name: 'ゆきな',  castId: 3772,  imgUrl: null },
  { name: 'りあん',  castId: 6857,  imgUrl: null },
  { name: 'るか',    castId: 11650, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1777805097_8559124.jpeg' },
  { name: 'じゅり',  castId: 44145, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1777864350_9958249.png' },
  { name: 'さやか',  castId: 4561,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775377234_6712015.jpeg' },
  { name: 'ゆめ',    castId: 61149, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1777543550_8046192.jpeg' },
  { name: 'さら',    castId: 52793, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1777181156_3104653.jpeg' },
  { name: 'かほ',    castId: 23812, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774343430_3192624.png' },
  { name: 'ひなみ',  castId: 62927, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774762050_1755729.jpeg' },
  { name: 'あいな',  castId: 3796,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1768543157_9572135.jpeg' },
  { name: 'きら',    castId: 53149, imgUrl: null },
  { name: 'こむぎ',  castId: 13478, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1763812021_5994326.png' },
  { name: 'みなみ',  castId: 43663, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1754989910_1341015.jpeg' },
  { name: 'みる',    castId: 9007,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1764067680_0368575.jpeg' },
  { name: 'かるあ',  castId: 47747, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1768033289_6915243.jpeg' },
  { name: 'ひとみ',  castId: 54294, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1777969016_1963481.png' },
  { name: 'ふわり',  castId: 60106, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772688784_1493012.jpeg' },
  { name: 'もえ',    castId: 17470, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1756563774_5625644.jpeg' },
  { name: 'なな',    castId: 4785,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1764228153_5117154.jpeg' },
  { name: 'あみ',    castId: 22160, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1767518628_8977486.jpeg' },
  { name: 'まこ',    castId: 1491,  imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1638599039_9721542.jpg' },
  { name: 'あや',    castId: 1469,  imgUrl: null },
];

// ============================================================
// OTONATIC
// ============================================================
const OTONATIC_SHOP = {
  id: 'tokyo_toshima_ikebukuro_otonatic',
  name: 'OTONATIC (オトナチック)',
  website_url: 'https://www.mens-esthe-salon.net/',
  schedule_url: 'https://www.mens-esthe-salon.net/schedule.shtml',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '池袋' },
};

// /therapist.cgi から取得（41名、フルネーム姓名）
// 画像URL: https://www.mens-esthe-salon.net/schedule/img/{castId}/1_t.jpg
// castId: 218,219,94,217,216,215 は写真なし（新規登録）
const OTONATIC_THERAPISTS = [
  { name: '朝霧えま',     castId: 218, hasImg: false },
  { name: '北見あやか',   castId: 219, hasImg: false },
  { name: '篠原あかり',   castId: 94,  hasImg: false },
  { name: '森下ゆうり',   castId: 217, hasImg: false },
  { name: '川岸はるな',   castId: 216, hasImg: false },
  { name: '水嶋きよみ',   castId: 215, hasImg: false },
  { name: '梓澤ゆう',     castId: 153, hasImg: true },
  { name: '成瀬みお',     castId: 124, hasImg: true },
  { name: '今川えみり',   castId: 73,  hasImg: true },
  { name: '藤崎かおる',   castId: 166, hasImg: true },
  { name: '宇佐美はるか', castId: 134, hasImg: true },
  { name: '星野ひとみ',   castId: 147, hasImg: true },
  { name: '伊吹もえ',     castId: 213, hasImg: true },
  { name: '小林もも',     castId: 199, hasImg: true },
  { name: '南雲みなみ',   castId: 185, hasImg: true },
  { name: '朝倉まな',     castId: 211, hasImg: true },
  { name: '岡田ゆあ',     castId: 126, hasImg: true },
  { name: '杉本りな',     castId: 191, hasImg: true },
  { name: '一ノ瀬ましろ', castId: 131, hasImg: true },
  { name: '夏目らん',     castId: 111, hasImg: true },
  { name: '伊達さゆり',   castId: 170, hasImg: true },
  { name: '西田ひより',   castId: 214, hasImg: true },
  { name: '鮎浜さと',     castId: 168, hasImg: true },
  { name: '雪乃あいみ',   castId: 210, hasImg: true },
  { name: '神崎ゆめか',   castId: 197, hasImg: true },
  { name: '柏木のぞみ',   castId: 180, hasImg: true },
  { name: '七海りこ',     castId: 122, hasImg: true },
  { name: '瀬名かえで',   castId: 157, hasImg: true },
  { name: '八神まゆ',     castId: 206, hasImg: true },
  { name: '高梨あんな',   castId: 209, hasImg: true },
  { name: '東城れいか',   castId: 183, hasImg: true },
  { name: '三上さら',     castId: 42,  hasImg: true },
  { name: '森川あけみ',   castId: 212, hasImg: true },
  { name: '椎名まこと',   castId: 160, hasImg: true },
  { name: '黒崎れな',     castId: 208, hasImg: true },
  { name: '霧島りん',     castId: 52,  hasImg: true },
  { name: '水樹ここ',     castId: 207, hasImg: true },
  { name: '中原れい',     castId: 143, hasImg: true },
  { name: '桜井ゆめ',     castId: 119, hasImg: true },
  { name: '海瀬みどり',   castId: 156, hasImg: true },
  { name: '七瀬まろん',   castId: 98,  hasImg: true },
];

// ============================================================
// 共通
// ============================================================
async function uploadImage(imageUrl, storageKey, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { Referer: referer, 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop().toLowerCase().split('?')[0];
    const contentType = (ext === 'jpeg' || ext === 'jpg') ? 'image/jpeg' : 'image/png';
    const { error } = await supabase.storage.from('therapist-images').upload(`${storageKey}.jpg`, buffer, { contentType, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${storageKey}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function registerShop(shopData) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${shopData.name}`); return; }
  const { error } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ Shop: ${shopData.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let inserted = 0, skipped = 0, errors = 0;
  for (const t of therapists) {
    const therapistId = `${shopId}_${t.name}`;
    const { data: existing } = await supabase.from('therapists').select('id,image_url').eq('id', therapistId).single();
    if (existing?.image_url) { process.stdout.write('='); skipped++; continue; }

    let storageUrl = null;
    if (t.imgUrl) {
      const key = `${shopId.split('_').pop()}_${t.castId}`;
      storageUrl = DRY_RUN ? t.imgUrl : await uploadImage(t.imgUrl, key, referer);
    }

    const record = { id: therapistId, shop_id: shopId, name: t.name, image_url: storageUrl };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}:`, error.message); errors++; }
      else { process.stdout.write(storageUrl ? '+' : 'n'); inserted++; }
    } else {
      process.stdout.write(t.imgUrl ? '+' : 'n'); inserted++;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`\n挿入: ${inserted} / スキップ: ${skipped} / エラー: ${errors}`);
}

async function main() {
  console.log(`=== 池袋2店舗 登録スクリプト (DRY_RUN=${DRY_RUN}) ===\n`);
  const runLoveland = !shopArg || shopArg === 'loveland';
  const runOtonatic = !shopArg || shopArg === 'otonatic';

  if (runLoveland) {
    console.log(`--- LOVE LAND ${LOVELAND_THERAPISTS.length}名 ---`);
    await registerShop(LOVELAND_SHOP);
    // OTONATICのhasImgフラグをimgUrlに変換して渡す
    await registerTherapists(LOVELAND_SHOP.id, LOVELAND_THERAPISTS, 'https://love-land.jp');
  }

  if (runOtonatic) {
    console.log(`\n--- OTONATIC ${OTONATIC_THERAPISTS.length}名 ---`);
    await registerShop(OTONATIC_SHOP);
    // imgUrlを生成してから登録
    const therapistsWithImg = OTONATIC_THERAPISTS.map(t => ({
      ...t,
      imgUrl: t.hasImg ? `https://www.mens-esthe-salon.net/schedule/img/${t.castId}/1_t.jpg` : null,
    }));
    await registerTherapists(OTONATIC_SHOP.id, therapistsWithImg, 'https://www.mens-esthe-salon.net');
  }
}

main().catch(console.error);
