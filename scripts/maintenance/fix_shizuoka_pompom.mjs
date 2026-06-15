/**
 * Fix: POMPOM blue — 68名に画像付与 + shop og:image修正
 * 実行: node scripts/maintenance/fix_shizuoka_pompom.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const SHOP_ID = 'shizuoka_shizuoka_pompom_blue';
const BASE_URL = 'https://shizuoka-esthe-pompom.com';

// 68 therapists with templates_c image URLs (collected from Chrome)
const THERAPISTS = [
  { name: 'ひまり', hash: '63eb4347bbd99fa5553d78d1812b190f' },
  { name: 'ゆな',   hash: 'f0a443f81fd35c5559c2575836a52e42' },
  { name: 'みあな', hash: '60414f5ac68d75de8bfe15b74f161668' },
  { name: 'なみ',   hash: 'd73c0a9389f020a0057e3b5a6daefbdc' },
  { name: 'えな',   hash: '9b6db35b9fbe5be7afec04079235f640' },
  { name: 'まお',   hash: '5d564713141bdd68ed615d4f23f21e04' },
  { name: 'かれん', hash: 'fc5133350f716849c3080225e7de31a2' },
  { name: 'りり',   hash: 'd7dd7711917546348227afa573587293' },
  { name: 'せいら', hash: '80cd1e83e8573f9b43f77b0c39a826d4' },
  { name: 'あゆ',   hash: '58cbcce995754edc4fcd39beed74e5d9' },
  { name: 'かのん', hash: '8cab3fee39cf36e59cf0ccc9a9b06433' },
  { name: 'みおな', hash: 'c09a3dc512fa59cb82e9991497f296b1' },
  { name: 'みずき', hash: '64dbb50b88513b3c12e416ca9778b14e' },
  { name: 'ふたば', hash: 'ca5073afef87d6039f862a2d007e4f02' },
  { name: 'みらい', hash: '4778d0dfce28d96284cafac9b5716ec5' },
  { name: 'はるひ', hash: 'e2c3a13910b03b8558b8a20ef095a9a9' },
  { name: 'ねね',   hash: 'd9ef533d6e2290bb9ecf0128e87afc9d' },
  { name: 'はな',   hash: '19f939f1e7b2b7adba9bcc9baf98b28f' },
  { name: 'りこ',   hash: '8e9fef3ae7bd147ef310d296f3df4bff' },
  { name: 'めいな', hash: '0ff759423c4bbb84f7092a04aeb8d8ea' },
  { name: 'こころ', hash: 'c629d87f9612410fec9d6f218bf03f90' },
  { name: 'りりあ', hash: '3505527995f6883f0a4ca416f1e6d49b' },
  { name: 'ゆら',   hash: 'd52cc27b28e58b85804eb1ce518ae20e' },
  { name: 'きい',   hash: 'f98405566e8438569d79d832daa38404' },
  { name: 'いぶき', hash: '38dc505c90bf785bb96bd368ab3744c1' },
  { name: 'かぜ',   hash: '4d762cd94ee67504b614de59ef11ce05' },
  { name: 'もにか', hash: 'b87a7c64c028e6e8b410d36fe192fef3' },
  { name: 'あかね', hash: '7a13a7ed411096ab115c78888b290662' },
  { name: 'あかり', hash: '35443d4a1b08b786684fcbaf758d4702' },
  { name: 'あむ',   hash: '35046aea9dcf125fea33c8b34797ae48' },
  { name: 'あめ',   hash: '965f6e22ace57680484ed4d3d3e66a99' },
  { name: 'おと',   hash: 'fa42fd90a010fef2304ecc08c205f179' },
  { name: 'かすみ', hash: 'f1d48224ad61cac046fddfcaa859a9f2' },
  { name: 'かな',   hash: '26c4fe59600a138912a2823e1c01a8ce' },
  { name: 'かりん', hash: 'eb1e591e4481123e9d97047536d1f78f' },
  { name: 'ここ',   hash: '582f7f91fa55008a85bb597f609dd26e' },
  { name: 'さら',   hash: 'e2b5277210b74cd2f06720c846df2fec' },
  { name: 'じゅり', hash: '9dd081545fe1a052a16b5df0f396ad42' },
  { name: 'せいか', hash: '00a2cd3e1d620ec5a0ec096a9ccde450' },
  { name: 'せな',   hash: 'c8ffd1f7606a25ecf424f5f5959cfe3a' },
  { name: 'たまき', hash: '868a724c1b5cbfad1f518203c13ae6ff' },
  { name: 'なぎさ', hash: 'bddfd52b00e4c3e46f9fc9dd7859476e' },
  { name: 'ななみ', hash: '75b88900be0d793691d81fc0810c0626' },
  { name: 'にゃん', hash: '53cb29ee49ed10473b9664c92bc8b444' },
  { name: 'のあ',   hash: '9950fb35e091753e24bf04cb69a04ca8' },
  { name: 'はる',   hash: 'b583d0d363862a7a4ceb65e7848c463e' },
  { name: 'ひより', hash: '1a38fdf4969eaf05687d49d9f7269ed2' },
  { name: 'まりん', hash: 'bbbedde65091b1b4e2f3eb97b46c8e36' },
  { name: 'みさき', hash: '522c9bb940b5de64844a440c2fa7fb2e' },
  { name: 'みゆ',   hash: '55001f5f8e75023ac91b0f2870f67e0c' },
  { name: 'もこ',   hash: '774fe00f0ca4052bb396129869722e49' },
  { name: 'ゆあ',   hash: '703ee5137aa4efa39972aad8433c80d7' },
  { name: 'ゆい',   hash: 'e91a23ede108fbe853246b2fa15ad994' },
  { name: 'ゆうか', hash: '09e237114980adc3eea8e75fefb2bfe7' },
  { name: 'らいか', hash: '884178a5410d8c4f26f123e789f6ef2a' },
  { name: 'らむ',   hash: 'dedbd9cd0d78019f2567ea46b0713983' },
  { name: 'らん',   hash: '2ef47e0c43d54f933d3df90d8a7bd8b0' },
  { name: 'りあ',   hash: 'f1f6feb05abfba5fa172944de9cb80e8' },
  { name: 'りか',   hash: '3c32ee1d05cfa76dd98c26c0da28be7a' },
  { name: 'りな',   hash: '342d1663f467a7dc998bb94d3210a395' },
  { name: 'るな',   hash: '453c5d811474dd543716510259ed27aa' },
  { name: 'れあ',   hash: 'f3583890125ea5e0458a24cd6dcbda0b' },
  { name: 'れいな', hash: '10be17adde60fd0de6e55c566915e60c' },
  { name: 'ゆり',   hash: '461b4afebb7c698fdcbc8d87e2bae211' },
  { name: 'あや',   hash: 'ede2e1f544644657cedab231da23c132' },
  { name: 'さえ',   hash: '5daffdb449a6f2fe5660502125c6c58a' },
  { name: 'れいか', hash: 'bf0911b8dfc60a058fb059b643778200' },
  { name: 'ねる',   hash: '5d5e13f0e01fcb089dae0e965dbce0a8' },
];

async function uploadImage(url, fileKey) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': BASE_URL + '/therapist.html',
      }
    });
    if (!res.ok) {
      console.log(`  ⚠️ fetch ${res.status}: ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const path = `${fileKey}.jpg`;
    const { error } = await supabase.storage
      .from('therapist-images')
      .upload(path, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`  ⚠️ storage: ${error.message}`); return null; }
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(path);
    return publicUrl;
  } catch (e) {
    console.log(`  ⚠️ error: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log(`💙 POMPOM blue 画像付与 + shop og:image修正 (${isDryRun ? 'DRY RUN' : '本実行'})`);

  // Fix shop og:image (relative URL → absolute)
  console.log('\n📸 Shop og:image修正...');
  const correctOgImage = `${BASE_URL}/favicon/apple-touch-icon.png`;
  if (!isDryRun) {
    const { error } = await supabase
      .from('shops')
      .update({ image_url: correctOgImage })
      .eq('id', SHOP_ID);
    if (error) console.log(`  ⚠️ shop更新エラー: ${error.message}`);
    else console.log(`  ✅ shop.image_url → ${correctOgImage}`);
  } else {
    console.log(`  [DRY] shop.image_url → ${correctOgImage}`);
  }

  // Get existing therapists
  const { data: existing } = await supabase
    .from('therapists')
    .select('id, name, image_url')
    .eq('shop_id', SHOP_ID);
  const existingMap = new Map((existing || []).map(t => [t.name, t]));
  console.log(`\n既存: ${existingMap.size}名`);

  let updated = 0, skipped = 0, errors = 0;

  for (const t of THERAPISTS) {
    const imgUrl = `${BASE_URL}/templates_c/${t.hash}.jpg`;
    const fileKey = `pompom_${t.hash.slice(0, 16)}`;
    const ex = existingMap.get(t.name);

    if (!ex) {
      console.log(`  ? ${t.name} (DB未登録 - スキップ)`);
      continue;
    }

    if (ex.image_url) {
      console.log(`  = ${t.name} (既存画像あり スキップ)`);
      skipped++;
      continue;
    }

    console.log(`  u ${t.name}`);
    if (isDryRun) continue;

    const storageUrl = await uploadImage(imgUrl, fileKey);
    if (!storageUrl) { errors++; continue; }

    const { error } = await supabase
      .from('therapists')
      .update({ image_url: storageUrl })
      .eq('id', ex.id);
    if (error) { console.log(`    DBエラー: ${error.message}`); errors++; }
    else { console.log(`    ✅`); updated++; }
  }

  console.log(`\n✅ 完了: 更新u${updated} スキップ=${skipped} エラー=${errors}`);
}

main().catch(console.error);
