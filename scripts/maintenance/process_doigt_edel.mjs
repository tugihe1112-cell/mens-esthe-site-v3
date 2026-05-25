/**
 * doigt de fee（自由が丘・蒲田）＋ EDEL AZABU（麻布十番・田町）セラピスト登録
 * 実行: node scripts/maintenance/process_doigt_edel.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: referer },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

async function processShops({ label, shopIds, nameImagePairs, prefix, referer }) {
  console.log(`\n【${label}】 ${nameImagePairs.length}名 × ${shopIds.length}店舗`);
  for (const shopId of shopIds) {
    console.log(`\n=== ${shopId} ===`);
    if (DRY_RUN) {
      nameImagePairs.slice(0, 6).forEach(([n, u]) => console.log(`  ${n} → ${(u||'').slice(-50)}`));
      if (nameImagePairs.length > 6) console.log(`  ... 他${nameImagePairs.length - 6}名`);
      continue;
    }
    let inserted = 0, skipped = 0, failed = 0;
    for (const [name, imageUrl] of nameImagePairs) {
      const id = `${shopId}_${name}`;
      const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
      if (existing) { process.stdout.write('='); skipped++; continue; }

      const isNoImage = !imageUrl || imageUrl.includes('no_image') || imageUrl.includes('no-image');
      let storageUrl = null;
      if (!isNoImage) {
        const base = imageUrl.split('/').pop().split('?')[0];
        const stem = base.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 50);
        const ext = (base.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
        const safeExt = ext === 'jpeg' ? 'jpg' : ext;
        storageUrl = await uploadImage(imageUrl, `${prefix}_${stem}.${safeExt}`, referer);
        await sleep(80);
      }

      const { error } = await supabase.from('therapists').insert({
        id, shop_id: shopId, name, image_url: storageUrl ?? null,
      });
      if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
      else { process.stdout.write(storageUrl ? '+' : 'n'); inserted++; }
      await sleep(80);
    }
    console.log(`\n  挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
    await sleep(300);
  }
}

// ─── 1. doigt de fee ─────────────────────────────────────────────────────────
const FEE_DATA = [
  ['田口まな',     'https://imgsrv.jp/shop/97/lady/51fa79531dc292e318.jpg'],
  ['出雲るい',     'https://imgsrv.jp/shop/97/lady/be6420ce469cc25981.jpg'],
  ['一宮ななせ',   'https://imgsrv.jp/shop/97/lady/99928d756dd04eab12.jpg'],
  ['竹内あずさ',   'https://imgsrv.jp/shop/97/lady/4cd1325cc888e43559.jpg'],
  ['吉瀬ひろか',   'https://imgsrv.jp/shop/97/lady/6abc75cab9656d386d.jpg'],
  ['森川まなみ',   'https://imgsrv.jp/shop/97/lady/99eb679772789c5a56.jpg'],
  ['秋山りこ',     'https://imgsrv.jp/shop/97/lady/602a63e83b9878e86b.jpg'],
  ['淡雪うい',     'https://imgsrv.jp/shop/97/lady/0e4cb09a161f2c9e27.jpg'],
  ['平野れな',     'https://imgsrv.jp/shop/97/lady/204a3c203933ef48ef.jpg'],
  ['夏花あい',     'https://imgsrv.jp/shop/97/lady/76118189d26576d6db.jpg'],
  ['小野ちなつ',   'https://imgsrv.jp/shop/97/lady/9c066548703b938e3e.jpg'],
  ['桐嶋しほり',   'https://imgsrv.jp/shop/97/lady/0d6282b5209b7ffd11.jpg'],
  ['緒方みお',     'https://imgsrv.jp/shop/97/lady/4ba4ad3c30daa4ded3.jpg'],
  ['愛原れいな',   'https://imgsrv.jp/shop/97/lady/5ac47424c1f18a7507.jpg'],
  ['香月あん',     'https://imgsrv.jp/shop/97/lady/f178a7aa819502e099.jpg'],
  ['双葉めい',     'https://imgsrv.jp/shop/97/lady/8bfcc072d7a917523e.jpg'],
  ['夏目ゆり',     'https://imgsrv.jp/shop/97/lady/f3be8d489eb0ca8870.jpg'],
  ['水嶋ほたる',   'https://imgsrv.jp/shop/97/lady/bf44b100b2281ef04c.jpg'],
  ['成海すず',     'https://imgsrv.jp/shop/97/lady/d72c1d86b2b07cef77.jpg'],
  ['小倉まるこ',   'https://imgsrv.jp/shop/97/lady/3772dd6170ba5c114f.jpg'],
  ['巻島みさき',   'https://imgsrv.jp/shop/97/lady/fce20ec6a7c896a02b.jpg'],
  ['橋本みづき',   'https://imgsrv.jp/shop/97/lady/ab1291f1543578d7ad.jpg'],
  ['宮本じゅんな', 'https://imgsrv.jp/shop/97/lady/585873952f56b19433.jpg'],
  ['緋月みゆ',     'https://imgsrv.jp/shop/97/lady/a06f05963f56f84c11.jpg'],
  ['月島れい',     'https://imgsrv.jp/shop/97/lady/04905b53881c7b9b32.jpg'],
  ['望月めぐ',     'https://imgsrv.jp/shop/97/lady/40b80c0d422e256706.jpg'],
  ['小山あみか',   'https://imgsrv.jp/shop/97/lady/314250332e4b535728.jpg'],
  ['百瀬みく',     'https://imgsrv.jp/shop/97/lady/5809345266fbd1841c.jpg'],
  ['君島ゆい',     'https://imgsrv.jp/shop/97/lady/7c0b992134622ce012.jpg'],
  ['神楽こはる',   'https://imgsrv.jp/shop/97/lady/63910416dc8f5c14d3.jpg'],
  ['白雪りさ',     'https://imgsrv.jp/shop/97/lady/4406ec986a568358da.jpg'],
  ['美倉あこ',     'https://imgsrv.jp/shop/97/lady/d18e9aee8db94f0dad.png'],
];

await processShops({
  label: 'doigt de fee',
  shopIds: ['tokyo_meguro_jiyugaoka_doigt_de_fee', 'tokyo_ota_kamata_doigt_de_fee'],
  nameImagePairs: FEE_DATA,
  prefix: 'fee',
  referer: 'https://exe-fee.com/',
});

await sleep(1000);

// ─── 2. EDEL AZABU ───────────────────────────────────────────────────────────
const S3E = 'https://edel-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/';
const EDEL_DATA = [
  ['柊 りお',     S3E+'172/552f91ae-8234-4457-9252-d088bb84ab72.jpg'],
  ['沢尻 エリカ', S3E+'175/e76a6bb6-54cd-45dd-8c0a-fd1bf891bbba.jpg'],
  ['coco',       S3E+'132/a0027238-7f46-4f81-83f4-1dff5c9c386a.jpg'],
  ['日向',        S3E+'143/4635a980-891b-4c55-8e52-038d37d03260.jpg'],
  ['本條 凛',     S3E+'1/ab76dd7b-9b8d-4bd3-902b-71dd5d9d4bce.jpg'],
  ['まりか',      S3E+'79/01632b8f-fb6d-4906-87c6-6558229ce855.jpg'],
  ['りさこ',      S3E+'137/39e51cf1-94a6-44e2-b9e0-ebd121450a2e.jpg'],
  ['一色 桃花',   S3E+'170/4199e4fe-0496-49ba-93b6-b5616f77734b.jpg'],
  ['春田 なな',   S3E+'75/4f4da6d4-94a5-41a9-885d-3fc53b2b4f9f.jpg'],
  ['月子',        S3E+'176/4d74b16f-3e2b-409e-af83-302376d79579.jpg'],
  ['さな',        S3E+'178/482c23c5-02c4-4484-b5d8-d7c7ed699b54.jpg'],
  ['松井 あや',   S3E+'174/99297d02-3cf8-421b-bfaf-37513adb51b6.jpg'],
  ['きほ',        S3E+'161/952f12f7-eedb-490b-aed3-9a157357ab78.jpg'],
  ['なな',        S3E+'173/b3a5ef4d-4293-4453-b4f7-85a83a497a07.jpg'],
  ['みいな',      S3E+'159/aca43a21-d6ce-4e41-9038-3337b14a7575.jpg'],
  ['藤原 ゆうか', S3E+'171/5f696e57-39e2-4544-9850-ef4e39d498c2.jpg'],
  ['めい',        S3E+'109/68fde997-2f7a-484e-8f25-cd10817e27a7.jpg'],
  ['渚 るい',     S3E+'136/21c62b53-40d7-4e5d-9a7e-e99edd251f1d.jpg'],
  ['愛澤 ゆめ',   S3E+'102/3189387f-9d6f-4cce-b491-a8c4bf5592d6.jpg'],
  ['花蓮',        S3E+'146/7cc98b37-e0bb-4c23-979d-ea9202f47ad4.jpg'],
  ['立花 ゆな',   S3E+'141/fdaf8b03-91c9-4b3c-8265-ab33529eda17.jpg'],
  ['花園 めぐ',   S3E+'63/a124073d-e0b6-4feb-9a45-c963a560d43e.jpg'],
  ['もか',        S3E+'30/7e268904-e322-4c34-90da-8ba738ca9300.jpg'],
  ['灰原 奈緒子', null], // no_image
];

await processShops({
  label: 'EDEL AZABU',
  shopIds: ['tokyo_minato_azabujuban_edel', 'tokyo_minato_tamachi_edel'],
  nameImagePairs: EDEL_DATA,
  prefix: 'edel',
  referer: 'https://edel-azabu.com/',
});

console.log('\n完了');
