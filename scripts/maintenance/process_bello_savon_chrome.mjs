/**
 * BELLO SAVON セラピスト登録（Chrome DOM取得データ）
 * 32名 / THE PREMIUM SPA CMS (data/staff/{sid}/stf_{hash}.webp)
 * 実行: node scripts/maintenance/process_bello_savon_chrome.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://bellosavon.com';
const REFERER = 'https://bellosavon.com/';

// sid → { name, hash }
const THERAPISTS = [
  { sid: 124, name: '透花-とうか-',   hash: 'stf_6a19564063dd6' },
  { sid: 123, name: '琳果-りんか-',   hash: 'stf_6a16439b62a64' },
  { sid:  72, name: '莉子-りこ-',     hash: 'stf_6a09c71a8465f' },
  { sid: 120, name: '璃來-りな-',     hash: 'stf_69edd184d6e7d' },
  { sid: 121, name: '彩乃-あやの-',   hash: 'stf_69e466a7a5820' },
  { sid: 119, name: '凪乃-なぎの-',   hash: 'stf_69d05a101821b' },
  { sid: 118, name: '瑠美-るみ-',     hash: 'stf_69cc61990847f' },
  { sid: 115, name: '藍-あい-',       hash: 'stf_69c7bc9e01005' },
  { sid: 112, name: '美琴-みこと-',   hash: 'stf_698ec66f7391d' },
  { sid: 111, name: '里美-さとみ-',   hash: 'stf_69e1399455c38' },
  { sid: 108, name: '梓乃-しの-',     hash: 'stf_696851a649133' },
  { sid: 105, name: '友里-ゆうり-',   hash: 'stf_69f43208c030c' },
  { sid: 103, name: '詩歌-うた-',     hash: 'stf_68eb6efb689dc' },
  { sid: 102, name: '瀬奈-せな-',     hash: 'stf_68e62ad633f8d' },
  { sid: 101, name: '水妃-みずき-',   hash: 'stf_68f873a7b8d6f' },
  { sid:  99, name: '春麗-はる-',     hash: 'stf_68c285e36eee7' },
  { sid:  93, name: '柚葉-ゆずは-',   hash: 'stf_685e9ceb746de' },
  { sid:  21, name: '癒月-ゆづき-',   hash: 'stf_686e85ad20934' },
  { sid:  88, name: '凛-りん-',       hash: 'stf_67f53bef1e98d' },
  { sid: 110, name: '朱凛-あかり-',   hash: 'stf_699f9ee16e2ae' },
  { sid:  87, name: '玲那-れな-',     hash: 'stf_69bf90cda6499' },
  { sid:  85, name: '紗良-さら-',     hash: 'stf_68bf151780e33' },
  { sid:  83, name: '晴菜-はるな-',   hash: 'stf_67a63c61a24db' },
  { sid:  80, name: '美波-みなみ-',   hash: 'stf_67a4d99ef2f3a' },
  { sid:  79, name: '心-こころ-',     hash: 'stf_678d0e0e63163' },
  { sid:  75, name: '杏-あん-',       hash: 'stf_674db5498aff8' },
  { sid:  56, name: '陽葵-ひまり-',   hash: 'stf_6697899ed3dd4' },
  { sid:  52, name: '純伶-すみれ-',   hash: 'stf_668a9a2a94c74' },
  { sid:  47, name: '瑛美里-えみり-', hash: 'stf_665fe3005a838' },
  { sid:  43, name: '紬-つむぎ-',     hash: 'stf_66db206cce2ab' },
  { sid:  45, name: '風花-ふうか-',   hash: 'stf_661d9151d7f9d' },
  { sid:  28, name: '京香-きょうか-', hash: 'stf_65872a7a4dae6' },
];

async function uploadImage(sid, hash) {
  const imgUrl = `${BASE}/data/staff/${sid}/${hash}.webp`;
  const storageKey = `bellosavon_sid${sid}.webp`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': REFERER },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) { console.log(`  ✗ 画像取得失敗 sid=${sid} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: 'image/webp', upsert: true
    });
    if (error) { console.log(`  ✗ Storage失敗 sid=${sid}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) {
    console.log(`  ✗ エラー sid=${sid}: ${e.message}`);
    return null;
  }
}

// shop_id を DB から取得
const { data: shops } = await supabase.from('shops').select('id,name').ilike('website_url', '%bellosavon.com%');
if (!shops?.length) {
  console.error('BELLO SAVON shop not found in DB');
  process.exit(1);
}
const shopId = shops[0].id;
console.log(`shop_id: ${shopId}`);
console.log(`shop_name: ${shops[0].name}`);

// 既存レコード確認
const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
console.log(`既存: ${count}件\n`);

if (count > 0 && !process.argv.includes('--force')) {
  console.log('既登録あり。--force で強制再実行');
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  if (DRY_RUN) {
    console.log(`  [dry] ${t.name} (sid=${t.sid}) ${BASE}/data/staff/${t.sid}/${t.hash}.webp`);
    continue;
  }

  const imageUrl = await uploadImage(t.sid, t.hash);
  const { error } = await supabase.from('therapists').insert({
    id: `${shopId}_${t.name}`,
    shop_id: shopId,
    name: t.name,
    image_url: imageUrl
  });
  if (!error) {
    added++;
    process.stdout.write(imageUrl ? '.' : 'n');
  } else {
    failed++;
    process.stdout.write('!');
  }
  await new Promise(r => setTimeout(r, 300));
}

if (!DRY_RUN) {
  process.stdout.write('\n');
  console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`);
} else {
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
}
