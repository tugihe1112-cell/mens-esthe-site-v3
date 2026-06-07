/**
 * 登戸エリア 3店舗 登録スクリプト
 *   - Will Be (ウィルビー)  1位 ~18名  caskan CDN
 *   - ねこのて              2位 ~65名  caskan CDN
 *   - GREEN APPLE          10位 ~65名  caskan CDN
 *   ※ doigt de fee (3位) は名前非公開のためスキップ
 *   ※ Fantastic (4位)・moi SPA (5位) はJS描画のためChrome別途対応
 *
 * 実行:
 *   node scripts/maintenance/process_noborito_shops.mjs --dry-run
 *   node scripts/maintenance/process_noborito_shops.mjs
 *   node scripts/maintenance/process_noborito_shops.mjs --shop willbe
 *   node scripts/maintenance/process_noborito_shops.mjs --shop nekonote
 *   node scripts/maintenance/process_noborito_shops.mjs --shop greenapple
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

// caskan CDN パターン（HTML alt/src属性形式）
async function fetchCaskan(url, keyPrefix) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const items = [], seen = new Set();
  // alt="名前" src="caskan_url" または src="caskan_url" alt="名前" 両パターン対応
  const reg1 = /alt="([^"]+)"[^>]*src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.[^"]+)"/gi;
  const reg2 = /src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.[^"]+)"[^>]*alt="([^"]+)"/gi;
  let m;
  for (const reg of [reg1, reg2]) {
    reg.lastIndex = 0;
    while ((m = reg.exec(html)) !== null) {
      const [, p1, p2, p3] = m;
      const name = (reg === reg1 ? p1 : p3).trim();
      const src  = reg === reg1 ? p2 : p1;
      const castId = reg === reg1 ? p3 : p2;
      if (!name || name.length < 2 || seen.has(name) || /recruit|banner|sns|logo|comingsoon/i.test(name)) continue;
      if (!/[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(name)) continue;
      seen.add(name);
      items.push({ name, castId, src, key: `${keyPrefix}_${castId}` });
    }
    if (items.length > 0) break;
  }
  return items;
}

async function uploadImage(imgUrl, key) {
  if (!imgUrl) return null;
  try {
    const res = await fetch(imgUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
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

async function registerTherapists(shopId, therapists) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    if (DRY_RUN) { process.stdout.write('+'); ins++; continue; }
    const url = await uploadImage(t.src, t.key);
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

const SHOPS = [
  {
    arg: 'willbe',
    shop: {
      id: 'kanagawa_kawasaki_noborito_willbe',
      name: 'Will Be (ウィルビー)',
      website_url: 'https://willbe-noborito.com/',
      schedule_url: 'https://willbe-noborito.com/schedule',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '登戸' },
    },
    url: 'https://willbe-noborito.com/therapist',
    prefix: 'willbe',
  },
  {
    arg: 'nekonote',
    shop: {
      id: 'kanagawa_kawasaki_noborito_nekonote',
      name: 'ねこのて',
      website_url: 'https://esthe-nekonote.com/',
      schedule_url: 'https://esthe-nekonote.com/schedule',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '登戸' },
    },
    url: 'https://esthe-nekonote.com/therapist',
    prefix: 'nekonote',
  },
  {
    arg: 'greenapple',
    shop: {
      id: 'kanagawa_kawasaki_noborito_greenapple',
      name: 'GREEN APPLE (グリーンアップル)',
      website_url: 'https://greenapple-esthe.com/',
      schedule_url: 'https://greenapple-esthe.com/schedule',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '登戸' },
    },
    url: 'https://greenapple-esthe.com/therapist',
    prefix: 'greenapple',
  },
];

async function main() {
  console.log(`=== 登戸3店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);

  for (const { arg, shop, url, prefix } of SHOPS) {
    if (!run(arg)) continue;
    console.log(`--- ${shop.name} ---`);
    await registerShop(shop);
    const therapists = await fetchCaskan(url, prefix);
    console.log(`  ${therapists.length}名取得`);
    if (therapists.length === 0) { console.log('  ⚠️ 取得失敗'); continue; }
    await registerTherapists(shop.id, therapists);
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
