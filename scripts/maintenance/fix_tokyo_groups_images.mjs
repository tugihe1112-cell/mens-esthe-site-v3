/**
 * QUEEN'S COLLECTION / CREST SPA / GRACE 画像登録
 * - Chrome から取得した画像URLをSupabase Storageにアップロードしてimage_urlを更新
 * - GRACEの「伊波 マユ」→「新垣 マユ」名前修正も実施
 * 実行: node scripts/maintenance/fix_tokyo_groups_images.mjs [--dry-run]
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
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { console.error(`  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.error(`  fetch error: ${e.message}`); return null; }
}

async function updateGroupImages({ label, shopIds, nameImagePairs, prefix, referer }) {
  console.log(`\n【${label}】 ${nameImagePairs.length}名 × ${shopIds.length}店舗`);
  let updated = 0, skipped = 0, failed = 0;

  for (const [name, imageUrl] of nameImagePairs) {
    // no_image プレースホルダーは null のまま
    const isNoImage = !imageUrl || imageUrl.includes('no_image') || imageUrl.startsWith('/assets');
    if (isNoImage) { process.stdout.write('_'); skipped++; continue; }

    if (DRY_RUN) {
      console.log(`  ${name} → ${imageUrl.slice(-60)}`);
      continue;
    }

    // Storageにアップロード（ファイル名は prefix + S3パスの末尾部分）
    const urlBase = imageUrl.split('/').pop().split('?')[0];
    const stem = urlBase.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 50);
    const ext = (urlBase.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `${prefix}_${stem}.${safeExt}`;
    const storageUrl = await uploadImage(imageUrl, fileName, referer);
    await sleep(80);

    if (!storageUrl) { process.stdout.write('!'); failed++; continue; }

    // 全店舗のレコードを更新
    for (const shopId of shopIds) {
      const id = `${shopId}_${name}`;
      const { error } = await supabase.from('therapists')
        .update({ image_url: storageUrl })
        .eq('id', id);
      if (error) { console.log(`\n❌ ${id}: ${error.message}`); }
    }
    process.stdout.write('+');
    updated++;
    await sleep(60);
  }
  if (!DRY_RUN) console.log(`\n  更新 ${updated}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
}

// ─── 1. QUEEN'S COLLECTION ───────────────────────────────────────────────────
const QUEENS_SHOPS = [
  'tokyo_chiyoda_jimbocho_queens_collection',
  'tokyo_shinjuku_shinjuku_queens_collection',
  'tokyo_shinjuku_shinjuku_sanchome_queens_collection',
  'tokyo_setagaya_meidaimae_queens_collection',
];
const QUEENS_BASE = 'https://queens-collection-esthe.com/';
const QUEENS_DATA = [
  ['フェリス杏樹', 'https://queens-collection-esthe.com/images/IMG_0846-225x300.jpeg'],
  ['上智ゆりあ', 'https://queens-collection-esthe.com/images/55-225x300.jpg'],
  ['仁愛える', 'https://queens-collection-esthe.com/images/55-1-225x300.jpg'],
  ['一橋咲良', 'https://queens-collection-esthe.com/images/1-27-169x300.jpg'],
  ['芦屋いぶ', 'https://queens-collection-esthe.com/images/IMG_0826-257x300.jpeg'],
  ['東京蕾夢', 'https://queens-collection-esthe.com/images/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A%E3%81%AE%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3-2026-01-23T182205.513-225x300.jpg'],
  ['慈恵みりあ', 'https://queens-collection-esthe.com/images/37231165-c8fd-4069-a088-9b45ca13e9ad-225x300.jpg'],
  ['学習院つばき', 'https://queens-collection-esthe.com/images/03-1-225x300.jpg'],
  ['桃山じゅり', 'https://queens-collection-esthe.com/images/3-25-271x300.jpg'],
  ['慶應くれあ', 'https://queens-collection-esthe.com/images/08a6f5ea-214b-40f0-811e-7fe86eecacc3-225x300.jpg'],
  ['青葉ゆうり', 'https://queens-collection-esthe.com/images/IMG_0834-231x300.jpeg'],
  ['光華まほ', 'https://queens-collection-esthe.com/images/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A%E3%81%AE%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3-2025-10-27T110924.099-225x300.jpg'],
  ['白百合 響', 'https://queens-collection-esthe.com/images/fc1a93e2-bec1-4d26-ba89-94e7ac446463-169x300.jpg'],
  ['十文字みみ', 'https://queens-collection-esthe.com/images/cropped_img_gg6n7_20260217221723-1-193x300.jpg'],
  ['京月みやび', 'https://queens-collection-esthe.com/images/IMG_3803-225x300.jpeg'],
  ['森ノ宮さやか', 'https://queens-collection-esthe.com/images/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A%E3%81%AE%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3-2026-03-13T105124.162-225x300.jpg'],
  ['千歳みづき', 'https://queens-collection-esthe.com/images/361a7db8-442a-404c-abbd-f8cc2b3406f6-221x300.jpg'],
  ['本女にこ', 'https://queens-collection-esthe.com/images/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A%E3%81%AE%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3-2024-04-26T140653.486-1-225x300.jpg'],
  ['月見桃菜', 'https://queens-collection-esthe.com/images/36cfbd99-b24b-4780-8b9d-3c8e2aaadb1c-170x300.jpg'],
  ['杏林芽郁', 'https://queens-collection-esthe.com/images/image7-248x300.jpeg'],
  ['星城うみ', 'https://queens-collection-esthe.com/images/842b7781-5214-40ee-b37c-e20f6b41b14f-182x300.jpg'],
  ['清泉あゆみ', 'https://queens-collection-esthe.com/images/3-30-183x300.jpg'],
  ['めろん♡NH♡', 'https://queens-collection-esthe.com/images/IMG_4022-1-250x300.jpeg'],
  ['早稲田真衣', 'https://queens-collection-esthe.com/images/thumbnail_image0-1-9-175x300.jpg'],
  ['相模れん', 'https://queens-collection-esthe.com/images/IMG_3483-204x300.jpeg'],
  ['酪農みるく', 'https://queens-collection-esthe.com/images/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A%E3%81%AE%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3-2024-06-17T045030.804-2-300x188.jpg'],
  ['灘かりん', 'https://queens-collection-esthe.com/images/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A%E3%81%AE%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3-2026-02-19T130610.481-1-250x300.jpg'],
  ['目黒りお', 'https://queens-collection-esthe.com/images/IMG_4024-171x300.jpeg'],
  ['お茶の水るい', 'https://queens-collection-esthe.com/images/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A%E3%81%AE%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3-2024-07-07T225923.866-188x300.jpg'],
  ['天使みゆ', 'https://queens-collection-esthe.com/images/IMG_3564-226x300.jpeg'],
  ['青山あいら', 'https://queens-collection-esthe.com/images/3-8-225x300.jpg'],
  ['常葉音羽', 'https://queens-collection-esthe.com/images/3131-225x300.jpg'],
  ['桜美林はな', 'https://queens-collection-esthe.com/images/%E3%81%AF%E3%81%AA-%E6%94%B9-300x250.jpg'],
  ['桜花つばめ', 'https://queens-collection-esthe.com/images/IMG_3557-229x300.jpeg'],
  ['成城ひなた', 'https://queens-collection-esthe.com/images/1-219x300.jpeg'],
  ['共立りな', 'https://queens-collection-esthe.com/images/4a74ff94-de06-4472-999b-326542d8ee6e-233x300.jpg'],
  ['初音カレン', 'https://queens-collection-esthe.com/images/thumbnail_image9-227x300.jpg'],
  ['法政まゆ', 'https://queens-collection-esthe.com/images/IMG_3786-300x297.jpeg'],
  ['イエール閻魔', 'https://queens-collection-esthe.com/images/%E9%96%BB%E9%AD%94111-225x300.jpg'],
  ['神戸あやな', 'https://queens-collection-esthe.com/images/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A%E3%81%AE%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3-73-225x300.jpg'],
];

await updateGroupImages({
  label: "QUEEN'S COLLECTION",
  shopIds: QUEENS_SHOPS,
  nameImagePairs: QUEENS_DATA,
  prefix: 'queens',
  referer: QUEENS_BASE,
});

await sleep(1000);

// ─── 2. CREST SPA TOKYO ──────────────────────────────────────────────────────
const CREST_SHOPS = [
  'tokyo_kita_crest_spa_tokyo',
  'tokyo_tachikawa_crest_spa_tokyo',
  'tokyo_kita_akabane_crest',
  'tokyo_musashino_kichijoji_crest',
];
const CREST_BASE = 'https://crestspa-tokyo.com/';
const S3C = 'https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/';
const CREST_DATA = [
  ['佐々木 さよ', S3C+'333/8f6e3438-c4e5-46ec-b021-8a6783a49dec.jpg'],
  ['桃乃 かぐや', S3C+'330/18313901-c550-4b07-a6e7-590e23d62829.jpg'],
  ['黒羽 らな',   S3C+'332/40f2f1e4-dfe7-4027-9a6a-a9ee4b4777f3.jpg'],
  ['神田 あいか', S3C+'319/c966d427-bb84-45e1-a4d9-bb681d1dd7a8.jpg'],
  ['水野 はれ',   S3C+'320/bf068394-533f-4b2d-8f66-f37f16f6481d.jpg'],
  ['九条 れいな', S3C+'308/ecdc0135-cab8-4465-9396-146d0b654031.jpg'],
  ['宮乃 あやか', S3C+'303/6085474e-dc9e-4728-8c0c-955304ddb2f6.jpg'],
  ['千早 あのん', S3C+'307/f96798d6-4fba-4e4e-9cb6-fbac616b5616.jpg'],
  ['雪白 ひめ',   S3C+'311/04457c64-2046-4505-8830-08da18b526ec.jpg'],
  ['桃宮 あかり', S3C+'304/4e326fd6-4563-4ea5-bfd6-581177a61fbc.jpg'],
  ['犬飼 むぎ',   S3C+'312/7a69f6ea-69b8-43a6-bf4f-93f2188b80d2.jpg'],
  ['花宮 るる',   S3C+'9/2585ca67-9f41-4402-aed3-bdf37e8fffff.jpg'],
  ['星空 ののか', S3C+'185/3b1a64d8-97e5-4fe5-a5a1-b16addb16fc4.jpg'],
  ['河北 みれい', S3C+'109/e0593d69-20cf-44b2-8bfa-0752b8e5f269.jpg'],
  ['雨宮 ゆう',   S3C+'248/4944eca4-bdd6-4928-b1fb-e276452160a2.jpg'],
  ['愛坂 れん',   S3C+'253/585b997b-95fc-4ffd-9310-abb17d33662a.jpg'],
  ['真鍋 すい',   S3C+'213/4c6acd46-4a3e-4355-adc7-75f86ce326ba.jpg'],
  ['早瀬 めぐみ', S3C+'254/5984cd64-f5a0-40a3-9704-ba879a86cc92.jpg'],
  ['浅海 るみ',   S3C+'71/bdbc2252-0713-4004-be8b-092b28de4eea.jpg'],
  ['白石 りん',   S3C+'81/d6e81e3b-0c9e-4d4b-a48c-8998440f8f8a.jpg'],
  ['日向 ゆい',   S3C+'265/10a9cf71-bbc9-4937-8142-9d61613c525b.jpg'],
  ['高宮 えれな', S3C+'141/7a7ceaf4-f334-4a2f-89c1-09addd7fd149.jpg'],
  ['霧里 しずく', S3C+'237/17f1a4be-c741-4e5a-a7ec-2440c32e1c8b.jpg'],
  ['月乃 るな',   S3C+'73/337ac9af-2464-4d2b-baa2-209daf7f41dd.jpg'],
  ['柊木 しほ',   S3C+'264/ece18df3-bead-41eb-9ce8-68ee8d62b4bf.jpg'],
  ['神咲 さくら', S3C+'280/ba07fc02-e118-4be4-8223-7dbcf1259e84.jpg'],
  ['七泉 まりか', S3C+'246/51afe27e-4980-4092-ae2e-87a24a2f9e8c.jpg'],
  ['佐倉 ひなこ', S3C+'231/678bd54c-deac-4561-92cc-1374e2e0549c.jpg'],
  ['風見 れお',   S3C+'259/a0f91f6f-2375-46af-a8b7-97a3dbf8c3c1.jpg'],
  ['朝比奈 まゆ', S3C+'228/da487380-df3f-4e3f-9a16-51280912b85d.jpg'],
  ['爆撃 もりこ', S3C+'285/7eab3e81-c47f-4604-b32b-664263c6e45a.jpg'],
  ['降田 れい',   S3C+'258/453d9e13-6113-48e1-a664-2c0f06dd1586.jpg'],
  ['篠崎 みな',   S3C+'275/65c246ec-0abf-4cf5-8fd5-b4c6e4c48488.jpg'],
  ['滝沢 りな',   S3C+'40/db7c0012-819c-4d72-8ed9-18c487f7ce4b.png'],
  ['加賀美 るい', S3C+'74/43955d4e-33ad-456a-8ab5-59f6d38fd9c6.jpg'],
  ['美澄 こころ', S3C+'295/8a0052da-bfa3-4d3b-a4a6-72477a5f5220.jpg'],
  ['宮園 あいり', S3C+'241/e9c3642b-54e8-4581-a813-947653bb431a.jpg'],
  ['榊 りりあ',   S3C+'293/55638498-23b1-452c-9d82-9d5d3a011820.jpg'],
  ['楪 つむぎ',   S3C+'255/713f1529-5772-4666-8e89-4d201e895717.jpg'],
  ['宮下 あいね', S3C+'249/4a900b82-54a9-4055-95e6-9b97a51e4e27.jpg'],
  ['花倉 もな',   S3C+'226/b3b54444-2817-4602-a541-8c2e5e18a5e0.jpg'],
  ['霧島 ゆうか', S3C+'291/c7dbbdee-c68a-421f-9392-b3b47960d9a7.jpg'],
  ['小倉 ももか', S3C+'290/a5cd552d-079b-43b3-a0ba-9e6f8dc42c3b.jpg'],
  ['広瀬 りこ',   S3C+'286/30b6f11e-9767-4eea-9854-e7232eba3812.jpg'],
  ['桜庭 こはる', S3C+'289/73cc7d4b-7d3f-4214-9e6d-ece34f62cf0a.jpg'],
  ['東堂 なのは', S3C+'292/14fe2398-04a8-467c-a17e-8669c1ffdd3a.jpg'],
  ['高梨 わかな', S3C+'288/0546deeb-75a1-48c4-9588-e6e83f29607a.jpg'],
  ['愛沢 みなみ', S3C+'181/a06870f9-17a0-4969-ba1c-5efff5a6e7e0.jpg'],
  ['長瀬 みずな', S3C+'279/7abafd9d-6a13-49d9-bfb1-53235e24bc3f.jpg'],
  ['彩美 かのん', S3C+'294/2e7e4f59-54ce-4b8d-a92e-7a4df9746737.jpg'],
  ['凪乃 なの',   S3C+'242/3faa8d9f-f743-4ac7-80a3-ba4caaef6e89.jpg'],
  ['森 みつき',   S3C+'247/21822688-b28e-4c48-bc6f-b6174034fe5e.jpg'],
  ['新井 よしの', S3C+'260/90c0f4d8-21e9-4b5e-8efa-f9957d9a3881.jpg'],
  ['和泉 せりな', S3C+'268/1fbfe5f8-6944-4fca-b0f4-4597fbe9d061.jpg'],
  ['大槻 ゆい',   S3C+'240/993fdaaf-1ab4-445c-91aa-5f8669b035ae.jpg'],
  ['如月 ゆき',   S3C+'133/88208335-a443-4b3c-adea-c0dc4e70387f.jpg'],
  ['小笠原 あず', S3C+'137/623bb5f0-96be-4d84-bad0-1cfb4d64951a.jpg'],
  ['菊池 みおん', S3C+'323/61fbdb6b-80a5-453c-aebf-a8b0e45aeaca.jpg'],
  ['村野 ありさ', S3C+'236/efd17bce-b7f0-4d47-83f3-bac3156e1ad5.jpg'],
  ['白雪 ゆめ',   S3C+'76/9f6da973-903c-47bb-945f-1768a8480169.jpg'],
  ['西園 まな',   S3C+'256/7dad7ea7-345e-46d7-8c6b-b91f232a55e9.jpg'],
  ['鹿目 みほ',   S3C+'191/6ee0ae80-a966-41f3-aff8-908c462afca0.jpg'],
  ['白波 りか',   S3C+'322/0ad65020-318b-4bcd-9372-0c8df93baa43.jpg'],
  ['瀬良 あおい', S3C+'316/a3b39666-beb1-4760-a4fe-fdb3e6e5e8c6.jpg'],
  ['桜葉 りお',   S3C+'329/272b1491-fa7c-48eb-a424-80c0f0c94559.jpg'],
  ['美月 なほ',   S3C+'324/627243c7-fcf6-4365-983d-45fcdc1099f3.jpg'],
  ['月城 ゆあ',   S3C+'315/6444c0b7-0895-4381-af28-f897567f8379.jpg'],
  ['神楽 なつき', S3C+'317/77459cbb-1be6-41ec-8ce6-8f798d09d119.jpg'],
  ['一ノ瀬 ねね', S3C+'306/64249f3e-9a50-4db5-9fb3-714d339bd9bd.jpg'],
  ['加藤 のあ',   S3C+'164/4bffce78-b97d-40b1-a3de-7a89ae0a2931.jpg'],
  ['桜井 りおな', S3C+'302/297af87d-6b07-4b90-b8d6-cbb500c533f2.jpg'],
  ['湊 なみ',     S3C+'326/069a1502-a6b8-4b4b-b32d-a141a63ef7d2.jpg'],
  ['結城 かれん', S3C+'214/c2c42f44-0034-4597-a1c1-a24b709272ce.jpg'],
  ['城咲 えり',   S3C+'243/e2f84064-4498-4e7e-bad1-f14ff0b76048.jpg'],
  ['成瀬 みりあ', S3C+'187/b100db3f-041f-4d5a-b0c6-d6a2cf2f31b4.jpg'],
  ['小泉 ひな',   S3C+'91/72f093ea-2138-4ebd-b522-016aee96ffa7.jpg'],
  ['海老原 さよ', S3C+'283/e2352bc9-269a-4d26-9c7b-03d30efdd7eb.jpg'],
  ['浅倉 ほの',   null], // no_image
  ['絢瀬 もね',   S3C+'331/f77a4d98-fd0e-4929-94db-3a589d04957e.jpg'],
  ['胡桃 ゆま',   S3C+'334/fc1e0f31-c6ce-472d-b1b0-432a82faf779.jpg'],
];

await updateGroupImages({
  label: 'CREST SPA TOKYO',
  shopIds: CREST_SHOPS,
  nameImagePairs: CREST_DATA,
  prefix: 'crestspa',
  referer: CREST_BASE,
});

await sleep(1000);

// ─── 3. GRACE ────────────────────────────────────────────────────────────────
const GRACE_SHOPS = ['tokyo_meguro_nakameguro_grace', 'tokyo_meguro_meguro_grace'];
const GRACE_BASE = 'http://grace-meguro.com/';
const S3G = 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/';
const GRACE_DATA = [
  ['山瀬 いおり', S3G+'127/2603fe7e-78d2-4c29-a99a-96811084a4d4.jpg'],
  ['花芽 さち',   S3G+'128/469c24de-a4ea-4259-94f6-fa47974aa5b8.jpg'],
  ['能代 すみれ', S3G+'126/56cde364-ed3c-49e0-93e2-dc17be459c7e.jpg'],
  ['一色 しずく', S3G+'125/5ce24f03-b069-4d9f-8a57-64d1f6c339bd.jpg'],
  ['森 にき',     S3G+'122/a00d72dc-ee8b-4d12-97e7-ec6d036dcaa5.jpg'],
  ['新田 りえ',   S3G+'116/7e80e197-c469-478f-82b0-160a58d48778.jpg'],
  ['伊波 ひな',   S3G+'112/f269b76c-1027-4f93-a5ab-1d32cf4c7803.jpg'],
  ['新垣 マユ',   S3G+'97/008d987a-6866-4a30-8f0c-bf88a1e21fd2.jpg'],
  ['月野 あおい', S3G+'95/91fa31f5-fedd-411c-883c-31eb8c91fa6a.jpg'],
  ['水島えみり',  S3G+'2/fee096bb-5266-41a0-b1bd-41da76698869.jpg'],
  ['南 ちか',     S3G+'6/c23fb709-1cf6-4557-a9d4-482018704cc2.jpg'],
  ['有田 カスミ', S3G+'66/d6ae6796-c9e2-47e5-b585-d25dd869f285.jpg'],
  ['荒木 りな',   S3G+'59/13734f6f-bae7-4f05-ac18-498e262ece4a.jpg'],
  ['風間 じゅん', S3G+'85/22e57519-95ed-4128-b3cc-e8d6bc33a8b5.jpg'],
  ['冬月なな',    S3G+'17/5c9c5b23-c36a-4ddc-8cc2-ed754671d390.jpg'],
  ['岡 マルミ',   S3G+'84/e5ca3bca-2313-4e63-9017-cb8746c30b55.jpg'],
  ['福富 れな',   S3G+'113/627177de-b5cf-4e98-b9e1-7ea74fc9c701.jpg'],
  ['星 しほ',     S3G+'123/1e91829e-6cb6-418c-b044-1fe2c34af9ea.jpg'],
  ['高梨 みゆう', S3G+'108/e81c2af0-cb0e-41b4-84ca-1f7c96114c61.jpg'],
  ['葉月 りょう', S3G+'115/a2a59a2f-392c-4f51-bd0c-c348afd9c318.jpg'],
  ['小栗 あやな', S3G+'83/3fe49f1f-cd62-4c5a-b90d-35b0cf0d01be.jpg'],
  ['一条さくら',  S3G+'10/81522fee-af50-4dc0-8e41-2af3eac53229.jpg'],
  ['池田 モエ',   S3G+'102/c2574a1c-921e-42db-b7ec-2c6404e520dc.jpg'],
  ['石原 あやか', S3G+'121/f788e8cb-f736-4403-947e-b7cfa8b6d74f.jpg'],
  ['一ノ瀬 レナ', S3G+'27/ec5ac018-9ec1-4b8f-b1ca-234e24fce984.jpg'],
  ['二ノ宮 あい', S3G+'86/d2b19c1b-17ea-4855-aa68-10d4db77e611.jpg'],
];

// GRACE: 「伊波 マユ」を「新垣 マユ」に修正（Chrome DOM確認で判明）
console.log('\n【GRACE 名前修正】 伊波 マユ → 新垣 マユ');
if (!DRY_RUN) {
  for (const shopId of GRACE_SHOPS) {
    const { error } = await supabase.from('therapists')
      .delete()
      .eq('id', `${shopId}_伊波 マユ`);
    if (error) console.log(`  DELETE error: ${error.message}`);
    else process.stdout.write('d');
  }
  console.log(' 削除完了');
}

await updateGroupImages({
  label: 'GRACE',
  shopIds: GRACE_SHOPS,
  nameImagePairs: GRACE_DATA,
  prefix: 'grace',
  referer: GRACE_BASE,
});

console.log('\n\n全完了');
