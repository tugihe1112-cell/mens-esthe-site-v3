/**
 * JJ中野 セラピスト登録 + Room one 画像404修正
 *
 * 実行:
 *   node scripts/maintenance/fix_jj_roomone.mjs --dry-run
 *   node scripts/maintenance/fix_jj_roomone.mjs
 *   node scripts/maintenance/fix_jj_roomone.mjs --shop jj
 *   node scripts/maintenance/fix_jj_roomone.mjs --shop roomone
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();

// ===== JJ 中野 =====
// castId → 苗字
const JJ_CAST_IDS = [
  ['一ノ瀬','13665'],['大河','13667'],['瀬野','13654'],['桜井','13662'],['大宮','13646'],
  ['本城','12965'],['馬場','13642'],['七海','13487'],['雪村','13545'],['中森','13078'],
  ['月島','13079'],['水上','12715'],['石川','12682'],['島谷','12672'],['大田','12458'],
  ['米倉','12490'],['吉原','12419'],
];
const JJ_SHOP_ID = 'tokyo_nakano_nakano_jj';

async function fetchJJTherapists() {
  const res = await fetch('https://www.spa-jj.tokyo/cast.html', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  // castIdごとにURLを取得
  const castMap = {};
  const urlReg = /\/images\/gals\/(\d+)-[^"'\s]+/g;
  let m;
  while ((m = urlReg.exec(html)) !== null) {
    const castId = m[1];
    if (!castMap[castId]) castMap[castId] = `https://www.spa-jj.tokyo${m[0]}`;
  }
  return JJ_CAST_IDS.map(([name, castId]) => ({
    name,
    castId,
    src: castMap[castId] || null,
    key: `jj_${castId}`,
  }));
}

// ===== Room one 404修正 =====
// 404だった3名の代替URLを試みる
const BASE = 'https://www.aroma-yuim.com';
const ROOMONE_FIX = [
  // 有坂: 元URL /029ariska/2023.04/2023.04arisaka1-3.jpg が404 → koenji/gazou配下を試す
  { name: '有坂', shop_id: 'tokyo_suginami_koenji_room_one',
    alts: [
      `${BASE}/koenji/gazou/029ariska/2023.04/2023.04arisaka1-3.jpg`,
      `${BASE}/koenji/029ariska/2023.04/2023.04arisaka1-3.jpg`,
    ], key: 'roomone_ariska' },
  // 神咲: 元URL /001kanzaki/2022.02.23/2022.02-2-1.jpg が404
  { name: '神咲', shop_id: 'tokyo_suginami_koenji_room_one',
    alts: [
      `${BASE}/koenji/gazou/001kanzaki/2022.02.23/2022.02-2-1.jpg`,
      `${BASE}/koenji/001kanzaki/2022.02.23/2022.02-2-1.jpg`,
    ], key: 'roomone_kanzaki' },
  // 小川: 元URL /035ogawa/2021.06/ogawa10-2.jpg が404
  { name: '小川', shop_id: 'tokyo_suginami_koenji_room_one',
    alts: [
      `${BASE}/koenji/gazou/035ogawa/2021.06/ogawa10-2.jpg`,
      `${BASE}/koenji/035ogawa/2021.06/ogawa10-2.jpg`,
    ], key: 'roomone_ogawa' },
];

async function uploadImage(imgUrl, key, referer) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imgUrl, { headers });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function fixJJ() {
  console.log('--- JJ 中野 セラピスト登録 ---');
  const therapists = await fetchJJTherapists();
  console.log(`castId→URL マッピング: ${therapists.filter(t=>t.src).length}/${therapists.length}件`);

  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${JJ_SHOP_ID}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    const url = (!DRY_RUN && t.src) ? await uploadImage(t.src, t.key, 'https://www.spa-jj.tokyo') : (DRY_RUN ? t.src : null);
    if (DRY_RUN) { process.stdout.write(url?'+':'n'); ins++; continue; }

    // 新規挿入 or 画像URLのみ更新
    if (ex) {
      // 既存レコードあり（image_url=null） → 更新
      const { error } = await supabase.from('therapists').update({ image_url: url }).eq('id', tid);
      if (error) { err++; process.stdout.write('!'); }
      else { process.stdout.write(url?'u':'n'); ins++; }
    } else {
      const { error } = await supabase.from('therapists').upsert(
        { id: tid, shop_id: JJ_SHOP_ID, name: t.name, image_url: url },
        { onConflict: 'id' }
      );
      if (error) { err++; process.stdout.write('!'); }
      else { process.stdout.write(url?'+':'n'); ins++; }
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入/更新:${ins} スキップ:${skp} エラー:${err}`);
}

async function fixRoomOne() {
  console.log('\n--- Room one 画像404修正 ---');
  for (const fix of ROOMONE_FIX) {
    const tid = `${fix.shop_id}_${fix.name}`;
    // 代替URLを試す
    let goodUrl = null;
    for (const alt of fix.alts) {
      if (DRY_RUN) {
        const res = await fetch(alt, { headers: { 'User-Agent': 'Mozilla/5.0' } }).catch(()=>null);
        if (res?.ok) { goodUrl = alt; break; }
      } else {
        const uploaded = await uploadImage(alt, fix.key, 'https://www.aroma-yuim.com');
        if (uploaded) { goodUrl = uploaded; break; }
      }
    }
    if (goodUrl) {
      if (!DRY_RUN) {
        await supabase.from('therapists').update({ image_url: goodUrl }).eq('id', tid);
      }
      console.log(`✅ ${fix.name}: ${goodUrl.substring(0,60)}...`);
    } else {
      console.log(`❌ ${fix.name}: 全URLが404（画像なしのまま）`);
    }
  }
}

async function main() {
  console.log(`=== JJ・Room one 修正 (DRY_RUN=${DRY_RUN}) ===\n`);
  const run = (n) => !shopArg || shopArg === n;
  if (run('jj')) await fixJJ();
  if (run('roomone')) await fixRoomOne();
  console.log('\n=== 完了 ===');
}
main().catch(console.error);
