/**
 * 新宿2店舗 登録スクリプト
 *   - CorCaroli (コルカロリ) 24名 — cor-caroli.net (WordPress)
 *   - Aroma Jewels (アロマジュエルズ) 20名 — aromajewels-shinjuku.com (estama.jp CDN)
 *
 * 実行:
 *   node scripts/maintenance/process_shinjuku_shops.mjs --dry-run
 *   node scripts/maintenance/process_shinjuku_shops.mjs
 *   node scripts/maintenance/process_shinjuku_shops.mjs --shop corcaroli
 *   node scripts/maintenance/process_shinjuku_shops.mjs --shop jewels
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

// ===== CorCaroli =====
const CORCAROLI_SHOP = {
  id: 'tokyo_shinjuku_higashishinjuku_corcaroli',
  name: 'CorCaroli (コルカロリ)',
  website_url: 'https://cor-caroli.net/',
  schedule_url: 'https://cor-caroli.net/schedule/',
  image_url: 'https://cor-caroli.net/wp-content/uploads/2025/03/f80fd9ffe83ce3bbcbb316fdf7ba9c15.jpg',
  raw_data: { prefecture: '東京都', area: '新宿' },
};

// WordPress wp-content/uploads、24名
// key: インデックス付きで衝突防止（同一ファイル名が複数存在するため）
const CORCAROLI_THERAPISTS = [
  { name: '本郷ましろ',  src: 'https://cor-caroli.net/wp-content/uploads/2025/03/f80fd9ffe83ce3bbcbb316fdf7ba9c15.jpg', key: 'corcaroli_0' },
  { name: '三好えま',    src: 'https://cor-caroli.net/wp-content/uploads/2026/01/6c399f84adb294dbc333a1745baaa587-e1769264170831.jpg', key: 'corcaroli_1' },
  { name: '真野みこと',  src: 'https://cor-caroli.net/wp-content/uploads/2023/07/c40059194f158cfa4281f115757b70cc-e1688979776121.jpg', key: 'corcaroli_2' },
  { name: '如月るい',    src: 'https://cor-caroli.net/wp-content/uploads/2023/12/471624e6f5f0b01eb923bb64df168a8a-e1701434941763.jpg', key: 'corcaroli_3' },
  { name: '竹内まほ',    src: 'https://cor-caroli.net/wp-content/uploads/2025/10/f14a8387a3f69a9890bf7e326cd981e9.jpg', key: 'corcaroli_4' },
  { name: '金内なお',    src: 'https://cor-caroli.net/wp-content/uploads/2024/08/c67d07fd91a8a1bc9c353ccdb98b355d.jpg', key: 'corcaroli_5' },
  { name: '高木きょうか',src: 'https://cor-caroli.net/wp-content/uploads/2024/08/c67d07fd91a8a1bc9c353ccdb98b355d.jpg', key: 'corcaroli_6' },
  { name: '千景こはる',  src: 'https://cor-caroli.net/wp-content/uploads/2026/05/bb9fd5124ed747e8c9dc5c7060739c08.jpg', key: 'corcaroli_7' },
  { name: '宇野いおり',  src: 'https://cor-caroli.net/wp-content/uploads/2026/05/212e6dfcf83ee0c4437489c8340318a3.jpg', key: 'corcaroli_8' },
  { name: '風早まや',    src: 'https://cor-caroli.net/wp-content/uploads/2026/05/fa36fc42c3f5d4ecea6bea927a5dfca5-e1779183258628.jpg', key: 'corcaroli_9' },
  { name: '森本かな',    src: 'https://cor-caroli.net/wp-content/uploads/2026/05/75da47012807134b0377b7306b9822d7.jpg', key: 'corcaroli_10' },
  { name: '楠木いちか',  src: 'https://cor-caroli.net/wp-content/uploads/2024/05/c67d07fd91a8a1bc9c353ccdb98b355d.jpg', key: 'corcaroli_11' },
  { name: '最上あずさ',  src: 'https://cor-caroli.net/wp-content/uploads/2026/05/eae1e677791e340ef9f59bcf0b65fa6b.jpg', key: 'corcaroli_12' },
  { name: '戸田ゆいか',  src: 'https://cor-caroli.net/wp-content/uploads/2026/04/IMG_9200.jpeg', key: 'corcaroli_13' },
  { name: '冬橋ふみか',  src: 'https://cor-caroli.net/wp-content/uploads/2026/04/9c2ba91182fa38876c30afdfc050fe74.jpg', key: 'corcaroli_14' },
  { name: '水野ゆめ',    src: 'https://cor-caroli.net/wp-content/uploads/2024/02/c4a2985393507189be94efc6876122b7-e1708365578365.jpg', key: 'corcaroli_15' },
  { name: '青羽すい',    src: 'https://cor-caroli.net/wp-content/uploads/2026/04/IMG_8311-e1777170733752.jpeg', key: 'corcaroli_16' },
  { name: '村瀬あゆみ',  src: 'https://cor-caroli.net/wp-content/uploads/2026/01/c0e323fb01ca66459158d5019a3cae46.jpg', key: 'corcaroli_17' },
  { name: '花森おとは',  src: 'https://cor-caroli.net/wp-content/uploads/2025/03/5fed25e4eff8dd6ede1f8e4b74290a3a-e1742701334270.jpg', key: 'corcaroli_18' },
  { name: '柴崎みらい',  src: 'https://cor-caroli.net/wp-content/uploads/2025/11/b924b788cec328aa0a64a3b34748ae16-e1762737239696.jpg', key: 'corcaroli_19' },
  { name: '栗原もな',    src: 'https://cor-caroli.net/wp-content/uploads/2022/09/3c8dcb4999302c36306530b92ce9e5c8-e1663147735598.jpg', key: 'corcaroli_20' },
  { name: '青山りお',    src: 'https://cor-caroli.net/wp-content/uploads/2026/05/IMG_8362-e1777785046279.jpeg', key: 'corcaroli_21' },
  { name: '桜木ひな',    src: 'https://cor-caroli.net/wp-content/uploads/2026/02/7434d7c8075fffe7576cc42161362638-e1771768647445.jpg', key: 'corcaroli_22' },
  { name: '霧島さゆき',  src: 'https://cor-caroli.net/wp-content/uploads/2025/09/64b231c402e2a5e943e67c787357b8a2.jpg', key: 'corcaroli_23' },
];

// ===== Aroma Jewels =====
const JEWELS_SHOP = {
  id: 'tokyo_shinjuku_shinjuku_aroma_jewels',
  name: 'Aroma Jewels (アロマジュエルズ)',
  website_url: 'https://aromajewels-shinjuku.com/',
  schedule_url: 'https://aromajewels-shinjuku.com/schedule/',
  image_url: 'https://img.estama.jp/shop_data/00000029517/hp/logo/600x600/1v0eq_20240517171700.png',
  raw_data: { prefecture: '東京都', area: '新宿' },
};

// estama.jp CDN、20名（Chrome DOM抽出・全URL確認済み）
// Storage key: URLのランダムハッシュ部分（ユニーク）
const JEWELS_THERAPISTS = [
  { name: '早乙女 せいら', id: '159536', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_6gi6m_20250205023433.jpg' },
  { name: '白雪 おと',     id: '420667', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_cps7i_20250712031729.jpg' },
  { name: '白花 かれん',   id: '293378', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_bnxlt_20250205023412.jpg' },
  { name: '柊 雫',         id: '608504', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/8x8dv_20260327022513.jpg' },
  { name: '桜羽 みさ',     id: '826366', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/5q7ug_20260418205457.jpg' },
  { name: '日南 ちか',     id: '843869', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/5o1cw_20260407232203.jpg' },
  { name: '姫野 アリス',   id: '244472', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_ascal_20250704050931.jpg' },
  { name: '田中 ほのか',   id: '849527', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/1r08v_20260404113533.jpg' },
  { name: '相沢 ちの',     id: '274554', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_29bc5_20250205023747.jpg' },
  { name: '如月 るり',     id: '815699', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/c43od_20260323225545.jpg' },
  { name: '月見 まこ',     id: '830644', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/decx8_20260510201807.jpg' },
  { name: '西野 るな',     id: '340452', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/2ha94_20260313030027.jpg' },
  { name: '四葉 まや',     id: '641234', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_53p0h_20251218235631.jpg' },
  { name: '清花 より',     id: '709742', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_dk5t8_20250918023602.jpg' },
  { name: '桐谷 ゆめみ',   id: '727934', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_a74fx_20251014221013.jpg' },
  { name: '橋本 ゆめか',   id: '758082', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/2pqou_20260518033823.jpg' },
  { name: '華宮 れいら',   id: '479933', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/2gp5f_20260522021627.jpg' },
  { name: '若葉 りり',     id: '547823', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_6dyqa_20250508000217.jpg' },
  { name: '青葉 モカ',     id: '518379', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/img_1dekx_20250205023638.jpg' },
  { name: '小玉 あすな',   id: '771558', src: 'https://img.estama.jp/shop_data/00000029517/cast/main/357x556/617ki_20260528162506.jpg' },
].map(t => ({
  ...t,
  // Storage key: URLのランダムハッシュ部分（ユニーク）
  key: 'jewels_' + (t.src.match(/\/([a-z0-9]+)_\d{14}\.jpg/) || t.src.match(/\/img_([a-z0-9]+)_/))?.[1] || t.id,
}));

// ===== 共通 =====
async function uploadImage(imgUrl, key, referer) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imgUrl, { headers });
    if (!res.ok) { console.error(`\n  ✗ fetch ${res.status}: ${imgUrl}`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
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

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    const url = DRY_RUN ? t.src : await uploadImage(t.src, t.key, referer);
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
  return { ins, skp, err };
}

async function main() {
  console.log(`=== 新宿2店舗 登録スクリプト (DRY_RUN=${DRY_RUN}) ===\n`);
  const runCorCaroli = !shopArg || shopArg === 'corcaroli';
  const runJewels    = !shopArg || shopArg === 'jewels';

  if (runCorCaroli) {
    console.log(`--- CorCaroli ${CORCAROLI_THERAPISTS.length}名 ---`);
    await registerShop(CORCAROLI_SHOP);
    await registerTherapists(CORCAROLI_SHOP.id, CORCAROLI_THERAPISTS, 'https://cor-caroli.net');
  }

  if (runJewels) {
    console.log(`\n--- Aroma Jewels ${JEWELS_THERAPISTS.length}名 ---`);
    await registerShop(JEWELS_SHOP);
    await registerTherapists(JEWELS_SHOP.id, JEWELS_THERAPISTS, 'https://aromajewels-shinjuku.com');
  }

  console.log('\n=== 完了 ===');
}

main().catch(console.error);
