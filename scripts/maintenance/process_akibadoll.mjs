/**
 * 必殺あきば娘 (秋葉原) 登録スクリプト — 81名
 * パターン: /photos/{lid}/raw_{lid}.{ext}（LEON SPAと同一CMS）
 *
 * 実行:
 *   node scripts/maintenance/process_akibadoll.mjs --dry-run
 *   node scripts/maintenance/process_akibadoll.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://hissatsuakbdoll.com';

const SHOP = {
  id: 'tokyo_chiyoda_akihabara_akibadoll',
  name: '必殺あきば娘',
  website_url: 'https://hissatsuakbdoll.com/',
  schedule_url: 'https://hissatsuakbdoll.com/schedule',
  image_url: 'https://hissatsuakbdoll.com/theme/mblme2bkgold02/images/mainv.jpg',
  raw_data: { prefecture: '東京都', area: '秋葉原' },
};

// Chrome経由で取得（2026-06-06）
// null = now-printing（写真なし）
const RAW = [
  ['水乃れみ',   'https://hissatsuakbdoll.com/photos/350/raw_350.jpg'],
  ['瀬戸いろは', null],
  ['伊久美らな', 'https://hissatsuakbdoll.com/photos/349/raw_349.jpg'],
  ['鈴野ひかる', 'https://hissatsuakbdoll.com/photos/347/raw_347.png'],
  ['一条ことは', 'https://hissatsuakbdoll.com/photos/348/raw_348.jpg'],
  ['海野まりん', 'https://hissatsuakbdoll.com/photos/345/raw_345.jpg'],
  ['蒼井あすな', 'https://hissatsuakbdoll.com/photos/346/raw_346.jpg'],
  ['夢乃ゆか',   'https://hissatsuakbdoll.com/photos/344/raw_344.jpg'],
  ['灰原らん',   'https://hissatsuakbdoll.com/photos/343/raw_343.jpg'],
  ['真紀ほまれ', 'https://hissatsuakbdoll.com/photos/342/raw_342.png'],
  ['宇野せゆ',   'https://hissatsuakbdoll.com/photos/339/raw_339.jpg'],
  ['咲野るか',   'https://hissatsuakbdoll.com/photos/341/raw_341.png'],
  ['雨宮あられ', 'https://hissatsuakbdoll.com/photos/335/raw_335.jpg'],
  ['綾瀬るな',   'https://hissatsuakbdoll.com/photos/337/raw_337.jpg'],
  ['みゆ',       'https://hissatsuakbdoll.com/photos/336/raw_336.jpg'],
  ['千鶴ひより', 'https://hissatsuakbdoll.com/photos/334/raw_334.jpg'],
  ['藍川ゆな',   'https://hissatsuakbdoll.com/photos/333/raw_333.jpg'],
  ['白河れに',   'https://hissatsuakbdoll.com/photos/330/raw_330.jpg'],
  ['あおい',     'https://hissatsuakbdoll.com/photos/331/raw_331.jpeg'],
  ['冴木あんな', 'https://hissatsuakbdoll.com/photos/329/raw_329.jpeg'],
  ['雪乃りこ',   'https://hissatsuakbdoll.com/photos/303/raw_303.jpg'],
  ['川口なこ',   'https://hissatsuakbdoll.com/photos/76/raw_76.jpg'],
  ['涼宮せな',   'https://hissatsuakbdoll.com/photos/230/raw_230.jpg'],
  ['小鳥遊にこ', 'https://hissatsuakbdoll.com/photos/319/raw_319.jpg'],
  ['天馬みあ',   'https://hissatsuakbdoll.com/photos/155/raw_155.jpg'],
  ['初音ことみ', 'https://hissatsuakbdoll.com/photos/265/raw_265.jpg'],
  ['音峯ゆい',   'https://hissatsuakbdoll.com/photos/244/raw_244.jpg'],
  ['天使この',   'https://hissatsuakbdoll.com/photos/322/raw_322.jpg'],
  ['美月れいな', 'https://hissatsuakbdoll.com/photos/299/raw_299.jpg'],
  ['陽向こはる', 'https://hissatsuakbdoll.com/photos/308/raw_308.jpg'],
  ['雪月さな',   'https://hissatsuakbdoll.com/photos/314/raw_314.jpg'],
  ['優美りお',   'https://hissatsuakbdoll.com/photos/338/raw_338.jpg'],
  ['紫苑',       'https://hissatsuakbdoll.com/photos/324/raw_324.jpg'],
  ['橘あまね',   'https://hissatsuakbdoll.com/photos/327/raw_327.jpeg'],
  ['小倉みなみ', 'https://hissatsuakbdoll.com/photos/200/raw_200.jpg'],
  ['葉月みやび', 'https://hissatsuakbdoll.com/photos/241/raw_241.jpg'],
  ['桃乃木はに', 'https://hissatsuakbdoll.com/photos/198/raw_198.jpg'],
  ['室井ひめか', 'https://hissatsuakbdoll.com/photos/34/raw_34.jpg'],
  ['新里おと',   'https://hissatsuakbdoll.com/photos/305/raw_305.jpg'],
  ['参道あやな', 'https://hissatsuakbdoll.com/photos/147/raw_147.jpg'],
  ['天乃ちさ',   'https://hissatsuakbdoll.com/photos/146/raw_146.jpg'],
  ['宇都宮カナ', 'https://hissatsuakbdoll.com/photos/85/raw_85.jpg'],
  ['霧島のあ',   'https://hissatsuakbdoll.com/photos/307/raw_307.jpg'],
  ['南條ねね',   'https://hissatsuakbdoll.com/photos/300/raw_300.jpg'],
  ['九条みれい', 'https://hissatsuakbdoll.com/photos/313/raw_313.jpg'],
  ['青空のの',   'https://hissatsuakbdoll.com/photos/306/raw_306.jpg'],
  ['夢咲りさ',   'https://hissatsuakbdoll.com/photos/304/raw_304.jpeg'],
  ['水嶋える',   'https://hissatsuakbdoll.com/photos/209/raw_209.jpg'],
  ['白石まふゆ', 'https://hissatsuakbdoll.com/photos/286/raw_286.jpeg'],
  ['白雪ふうか', 'https://hissatsuakbdoll.com/photos/287/raw_287.jpg'],
  ['花園ひめこ', 'https://hissatsuakbdoll.com/photos/297/raw_297.jpeg'],
  ['神楽紗和',   'https://hissatsuakbdoll.com/photos/220/raw_220.jpg'],
  ['芹沢みな',   'https://hissatsuakbdoll.com/photos/315/raw_315.jpg'],
  ['藤咲りりあ', 'https://hissatsuakbdoll.com/photos/318/raw_318.jpg'],
  ['深月ことり', 'https://hissatsuakbdoll.com/photos/326/raw_326.jpeg'],
  ['蓮見りり',   'https://hissatsuakbdoll.com/photos/321/raw_321.jpeg'],
  ['白咲ゆいな', 'https://hissatsuakbdoll.com/photos/316/raw_316.jpg'],
  ['咲摩もも',   'https://hissatsuakbdoll.com/photos/312/raw_312.jpg'],
  ['千歳かすみ', 'https://hissatsuakbdoll.com/photos/309/raw_309.jpg'],
  ['羽宮りん',   'https://hissatsuakbdoll.com/photos/320/raw_320.jpg'],
  ['撫子かれん', 'https://hissatsuakbdoll.com/photos/270/raw_270.jpg'],
  ['赤羽すず',   'https://hissatsuakbdoll.com/photos/73/raw_73.jpg'],
  ['水瀬みるね', 'https://hissatsuakbdoll.com/photos/273/raw_273.jpg'],
  ['倉敷みさと', 'https://hissatsuakbdoll.com/photos/174/raw_174.jpg'],
  ['ななせ',     'https://hissatsuakbdoll.com/photos/171/raw_171.jpg'],
  ['亜来葉くるみ','https://hissatsuakbdoll.com/photos/45/raw_45.jpg'],
  ['中川るき',   'https://hissatsuakbdoll.com/photos/128/raw_128.jpg'],
  ['那覇える',   'https://hissatsuakbdoll.com/photos/127/raw_127.jpeg'],
  ['八戸みか',   'https://hissatsuakbdoll.com/photos/114/raw_114.jpg'],
  ['えいみ',     'https://hissatsuakbdoll.com/photos/93/raw_93.jpg'],
  ['町田かおり', 'https://hissatsuakbdoll.com/photos/53/raw_53.jpg'],
  ['鳴海さくら', 'https://hissatsuakbdoll.com/photos/226/raw_226.jpg'],
  ['春川　音羽', 'https://hissatsuakbdoll.com/photos/151/raw_151.jpg'],
  ['梶せりな',   'https://hissatsuakbdoll.com/photos/215/raw_215.jpg'],
  ['船橋もか',   'https://hissatsuakbdoll.com/photos/50/raw_50.jpg'],
  ['石原なゆ',   'https://hissatsuakbdoll.com/photos/223/raw_223.jpg'],
  ['島本みゆき', 'https://hissatsuakbdoll.com/photos/144/raw_144.jpg'],
  ['日向かなえ', 'https://hissatsuakbdoll.com/photos/122/raw_122.jpg'],
  ['高田もえ',   'https://hissatsuakbdoll.com/photos/88/raw_88.jpg'],
  ['ひなの',     'https://hissatsuakbdoll.com/photos/94/raw_94.jpg'],
  ['星宮めう',   'https://hissatsuakbdoll.com/photos/257/raw_257.jpg'],
];

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, {
      headers: {
        'Referer': BASE + '/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const storageKey = `${key}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(storageKey);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function main() {
  console.log(`=== 必殺あきば娘 登録 (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${RAW.length}名\n`);

  if (DRY_RUN) {
    console.log(`[DRY] Shop: ${SHOP.name}`);
    RAW.forEach(([n, s]) => process.stdout.write(s ? '+' : 'n'));
    console.log(`\n写真あり: ${RAW.filter(([,s])=>s).length} / null: ${RAW.filter(([,s])=>!s).length}`);
    return;
  }

  const { error: shopErr } = await supabase.from('shops').upsert(SHOP, { onConflict: 'id' });
  if (shopErr) console.error('Shop error:', shopErr.message);
  else console.log(`✅ ${SHOP.id}`);

  let ins = 0, skp = 0, err = 0;
  for (const [name, imgUrl] of RAW) {
    const normName = name.replace(/\s+/g, ' ').trim();
    const tid = `${SHOP.id}_${normName}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    let url = null;
    if (imgUrl) {
      const lid = imgUrl.match(/\/photos\/(\d+)\//)?.[1] || '';
      const key = `akibadoll_${lid}`;
      url = await uploadImage(imgUrl, key);
    }

    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: SHOP.id, name: normName, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { console.error(`\n✗ ${normName}: ${error.message}`); err++; }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n\n=== 完了 ===`);
  console.log(`挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}
main().catch(console.error);
