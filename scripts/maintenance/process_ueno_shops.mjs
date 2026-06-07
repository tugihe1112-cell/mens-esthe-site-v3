/**
 * 上野・秋葉原エリア 残り店舗 登録スクリプト
 *   - ASOBI (menes-asobi.com) — 16名
 *   - 必殺あきば娘 (hissatsuakbdoll.com) — shop登録のみ（JS描画）
 *   - AROMA AMOUR (akiba-amour.com) — 53名（画像パターン mt_10_1_{uid}）
 *
 * 実行:
 *   node scripts/maintenance/process_ueno_shops.mjs --dry-run
 *   node scripts/maintenance/process_ueno_shops.mjs
 *   node scripts/maintenance/process_ueno_shops.mjs --shop asobi
 *   node scripts/maintenance/process_ueno_shops.mjs --shop amour
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

// ===== ASOBI =====
const ASOBI_SHOP = {
  id: 'tokyo_taito_ueno_asobi',
  name: 'ASOBI (アソビ)',
  website_url: 'https://menes-asobi.com/',
  schedule_url: 'https://menes-asobi.com/schedule',
  image_url: 'https://cdn2-caskan.com/caskan/shop_image/1818_kv_1758857528.jpg',
  raw_data: { prefecture: '東京都', area: '上野' },
};

// caskan.com CMS、16名（4名comingsoon）
const ASOBI_THERAPISTS = [
  { name: 'みつき', castId: 56160, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769488966_6357504.jpg' },
  { name: 'ななせ', castId: 56161, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769097502_2631349.jpg' },
  { name: 'りん',   castId: 56512, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769489298_3893762.jpg' },
  { name: 'ひめか', castId: 56974, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772008575_7565246.jpg' },
  { name: 'もも',   castId: 47121, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1759488209_5268199.jpg' },
  { name: 'つむぎ', castId: 47122, imgUrl: null },
  { name: 'みはる', castId: 47129, imgUrl: null },
  { name: 'らん',   castId: 47128, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1759597235_2641296.jpg' },
  { name: 'ふゆ',   castId: 47127, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1759488239_8782298.jpg' },
  { name: 'みあ',   castId: 47126, imgUrl: null },
  { name: 'ゆの',   castId: 47125, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769077414_3937417.jpg' },
  { name: 'れな',   castId: 47124, imgUrl: null },
  { name: 'かんな', castId: 47123, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1759488219_2725236.jpg' },
  { name: 'りの',   castId: 47111, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1759488140_2400087.jpg' },
  { name: 'りこ',   castId: 47109, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1759488129_7311439.jpg' },
  { name: 'りま',   castId: 47103, imgUrl: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1759488074_3825496.jpg' },
];

// ===== 必殺あきば娘 (shop登録のみ・JS描画でセラピスト取得不可) =====
const AKIBADOLL_SHOP = {
  id: 'tokyo_chiyoda_akihabara_akibadoll',
  name: '必殺あきば娘 (New Plus)',
  website_url: 'https://hissatsuakbdoll.com/',
  schedule_url: 'https://hissatsuakbdoll.com/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '秋葉原' },
};

// ===== AROMA AMOUR =====
const AMOUR_SHOP = {
  id: 'tokyo_chiyoda_akihabara_aroma_amour',
  name: 'AROMA AMOUR (アロマアムール)',
  website_url: 'https://www.akiba-amour.com/',
  schedule_url: 'https://www.akiba-amour.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '秋葉原' },
};

// /staff/ ページから取得（53名）
// 画像パターン: https://www.akiba-amour.com/images/mt_10_1_{uid}.{ext}
// スペーサー画像を使用しているが「本日の出勤」で実際の画像URL確認済み
// uid = プロフィールURLの数字部分
const AMOUR_THERAPISTS = [
  { name: '杉浦ののか', uid: 7252 }, { name: '大森さとみ', uid: 5272 },
  { name: '白咲もえ',   uid: 7236 }, { name: '愛内ここあ', uid: 5485 },
  { name: '外村ゆうき', uid: 5467 }, { name: '武井りな',   uid: 1661 },
  { name: '妹尾うた',   uid: 7405 }, { name: '桐生はるか', uid: 3780 },
  { name: '睦月しの',   uid: 3860 }, { name: '黒川みさ',   uid: 5389 },
  { name: '星ゆうか',   uid: 1673 }, { name: '里吉るの',   uid: 5569 },
  { name: '樋口はづき', uid: 3532 }, { name: '結城ゆあ',   uid: 7377 },
  { name: '上原ゆみか', uid: 5645 }, { name: '綾波めい',   uid: 3405 },
  { name: '北乃ゆうり', uid: 5540 }, { name: '雛森みく',   uid: 5159 },
  { name: '氷堂なつか', uid: 7385 }, { name: '夏木うた',   uid: 4026 },
  { name: '篠咲りょう', uid: 2090 }, { name: '姫宮りか',   uid: 3348 },
  { name: '桜井あいか', uid: 496  }, { name: '安西さおり', uid: 7339 },
  { name: '鈴原らん',   uid: 5210 }, { name: '相原まなみ', uid: 641  },
  { name: '本田あかね', uid: 5652 }, { name: '猫又れあ',   uid: 7237 },
  { name: '堂本まな',   uid: 3552 }, { name: '白坂はな',   uid: 3298 },
  { name: '瀬名ふうか', uid: 4942 }, { name: '星川ひより', uid: 3217 },
  { name: '折原のの',   uid: 1467 }, { name: '牧瀬あゆな', uid: 7393 },
  { name: '花宮さゆみ', uid: 4104 }, { name: '杉野りおん', uid: 6349 },
  { name: '綿貫つばさ', uid: 3572 }, { name: '宮崎ひまり', uid: 5109 },
  { name: '叶まどか',   uid: 7308 }, { name: '苺谷えま',   uid: 4849 },
  { name: '瀬戸なずな', uid: 7349 }, { name: '青野みれい', uid: 7054 },
  { name: '咲宮なぎ',   uid: 5493 }, { name: '川越るな',   uid: 6404 },
  { name: '吉澤みずき', uid: 5642 }, { name: '小町ゆの',   uid: 5526 },
  { name: '西野あいり', uid: 4223 }, { name: '南きこ',     uid: 5576 },
  { name: '渚すずは',   uid: 2943 }, { name: '与田みな',   uid: 3928 },
  { name: '若菜いお',   uid: 6431 }, { name: '宮野まり',   uid: 5329 },
  { name: '藍野ことは', uid: 7256 },
];

// ===== 共通 =====
async function uploadImage(imgUrl, key, referer) {
  try {
    const res = await fetch(imgUrl, { headers: { Referer: referer, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase().split('?')[0];
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${s.name}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ ${s.id}`);
}

async function registerTherapists(shopId, therapists, prefix, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    let url = null;
    if (t.imgUrl) {
      const key = `${prefix}_${t.castId || t.uid}`;
      url = DRY_RUN ? t.imgUrl : await uploadImage(t.imgUrl, key, referer);
    }
    const record = { id: tid, shop_id: shopId, name: t.name, image_url: url };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}`); err++; }
      else { process.stdout.write(url ? '+' : 'n'); ins++; }
    } else {
      process.stdout.write(t.imgUrl ? '+' : 'n'); ins++;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`\n挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

async function fetchAmourImage(uid) {
  // mt_10_1_{uid}.jpeg か mt_10_1_{uid}.jpg か確認
  for (const ext of ['jpeg', 'jpg']) {
    const url = `https://www.akiba-amour.com/images/mt_10_1_${uid}.${ext}`;
    try {
      const r = await fetch(url, { method: 'HEAD', headers: { Referer: 'https://www.akiba-amour.com' } });
      if (r.ok) return url;
    } catch {}
  }
  return null;
}

async function main() {
  console.log(`=== 上野・秋葉原 残り店舗 (DRY_RUN=${DRY_RUN}) ===\n`);
  const runAsobi  = !shopArg || shopArg === 'asobi';
  const runAmour  = !shopArg || shopArg === 'amour';
  const runDoll   = !shopArg || shopArg === 'akibadoll';

  if (runAsobi) {
    console.log(`--- ASOBI ${ASOBI_THERAPISTS.length}名 ---`);
    await registerShop(ASOBI_SHOP);
    await registerTherapists(ASOBI_SHOP.id, ASOBI_THERAPISTS, 'asobi', 'https://menes-asobi.com');
  }

  if (runDoll) {
    console.log(`\n--- 必殺あきば娘 (shop登録のみ) ---`);
    await registerShop(AKIBADOLL_SHOP);
  }

  if (runAmour) {
    console.log(`\n--- AROMA AMOUR ${AMOUR_THERAPISTS.length}名 ---`);
    await registerShop(AMOUR_SHOP);
    // 画像URLを動的に確認してから登録
    const withImages = [];
    for (const t of AMOUR_THERAPISTS) {
      const imgUrl = DRY_RUN ? `https://www.akiba-amour.com/images/mt_10_1_${t.uid}.jpeg` :
                               await fetchAmourImage(t.uid);
      withImages.push({ ...t, imgUrl });
      await new Promise(r => setTimeout(r, 100));
    }
    await registerTherapists(AMOUR_SHOP.id, withImages, 'amour', 'https://www.akiba-amour.com');
  }
}

main().catch(console.error);
