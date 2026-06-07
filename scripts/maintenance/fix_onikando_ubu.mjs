/**
 * Onikando (38名) + UBU彼女 (43名) 登録修正
 * 動的取得が失敗したためハードコード/caskan動的URL取得で対応
 *
 * 実行:
 *   node scripts/maintenance/fix_onikando_ubu.mjs --dry-run
 *   node scripts/maintenance/fix_onikando_ubu.mjs
 *   node scripts/maintenance/fix_onikando_ubu.mjs --shop onikando
 *   node scripts/maintenance/fix_onikando_ubu.mjs --shop ubu
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();
const run = (n) => !shopArg || shopArg === n;

// ===== Onikando: name→castId =====
const ONIKANDO_ID = 'tokyo_edogawa_kasai_onikando';
const ONIKANDO_CAST = [
  ['天音りん','9744855'],['さくら','9057869'],['ゆき','9605165'],['ゆり','9216759'],
  ['なお','8602440'],['みゆ','9849612'],['けい','3857838'],['ここな','7709984'],
  ['椿まい','9232745'],['にゃん','8265801'],['まどか','1898169'],['かんな','7032707'],
  ['ちなつ','6739510'],['国枝あずさ','5617196'],['つばき','5964792'],['りず','4677829'],
  ['さや','6270047'],['まこ','3846615'],['はるか','0724812'],['しずく','9796557'],
  ['のあ','7091980'],['ひまり','3027579'],['あみ','0019677'],['さき','1611334'],
  ['あいり','0539491'],['あやの','6774232'],['すず','3431188'],['ましろ','1475634'],
  ['叶ユカコ','2877515'],['なずな','0703416'],['さりな','9506920'],['りお','4586458'],
  ['ななせ','1648796'],['るい','6562569'],['えれな','9239466'],['ちか','3391366'],
  ['もも','6961967'],['ゆい','5328805'],
];

async function fetchOnikandoUrls() {
  // caskan CDNのタイムスタンプ付きURLを動的取得
  try {
    const res = await fetch('https://oni-kando.com/therapist', { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' } });
    const html = await res.text();
    const castMap = {};
    // alt="名前" src="https://cdn2-caskan.com/caskan/img/cast_tmb/{ts}_{castId}.jpg"
    const reg = /alt="([^"]+)"\s*src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.jpg)"/g;
    let m;
    while ((m = reg.exec(html)) !== null) castMap[m[3]] = m[2];
    // alt/srcの順序が逆の場合も試みる
    const reg2 = /src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.jpg)"\s*alt="([^"]+)"/g;
    while ((m = reg2.exec(html)) !== null) if (!castMap[m[2]]) castMap[m[2]] = m[1];
    console.log(`  caskan URL取得: ${Object.keys(castMap).length}件`);
    return castMap;
  } catch (e) {
    console.log('  URL取得失敗:', e.message);
    return {};
  }
}

// ===== UBU彼女: 名前のみ =====
const UBU_ID = 'chiba_urayasu_urayasu_ubukano';
const UBU_NAMES = [
  '長澤ひなの','綾波せいら','愛原みなみ','沢尻ふみか','恋渕ももな',
  '波多野まい','藤原ほのか','指原まりの','堀北りの','七瀬ひなの',
  '松浦あやの','小倉まあや','七沢ゆら','米倉あんり','藤崎もえか',
  '清原ゆうか','芹沢ゆな','倉持えみり','雛形あやめ','佐々木のぞみ',
  '鈴村れみ','渚あおい','芦田まりな','鮎川ひとみ','浅田みれい',
  '麻美まゆ','芹澤まりん','初音ゆりな','橋本まりん','白石ひめか',
  '三上りあ','安達ちひろ','雪乃あやね','海老原さくら','鮎川ななみ',
  '雪代ありす','姫咲ゆい','白石さとみ','長澤あさみ','沢口もえ',
  '里咲あやな','河北まゆか','椎名ゆきの',
].map(name => ({name, src: null, key: null}));

async function uploadImage(imgUrl, key, referer) {
  if (!imgUrl) return null;
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imgUrl, { headers });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = (!DRY_RUN && t.src && t.key)
      ? await uploadImage(t.src, t.key, referer)
      : (DRY_RUN && t.src ? '(ok)' : null);
    if (DRY_RUN) { process.stdout.write(url ? '+' : 'n'); ins++; continue; }
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { err++; process.stdout.write('x'); }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n  挿入:${ins} スキップ:${skp} エラー:${err}`);
}

async function main() {
  console.log(`=== Onikando + UBU彼女 修正 (DRY_RUN=${DRY_RUN}) ===\n`);

  if (run('onikando')) {
    console.log(`--- Onikando ${ONIKANDO_CAST.length}名 (caskan動的URL) ---`);
    const castMap = DRY_RUN ? {} : await fetchOnikandoUrls();
    const therapists = ONIKANDO_CAST.map(([name, castId]) => ({
      name,
      castId,
      src: castMap[castId] || null,
      key: `onikando_${castId}`,
    }));
    if (DRY_RUN) console.log(`  [DRY] ${therapists.length}名 (本実行時caskan URL取得)`);
    else await registerTherapists(ONIKANDO_ID, therapists, 'https://oni-kando.com');
    if (DRY_RUN) {therapists.forEach(()=>process.stdout.write('+')); console.log(`\n  挿入:${therapists.length} スキップ:0 エラー:0`);}
  }

  if (run('ubu')) {
    console.log(`\n--- UBU彼女 ${UBU_NAMES.length}名 (名前のみ) ---`);
    await registerTherapists(UBU_ID, UBU_NAMES, null);
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
