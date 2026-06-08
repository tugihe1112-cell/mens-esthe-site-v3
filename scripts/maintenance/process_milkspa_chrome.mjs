/**
 * みるくSPAα セラピスト登録（Chrome DOM取得データ）
 * 55名 / /images/cast/{shopHash}/{imageHash}.{ext} パターン
 * 実行: node scripts/maintenance/process_milkspa_chrome.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://milkspa-a.com';
const SHOP_HASH = 'c205219a05b3adb840793c8b27b12ab3729d1d25';

// profileHash → name, imageHash, ext (null imgHash = noimage → image_url: null)
const THERAPISTS = [
  { ph: 'b04281854390d919ef38ca17ba726ae75daf14b3', name: 'さおり',   ih: '7a5cd68535143802cfb64e496499aa0c8dfa7c18', ext: 'jpeg' },
  { ph: 'e3ab9466d21b95774d5a446bc16658e8381548a4', name: 'のぞみ',   ih: 'a7a47c58b1a63e54460ab1a43eb8c2a877e17e42', ext: 'png'  },
  { ph: 'fc006a04bf25e937abf84ad9c177b0746bc7e7f1', name: 'おと',     ih: '5b16bb9cf707421c2aa6297d8afe208ffc40227a', ext: 'jpeg' },
  { ph: '4ea3693212c31339288f199a6000833a9871d93c', name: 'りりな',   ih: '08d57129ae9419f30a35cfe7825c169dacd65429', ext: 'jpeg' },
  { ph: '727219b5ccffb99ef9f3ff4ae40a64704570ee05', name: 'ゆい',     ih: 'f4c0280c03a117fcbf804a98d156f0c4b6d69003', ext: 'jpeg' },
  { ph: '50c3867b68ca7536dc3cf9f1825342215a1ac298', name: 'つき',     ih: 'a7a82310c1f49a810bd54b28e25903735ee53a37', ext: 'jpeg' },
  { ph: '45b5854e643de40627a2b211e31151316593e499', name: 'ひかり',   ih: '937776424defce880440656d9cdabac50c399fe6', ext: 'jpeg' },
  { ph: '0fe1591b4579e6938a3a34f8736b25cceca0dba6', name: 'りあん',   ih: '4237d9e24882230e9459d879a376ef95111e06f7', ext: 'jpeg' },
  { ph: 'c4d11d74a7a86583d07c9e3b1a87fb803971711f', name: 'みれい',   ih: '0f44448519f70dc7719a743e6d42a421e085891d', ext: 'png'  },
  { ph: 'f750359d4f4ae82d07410f8cf750a2622fd7dab2', name: 'きあら',   ih: null, ext: null },  // noimage
  { ph: 'a5f7fc7dbb021589243316a99069f5bfee40beca', name: 'せな',     ih: '77b35267651b546d719308b83ae10eb5bee5a4f3', ext: 'jpeg' },
  { ph: 'ad8b94713a76fc7383bf3c7c56dfee4d787feee8', name: 'みき',     ih: 'e13cee098a7dd478bfb9dfeac218f481f794e7a0', ext: 'png'  },
  { ph: '05be0f8400de738bc682604f9cacf39c68fa9ef2', name: 'みやび',   ih: '138d199dda714e7acc12549efd528ddc10902b7c', ext: 'jpeg' },
  { ph: 'a7222505947f53053c6e57ba56f87afed5f17588', name: 'きずな',   ih: null, ext: null },  // noimage
  { ph: '472663aed95d2b81451fb105a83f27267ff2cda1', name: 'はるき',   ih: 'a727a9bdd73d855d1f2babe969d5cb5c16e4bf82', ext: 'jpeg' },
  { ph: '25d9f075edbbaebb914c218b6dec166badc0eb39', name: 'じゅん',   ih: 'e49b7b38b1ac70e06c7edce0568468cce5bb2bad', ext: 'png'  },
  { ph: '7943b3ba8081aa4aa7f322f16e4b655c96d317f9', name: 'なつみ',   ih: '2acb7265da938f71ccc73a4c6291e381f45ce96c', ext: 'jpeg' },
  { ph: '286c3e1cb792b8043ce4505acaf5d8b92fe92332', name: 'れみ',     ih: '0126d8d3e2b0b75e489304204d03615abc476a3b', ext: 'jpeg' },
  { ph: 'f376d1296f3be85a03165f9d097dcb3c86d0d08a', name: 'るみな',   ih: 'e55dcb9d7e94e6992abc3d1d7b4959a03e80468a', ext: 'jpeg' },
  { ph: '8806df0f16c8c7bacdac1012db3ec5ff0ee674de', name: 'いちの',   ih: 'd42f872f9c17e9a5405c712d1c30697027851efd', ext: 'jpeg' },
  { ph: 'c9d14d3cbfda06999186011ef024501e5e921b26', name: 'ぼたん',   ih: 'eb56f97bbc209de74ef5ffebcf6b9722a09ebdfb', ext: 'jpeg' },
  { ph: 'c3cc9c1491f17bb30e419e2760e43d180e241c06', name: 'みなみ',   ih: '27393aff271f343b9e69d22d32f38606615bc6c4', ext: 'png'  },
  { ph: 'da95839d9a3eeea373cc7b9536f8b20c5d698a3a', name: 'くりーむ', ih: '6fd96f858943fa8128d6ee56c2e1450449172a17', ext: 'jpeg' },
  { ph: '230ea8d1eeb09d67ecda6346d6fa1d2265d383c1', name: 'ゆうな',   ih: '9ca18e62d92ee842f81a271111bfa809cb8fd6a3', ext: 'jpg'  },
  { ph: '99b1bb129074817f3c0bd33b57e39243c3cb4706', name: 'ゆか',     ih: '3f29ab99587075f924a6fd66d667b9465f224fc8', ext: 'jpeg' },
  { ph: 'c074deb86d2bf83eaabab7bc557ca601333e113a', name: 'なこ',     ih: 'defda6525ee27b94543742893693e2d1c6699613', ext: 'jpeg' },
  { ph: '15adf9c2b9cad26baaa693a4e68d79bb56f8ea33', name: 'なみ',     ih: 'c0e1ee1b1153bc784107e60582bc5ee73c31ae9d', ext: 'jpeg' },
  { ph: '70b49a3537db4b98943ffe46acb7c08a041e38bd', name: 'らら',     ih: '7d848983e2b95aee2f8fc979892666e2401a9277', ext: 'jpeg' },
  { ph: '47ec96ad64c247efcc75d5a56a94e9349a6428b9', name: 'サキ',     ih: '960cc1f27d549fe48a2749bbbad7066c139a91e7', ext: 'jpeg' },
  { ph: 'c828d5b0a0a58e8b4eee97b3be25f27f76ca48d8', name: 'ここみ',   ih: '37b0a145ea5dbbecdab15f6f5c9692a6554d3a37', ext: 'jpeg' },
  { ph: '730b4a944cbfa34f42acfcfda539a3aac951464d', name: 'なな',     ih: '611af2e8302116fb73e28b3a9b83089015f1493e', ext: 'jpeg' },
  { ph: '7b52d7a4fcbdd77ea0b14dddd9396324ef26c033', name: 'ちい',     ih: '00758e0453f49acabe863bee91b519e1dd0af2e6', ext: 'jpg'  },
  { ph: '46022fafaaaa1ae853bf528acba6c202d6693b7a', name: 'なつな',   ih: 'f860c381563369b3e8732c0930fd8c88ababcca6', ext: 'jpeg' },
  { ph: 'b598b8fc3150106dd33723afe366ccb22c824341', name: 'かんな',   ih: '0ef222e8695270bbb58ae0bf9348ac02ca0c5b0b', ext: 'png'  },
  { ph: '23ad124eee282936e395839fb7f16a5256465e49', name: 'みゆ',     ih: 'a36c2e082457f518bc2c044920d50c142bbcc647', ext: 'jpg'  },
  { ph: '0643cf33a8c62b203684dfa33963314e298d753f', name: 'りん',     ih: '7b91dfa82a8091813320d44bed6f818f0252d83c', ext: 'png'  },
  { ph: '6cf8611b3d820157b820b67ce6ffa30f29c3fd5b', name: 'えま',     ih: '0d8ee677bdb709d84b915a0f6189f7420b96ce82', ext: 'png'  },
  { ph: '0dd86dd5ddc28dc0f88beaa4a551aa0127c5e914', name: 'ゆり',     ih: '5da962973ff9e90c9fc0eefcb8235996920abdd8', ext: 'jpeg' },
  { ph: '52ad7ca358b0705821f79469d3aaecd48fac677f', name: 'ゆうひ',   ih: '1c24c4442733dfda5226191a42cebb264d2f2832', ext: 'png'  },
  { ph: '56bda13b31d322a5f902be23547607242ffd59b5', name: 'あり',     ih: 'c47260f1ae3c44b3f1506c998f14f9e7494763b4', ext: 'jpg'  },
  { ph: 'dc8584a1453ba0e4ffe10c82efdc1b0d24bfabae', name: 'すみな',   ih: '7d04ee008dfac165a3e8e25c2522361eaebfe059', ext: 'jpeg' },
  { ph: 'ccf4e8b3978247bae5c681963da1387f9afc9cbf', name: 'はる',     ih: 'd1be7f874c403cca74affdd807723f790f419295', ext: 'jpeg' },
  { ph: '9cc84dd00e0f895b7d02515622fd219a4ed37ed9', name: 'りお',     ih: '3595190fe6d89ee476074af9d11165cc3428a2c0', ext: 'jpg'  },
  { ph: '82e89e10a34018ae7da6a5fc1d455ad80cacf961', name: 'けい',     ih: '994a6863c047fa760cc852aeb168a8f714c096be', ext: 'jpeg' },  // ♪除去
  { ph: '0a0eae742c633c6abfcba16ed3c28c645f59c522', name: 'りず',     ih: '4ee56ed11062414a266b72420eb50ba9effaa699', ext: 'jpeg' },
  { ph: '416b603fdbbe9691498f5ca70803a059af7dc205', name: 'ひまり',   ih: '8dba0f5879b5116ed2d642479be549a774347d1f', ext: 'jpg'  },
  { ph: 'bac39c5921968b1e9b61818b823c531d9041f6f3', name: 'れむ',     ih: 'e7f6feae6d8362491963e5a64a95e05971288516', ext: 'jpeg' },
  { ph: '54648a0d0557484022f72730f05b69250cf3c3f0', name: 'もか',     ih: '05acf5d17cfd65eadb42ea2dd0c9865bc49bb239', ext: 'jpeg' },
  { ph: 'a4c97f5a2ed659403e65c308deca5a544c4c61e2', name: 'すみれ',   ih: 'bcb893541399aba15a685e9b94d91d681ebf5345', ext: 'jpg'  },  // ♪除去
  { ph: '3f292ec538448f636533c22bab9a8bbd9b366d37', name: 'そらん',   ih: 'a114e133dae4eb7daf0209c8446b8a500ddb05b5', ext: 'jpeg' },
  { ph: 'c82431fe50bc9410db4854a749fb2bbb148e7e76', name: 'まき',     ih: 'c8bc10cfb2077c6968f47f0534d8e26a128eb6c0', ext: 'jpeg' },
  { ph: '5142ed50388d07b8a35bf2eddc6a3d82b7c491d6', name: 'るか',     ih: 'b0893eae1c34747bec14efdf711d4c91967d3b58', ext: 'jpg'  },  // ♪除去
  { ph: '4ac2c1673d7a93991e6ce0888daef0b544f7a379', name: 'ゆめ',     ih: 'ba3ebb6d7cd67aa5486b39b3092ff198e1fe795b', ext: 'jpg'  },
  { ph: 'f209eee2ca57b7d67ed41cb9da95708a5d1761cc', name: 'ななせ',   ih: '637fd6e17216ce51a5658ab6cf3e294cba64d86e', ext: 'png'  },
  { ph: 'c01a3e16ce243aed900d3f9dbf7f781d957db484', name: 'みちる',   ih: '931d924bb007b9d117a1501b314e117110b63732', ext: 'jpg'  },
];

async function uploadImage(ih, ext, ph) {
  const imgUrl = `${BASE}/images/cast/${SHOP_HASH}/${ih}.${ext}`;
  const storageKey = `milkspa_${ih}.${ext}`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': `${BASE}/` },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) { console.log(`  ✗ 画像取得失敗 ph=${ph.slice(0,8)} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: ct, upsert: true
    });
    if (error) { console.log(`  ✗ Storage失敗 ph=${ph.slice(0,8)}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) {
    console.log(`  ✗ エラー ph=${ph.slice(0,8)}: ${e.message}`);
    return null;
  }
}

// shop_id を DB から取得（milkspa-a.com または milk-spa.com）
const { data: shops } = await supabase.from('shops').select('id,name,website_url')
  .or('website_url.ilike.%milkspa-a.com%,website_url.ilike.%milk-spa.com%');
if (!shops?.length) { console.error('みるくSPA shop not found in DB'); process.exit(1); }
const shopId = shops[0].id;
console.log(`shop_id: ${shopId}`);
console.log(`shop_name: ${shops[0].name}`);
console.log(`website_url: ${shops[0].website_url}`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) {
  console.log('既登録あり。--force で再実行');
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  if (DRY_RUN) {
    const imgUrl = t.ih ? `${BASE}/images/cast/${SHOP_HASH}/${t.ih}.${t.ext}` : '(noimage)';
    console.log(`  [dry] ${t.name} ${imgUrl}`);
    continue;
  }
  const imageUrl = t.ih ? await uploadImage(t.ih, t.ext, t.ph) : null;
  const { error } = await supabase.from('therapists').insert({
    id: `${shopId}_${t.name}`, shop_id: shopId, name: t.name, image_url: imageUrl
  });
  if (!error) { added++; process.stdout.write(imageUrl ? '.' : 'n'); }
  else { failed++; console.log(`\n  ! insert失敗 ${t.name}: ${error.message}`); }
  await new Promise(r => setTimeout(r, 300));
}
if (!DRY_RUN) {
  process.stdout.write('\n');
  console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`);
} else {
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
}
