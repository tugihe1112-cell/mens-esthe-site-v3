/**
 * 蒲田・大森エリア 4店舗 登録スクリプト
 * - Shake spa 大森 (5位) 77名 /prof/{id}/top.jpg
 * - KITSUNE 大森・蒲田 (7位) 141名 名前のみ
 * - The Ritz 蒲田 (8位) 10名 名前のみ
 * - Emu Spa 蒲田 (9位) 20名 /images/ml_11_1_{uid}.jpeg
 *
 * 実行:
 *   node scripts/maintenance/process_kamata_omori_shops.mjs --dry-run
 *   node scripts/maintenance/process_kamata_omori_shops.mjs --shop shake
 *   node scripts/maintenance/process_kamata_omori_shops.mjs --shop kitsune
 *   node scripts/maintenance/process_kamata_omori_shops.mjs --shop ritz
 *   node scripts/maintenance/process_kamata_omori_shops.mjs --shop emu
 *   node scripts/maintenance/process_kamata_omori_shops.mjs
 */

import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function uploadImage(imgUrl, key, referer) {
  try {
    const res = await fetch(imgUrl, { headers: { 'Referer': referer, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().split('?')[0].toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const storageKey = `${key}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(storageKey);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(shop) {
  const { error } = await supabase.from('shops').upsert({
    id: shop.id, name: shop.name, website_url: shop.website_url,
    schedule_url: shop.schedule_url, image_url: shop.image_url,
    raw_data: { prefecture: '東京都', area: shop.area }
  }, { onConflict: 'id' });
  if (error) console.error(`✗ ${shop.name}: ${error.message}`);
  else console.log(`✅ ${shop.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const normName = t.name.replace(/\s+/g, ' ').trim();
    const tid = `${shopId}_${normName}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    let url = null;
    if (t.src) url = await uploadImage(t.src, t.key, referer);
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: normName, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { console.error(`\n✗ ${normName}: ${error.message}`); err++; }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

// ===== Shake spa 大森 =====
async function processShakeSpa() {
  console.log('\n=== Shake spa 大森 ===');
  const BASE = 'https://www.shakespa-omori.com';
  const shop = {
    id: 'tokyo_ota_omori_shake_spa',
    name: 'Shake Spa (シェイクスパ) 大森',
    website_url: BASE + '/',
    schedule_url: BASE + '/schedule/',
    image_url: null,
    area: '大森'
  };
  if (!DRY_RUN) await registerShop(shop);
  else console.log(`[DRY] ${shop.name}`);

  // Chrome経由で取得した77名（2026-06-06）
  const RAW_SHAKE = [
    ['ここあ','500'],['はるき','535'],['ありす','534'],['ゆあ','456'],['のどか','481'],
    ['ゆあ','482'],['めい','458'],['たまき','421'],['みく','533'],['かのん','422'],
    ['なお','491'],['りつ','532'],['沢尻みらい','516'],['りむ','530'],['美玲','529'],
    ['さくら','452'],['せいな','526'],['にこり','525'],['なの','524'],['かなめ','522'],
    ['かれん','494'],['まなみ','521'],['あずさ','444'],['かりん','520'],['ひな','519'],
    ['らむ','518'],['りり','517'],['つばき','413'],['らい','514'],['しろ','455'],
    ['月城ゆずは','469'],['れい','504'],['るみな','509'],['れん','445'],['るう','513'],
    ['のえ','508'],['まなか','486'],['あいり','477'],['れみ','478'],['ゆりか','454'],
    ['もか','243'],['かなた','490'],['るみ','488'],['ななか','483'],['ゆうな','484'],
    ['りりか','373'],['るな','476'],['ねる','459'],['水谷 すずな','211'],['きほ','472'],
    ['ゆま','464'],['まお','470'],['すず','461'],['ほのか','388'],['ゆあ','390'],
    ['まりん','423'],['るん','450'],['ふうな','449'],['みやび','396'],['みのり','419'],
    ['水瀬める','420'],['ゆう','370'],['りりあ','324'],['芦名ゆめ','343'],['七瀬 ましろ','284'],
    ['流川ゆり','261'],['つき','286'],['ゆあ','255'],['一条はあと','1'],['もも','398'],
    ['桃香ゆり','183'],['朝倉 みるく','142'],['紫月 のあ','133'],['夢島 ひすい','129'],
    ['えみり','3'],['せな','301'],
  ];
  const therapists = RAW_SHAKE.map(([name, id]) => ({
    name, src: `${BASE}/prof/${id}/top.jpg`, key: `shakespa_${id}`
  }));

  console.log(`登録: ${therapists.length}名`);
  if (!DRY_RUN) await registerTherapists(shop.id, therapists, BASE + '/');
  else console.log(`[DRY] ${therapists.slice(0,3).map(t=>t.name).join(', ')}...`);
}

// ===== KITSUNE 大森・蒲田 =====
async function processKitsune() {
  console.log('\n=== KITSUNE 大森・蒲田 ===');
  const BASE = 'https://kitsune-spa.com';
  const shop = {
    id: 'tokyo_ota_omori_kitsune',
    name: 'KITSUNE (キツネ) 大森・蒲田',
    website_url: BASE + '/',
    schedule_url: BASE + '/schedule.html',
    image_url: null,
    area: '大森'
  };
  if (!DRY_RUN) await registerShop(shop);
  else console.log(`[DRY] ${shop.name}`);

  const html = await fetchHtml(BASE + '/therapist.html');
  const text = html;
  // 「名前(年齢)」パターンで抽出
  const names = [];
  const seen = new Set();
  const matches = text.matchAll(/([ぁ-んァ-ヾ一-龯a-zA-Z一-龯]{2,10})\((\d{2})\)/g);
  for (const m of matches) {
    if (!seen.has(m[1]) && m[1].length <= 8 && /[ぁ-んァ-ヾ一-龯]/.test(m[1])) {
      seen.add(m[1]);
      names.push(m[1]);
    }
  }
  const therapists = names.map(name => ({ name, src: null, key: null }));

  console.log(`取得: ${therapists.length}名（画像なし）`);
  if (!DRY_RUN) await registerTherapists(shop.id, therapists, BASE + '/');
  else console.log(`[DRY] ${therapists.slice(0,5).map(t=>t.name).join(', ')}...`);
}

// ===== The Ritz 蒲田 =====
async function processTheRitz() {
  console.log('\n=== The Ritz 蒲田 ===');
  const BASE = 'https://the-ritz-kamata.com';
  const shop = {
    id: 'tokyo_ota_kamata_the_ritz',
    name: 'The Ritz (ザ・リッツ) 蒲田',
    website_url: BASE + '/',
    schedule_url: BASE + '/schedule/',
    image_url: null,
    area: '蒲田'
  };
  if (!DRY_RUN) await registerShop(shop);
  else console.log(`[DRY] ${shop.name}`);

  // Chrome経由で取得済み（10名・名前のみ）
  const therapists = ['てるみ','しのぶ','もも','みれい','あんな','うらら','えりか','まな','ひより','かすみ']
    .map(name => ({ name, src: null, key: null }));

  console.log(`登録: ${therapists.length}名（画像なし）`);
  if (!DRY_RUN) await registerTherapists(shop.id, therapists, BASE + '/');
  else therapists.forEach(t => process.stdout.write('.'));
}

// ===== Emu Spa 蒲田 =====
async function processEmuSpa() {
  console.log('\n=== Emu Spa 蒲田 ===');
  const BASE = 'https://www.emu-spa.com';
  const shop = {
    id: 'tokyo_ota_kamata_emu_spa',
    name: 'Emu Spa (エミュスパ) 蒲田',
    website_url: BASE + '/',
    schedule_url: BASE + '/schedule/',
    image_url: null,
    area: '蒲田'
  };
  if (!DRY_RUN) await registerShop(shop);
  else console.log(`[DRY] ${shop.name}`);

  // Chrome経由で取得済み（20名、ml_11_1パターン）
  const RAW = [
    ['さら',         'https://www.emu-spa.com/images/ml_11_1_7928.jpeg',  '7928'],
    ['中谷ここな',   'https://www.emu-spa.com/images/ml_11_1_8068.jpeg',  '8068'],
    ['花園あんな',   null, null],
    ['桃乃木なな',   'https://www.emu-spa.com/images/ml_11_1_9168.jpeg',  '9168'],
    ['椿えれな',     'https://www.emu-spa.com/images/ml_11_1_9169.jpeg',  '9169'],
    ['折原くるり',   'https://www.emu-spa.com/images/ml_11_1_9172.jpeg',  '9172'],
    ['瀬名いずみ',   'https://www.emu-spa.com/images/ml_11_1_9174.jpeg',  '9174'],
    ['難波あんず',   'https://www.emu-spa.com/images/ml_11_1_9178.jpeg',  '9178'],
    ['二宮かりな',   'https://www.emu-spa.com/images/ml_11_1_9191.jpeg',  '9191'],
    ['胡桃あい',     'https://www.emu-spa.com/images/ml_11_1_9205.jpeg',  '9205'],
    ['岸本ももか',   'https://www.emu-spa.com/images/ml_11_1_9234.jpeg',  '9234'],
    ['白川ましろ',   'https://www.emu-spa.com/images/ml_11_1_9601.jpeg',  '9601'],
    ['加藤れいな',   'https://www.emu-spa.com/images/ml_11_1_9603.jpeg',  '9603'],
    ['新木しほ',     'https://www.emu-spa.com/images/ml_11_1_9638.jpeg',  '9638'],
    ['芦田ののか',   'https://www.emu-spa.com/images/ml_11_1_9641.jpeg',  '9641'],
    ['五十嵐きらら', 'https://www.emu-spa.com/images/ml_11_1_7865.jpeg',  '7865'],
    ['星名あかり',   'https://www.emu-spa.com/images/ml_11_1_6955.jpeg',  '6955'],
    ['深川まり',     'https://www.emu-spa.com/images/ml_11_1_401.jpeg',   '401'],
    ['小柳るか',     'https://www.emu-spa.com/images/ml_11_1_7.jpeg',     '7'],
  ];

  const seen = new Set();
  const therapists = RAW
    .filter(([name]) => !seen.has(name) && seen.add(name))
    .map(([name, src, uid]) => ({
      name,
      src,
      key: uid ? `emuspa_${uid}` : null
    }));

  console.log(`登録: ${therapists.length}名`);
  if (!DRY_RUN) await registerTherapists(shop.id, therapists, BASE + '/');
  else therapists.forEach(t => process.stdout.write(t.src ? '+' : 'n'));
}

// ===== メイン =====
async function main() {
  console.log(`=== 蒲田・大森エリア 4店舗 登録 (DRY_RUN=${DRY_RUN}) ===`);
  const run = (name) => !shopArg || shopArg === name;

  if (run('shake'))   await processShakeSpa();
  if (run('kitsune')) await processKitsune();
  if (run('ritz'))    await processTheRitz();
  if (run('emu'))     await processEmuSpa();

  console.log('\n=== 全完了 ===');
}
main().catch(console.error);
