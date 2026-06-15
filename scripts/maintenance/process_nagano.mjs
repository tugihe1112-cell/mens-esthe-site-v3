import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BUCKET = 'therapist-images';

// ────────────────────────────────────────────
// ユーティリティ
// ────────────────────────────────────────────

async function getOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    return (
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      null
    );
  } catch {
    return null;
  }
}

async function uploadImage(imageUrl, storageKey, referer = null) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imageUrl, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || 'image/jpeg';
    const { error } = await supabase.storage.from(BUCKET).upload(storageKey, buf, {
      contentType: ct,
      upsert: true,
    });
    if (error) { console.error('  Storage error:', error.message); return null; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey);
    return data.publicUrl;
  } catch (e) {
    console.error('  Upload error:', e.message);
    return null;
  }
}

// ────────────────────────────────────────────
// 店舗定義
// ────────────────────────────────────────────

const SHOPS = [
  {
    id: 'nagano_matsumoto_futarikiri_spa',
    name: 'ふたりきりSPA (松本)',
    website_url: 'https://futarikiri-spa.com/',
    schedule_url: 'https://futarikiri-spa.com/schedule/',
    prefecture: '長野県',
    area: '松本',
  },
  {
    id: 'nagano_nagano_prime',
    name: '長野PRIME',
    website_url: 'https://nagano-prime.com/',
    schedule_url: 'https://nagano-prime.com/schedule',
    prefecture: '長野県',
    area: '長野',
  },
  {
    id: 'nagano_ueda_luna_femme',
    name: 'Luna Femme 上田 (ルナファム)',
    website_url: 'https://luna-femme.jp/',
    schedule_url: 'https://luna-femme.jp/schedule',
    prefecture: '長野県',
    area: '上田',
  },
  {
    id: 'nagano_nagano_yumehana',
    name: 'ゆめはな 長野',
    website_url: 'https://naganoyumehana.com/',
    schedule_url: 'https://naganoyumehana.com/schedule/',
    prefecture: '長野県',
    area: '長野',
  },
  {
    id: 'nagano_matsumoto_aroma_cream',
    name: 'Aroma Cream (アロマクリーム)',
    website_url: 'http://www.aroma-cream.com/',
    schedule_url: 'http://www.aroma-cream.com/schedule/',
    prefecture: '長野県',
    area: '松本',
  },
  {
    id: 'nagano_nagano_yurara',
    name: 'Yurara (ゆらら)',
    website_url: 'https://nagano-yurara.com/',
    schedule_url: 'https://nagano-yurara.com/schedule/',
    prefecture: '長野県',
    area: '長野',
  },
];

// ────────────────────────────────────────────
// セラピストデータ
// ────────────────────────────────────────────

// ふたりきりSPA: WordPress background-image (Referer必要)
const FUTARIKIRI = [
  { name: '佐々木あめ', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2026/04/IMG_0785.jpeg' },
  { name: '来栖みう',   imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2026/02/IMG_0123.jpeg' },
  { name: '糸月るり',   imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2024/08/13D68582-D858-43A7-93FF-4E8EEF5ADE8F.jpeg' },
  { name: '結城なの',   imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2024/03/結城なの3.jpg' },
  { name: '白石なつめ', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2022/03/16312309-EC10-42BE-AA7E-EC390C2AD195.jpeg' },
  { name: '吉岡ひな',   imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2025/07/image0-3-scaled.jpeg' },
  { name: '島倉のぞみ', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2025/05/23211402-7AE5-4CE5-AF3A-160F55DAAEC3-scaled.jpeg' },
  { name: '小嶋ひまり', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2025/03/girl-0000008dbf-6699dadd916ba.jpg' },
  { name: '小宮ほたる', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2025/12/S__20939095-1.jpg' },
  { name: '今井きい',   imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2024/03/今井きい1.jpg' },
  { name: '柚木まな',   imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2026/01/S__186966050.jpg' },
  { name: '佐山かえで', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2024/10/1A7A28AD-D322-4A29-A2FE-B4F93A294A23-scaled.jpeg' },
  { name: '木村あんな', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2025/10/S__19775530.jpg' },
  { name: '櫻りい',     imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2026/03/櫻りい1.jpg' },
  { name: '六花まろん', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2026/03/girl-0000008dbf-68faf6b65a033.jpg' },
  { name: '皆川める',   imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2026/05/皆川１.jpg' },
  { name: '水沢まりあ', imgUrl: 'https://futarikiri-spa.com/wp-content/uploads/2026/05/0.jpg' },
];

// 長野PRIME: LEON SPAパターン /photos/{lid}/raw_{lid}.jpg
const PRIME = [
  { name: 'あすか', lid: 10 }, { name: 'ゆあ',   lid: 20 }, { name: 'みお',   lid: 64 },
  { name: 'ゆりあ', lid: 111},{ name: 'かおり', lid: 67 }, { name: 'わかな', lid: 136},
  { name: 'ひまり', lid: 71 }, { name: 'るね',   lid: 131},{ name: 'まな',   lid: 97 },
  { name: 'るあ',   lid: 115},{ name: 'のぞみ', lid: 117},{ name: 'しおり', lid: 80 },
  { name: 'ゆきの', lid: 137},{ name: 'りほ',   lid: 135},{ name: 'あん',   lid: 121},
  { name: 'あいり', lid: 130},{ name: 'はる',   lid: 122},{ name: 'みはる', lid: 119},
  { name: 'せりな', lid: 125},{ name: 'はな',   lid: 133},{ name: 'こころ', lid: 134},
  { name: 'えみり', lid: 61 }, { name: 'める',   lid: 99 }, { name: 'ひなこ', lid: 103},
  { name: 'のあ',   lid: 58 }, { name: 'かほ',   lid: 38 }, { name: 'ももあ', lid: 9  },
  { name: 'みかこ', lid: 126},{ name: 'なな',   lid: 112},{ name: 'みう',   lid: 59 },
  { name: 'さいき', lid: 76 }, { name: 'みつき', lid: 120},{ name: 'さや',   lid: 101},
  { name: 'かすみ', lid: 129},{ name: 'みさき', lid: 123},{ name: 'あおい', lid: 118},
  { name: 'みれい', lid: 124},{ name: 'さおり', lid: 40 }, { name: 'みほ',   lid: 108},
  { name: 'こまち', lid: 66 }, { name: 'りお',   lid: 51 }, { name: 'あかね', lid: 109},
  { name: 'ゆずは', lid: 87 }, { name: 'すみれ', lid: 82 }, { name: 'ふうか', lid: 95 },
  { name: 'れお',   lid: 91 }, { name: 'なお',   lid: 42 }, { name: 'ひとみ', lid: 132},
];

// LunaFemme: Rails Active Storage URL (Public)
const LUNA_FEMME = [
  { name: '椿 みれい',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6NDYwLCJwdXIiOiJibG9iX2lkIn19--8b7d87d80094dfa651fa54097d36bdbbff0db5a2/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/mirei_7.png', filename: 'mirei_7.png' },
  { name: '宮下 夢子',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6NCwicHVyIjoiYmxvYl9pZCJ9fQ==--788c0639ae356b61f68517f4bb7229a955a96456/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/yumeko_1.png', filename: 'yumeko_1.png' },
  { name: '優木 かすみ', imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6OTcsInB1ciI6ImJsb2JfaWQifX0=--ab83baadd6c1a526c0a1f4e9781d878f4f48a099/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/kasumi_1.png', filename: 'kasumi_1.png' },
  { name: '神楽 あい',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MzE0LCJwdXIiOiJibG9iX2lkIn19--bb9aeb45ab723567da8159d16d2fa8a13e6cfc08/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/1.png', filename: 'ai_kagura_1.png' },
  { name: '瀬戸 りの',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6OTIsInB1ciI6ImJsb2JfaWQifX0=--a3156c924a567e1ac1770e5b798d1574ac0b83a0/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/rino_1.png', filename: 'rino_1.png' },
  { name: '花咲 りか',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MjE1LCJwdXIiOiJibG9iX2lkIn19--d05722fda7115fb1c1223621d2319b1b35090f3c/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/rika_7.png', filename: 'rika_7.png' },
  { name: '綾瀬 結',     imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTI5LCJwdXIiOiJibG9iX2lkIn19--c8e6444a7a34541b1c9cb8f21b28eac9610cb586/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/yui_1.png', filename: 'yui_1.png' },
  { name: '姫宮 かれん', imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6NiwicHVyIjoiYmxvYl9pZCJ9fQ==--ca5b3b15a61399f4aa6a5f18892e59efa5961cc7/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/karen1.png', filename: 'karen1.png' },
  { name: '芹沢 一華',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTM1LCJwdXIiOiJibG9iX2lkIn19--cfc707e04b5be561232c3279975daf9401701234/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/ichika_1.png', filename: 'ichika_1.png' },
  { name: '櫻井 ひな',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTAsInB1ciI6ImJsb2JfaWQifX0=--ff54c37dd0090cfa3f7573eb78b102507cbf5f0a/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/hina_2.png', filename: 'hina_2.png' },
  { name: '如月 柴乃',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MzcsInB1ciI6ImJsb2JfaWQifX0=--1cdf565a824621342aba519cbea641b0c7235953/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJqcGciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--0b40a6a87654de567f561024c96172c51e94d730/shino_1.jpg', filename: 'shino_1.jpg' },
  { name: '星野 あみ',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6OSwicHVyIjoiYmxvYl9pZCJ9fQ==--f33ed297cb29264fd26c145e24af1ef0978853ed/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/ami_01.png', filename: 'ami_01.png' },
  { name: '水城 あすな', imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTMsInB1ciI6ImJsb2JfaWQifX0=--eef60cb2b589eabae747c7252426f96f5bf83e25/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/asuna_04.png', filename: 'asuna_04.png' },
  { name: '花守 ももね', imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTEsInB1ciI6ImJsb2JfaWQifX0=--b2c936ce01b2fa54eea013dce13d1bef37e11f87/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/momone_1.png', filename: 'momone_1.png' },
  { name: '篠宮 ののか', imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTIsInB1ciI6ImJsb2JfaWQifX0=--bebb1fd7f2fb50c943717ddff70322baa7e76680/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/nonoka_3.png', filename: 'nonoka_3.png' },
  { name: '天宮 あおい', imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6OCwicHVyIjoiYmxvYl9pZCJ9fQ==--18fa3c1e662096e74cd9d0e9d828201bb656f13f/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/aoi_3.png', filename: 'aoi_3.png' },
  { name: '泉 ふみか',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6NywicHVyIjoiYmxvYl9pZCJ9fQ==--92b66ac9abb5c8c62328d1757d01bb2cb4f7fea2/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/fumika_1.png', filename: 'fumika_1.png' },
  { name: '葉月 るな',   imgUrl: 'https://luna-femme.jp/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTQsInB1ciI6ImJsb2JfaWQifX0=--0ceb5ebd2684dda562fc76f476715840ecf522f2/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJwbmciLCJyZXNpemVfdG9fbGltaXQiOls0MDAsNTIwXX0sInB1ciI6InZhcmlhdGlvbiJ9fQ==--4e4b61bdc1ab2215a7081441ce8be2848f1134c4/runa_2.png', filename: 'runa_2.png' },
];

// ゆめはな: 名前のみ
const YUMEHANA = [
  '平川', '河村', '白石', '戸崎', '今井', '雨宮', '石川', '中野',
  '華宮', '夢乃', '花野', '雅', '島田', '田崎', '浅倉', '月島',
  '辻', '本田', '平野', '森', '宮田', '相沢', '荒川', '広瀬',
];

// Aroma Cream: ml_11_1_{uid}.jpg
const AROMA_CREAM = [
  { name: '源しずか',   uid: 10198, ext: 'jpg' },
  { name: '姫宮あん',   uid: 10918, ext: 'jpg' },
  { name: '宮沢りお',   uid: 10958, ext: 'jpg' },
  { name: '椎名なつめ', uid: 10871, ext: 'jpg' },
  { name: '大島まりな', uid: 10868, ext: 'jpg' },
  { name: '松もとこ',   uid: 9631,  ext: 'jpg' },
  { name: '永瀬れあ',   uid: 10909, ext: 'jpg' },
  { name: '清水さおり', uid: 10619, ext: 'jpg' },
  { name: '月島あかり', uid: 10485, ext: 'jpg' },
  { name: '工藤みさき', uid: 10952, ext: 'jpg' },
  { name: '田中みな',   uid: 10537, ext: 'jpg' },
  { name: '華城かぐや', uid: 10632, ext: 'jpg' },
  { name: '九条りお',   uid: 10865, ext: 'jpg' },
  { name: '宝条なな',   uid: 10772, ext: 'jpg' },
  { name: '森川りほ',   uid: 10876, ext: 'jpg' },
  { name: '柊りん',     uid: 10879, ext: 'png' },
  { name: '綾瀬れい',   uid: 10955, ext: 'jpg' },
  { name: '水島ゆうひ', uid: 10860, ext: 'jpg' },
  { name: '朝日奈うい', uid: 10872, ext: 'jpg' },
  { name: '星野さくら', uid: 10769, ext: 'jpg' },
  { name: '愛沢るな',   uid: 10786, ext: 'jpg' },
  { name: '若月あんり', uid: 10260, ext: 'jpg' },
  { name: '心ひかり',   uid: 10857, ext: 'jpg' },
  { name: '一ノ瀬あすか', uid: 2481, ext: 'jpg' },
  { name: '市川まかな', uid: 9288,  ext: 'jpg' },
  { name: '小野ゆりな', uid: 8645,  ext: 'jpg' },
  { name: '花萌ゆいな', uid: 10885, ext: 'jpg' },
];

// Yurara: WordPress wp-content
const YURARA = [
  { name: 'ゆき', imgUrl: 'https://nagano-yurara.com/wp-content/uploads/2025/03/IMG_2605.jpeg', filename: 'IMG_2605.jpeg' },
  { name: '里穂', imgUrl: 'https://nagano-yurara.com/wp-content/uploads/2024/08/IMG_2115.jpeg', filename: 'IMG_2115.jpeg' },
  { name: '藍',   imgUrl: 'https://nagano-yurara.com/wp-content/uploads/2023/09/IMG_3061.jpeg', filename: 'IMG_3061.jpeg' },
];

// ────────────────────────────────────────────
// メイン処理
// ────────────────────────────────────────────

async function registerShops() {
  console.log('\n=== 店舗登録 ===');
  for (const shop of SHOPS) {
    const image_url = await getOgImage(shop.website_url);
    console.log(`${shop.id}: og:image = ${image_url || 'null'}`);
    if (DRY_RUN) continue;
    const { error } = await supabase.from('shops').upsert({
      id: shop.id,
      name: shop.name,
      website_url: shop.website_url,
      schedule_url: shop.schedule_url,
      image_url,
      raw_data: {
        prefecture: shop.prefecture,
        area: shop.area,
      },
    }, { onConflict: 'id' });
    if (error) console.error('  ERROR:', error.message);
    else console.log('  ✅ 登録完了');
    await new Promise(r => setTimeout(r, 500));
  }
}

async function registerFutarikiri() {
  const shopId = 'nagano_matsumoto_futarikiri_spa';
  console.log(`\n=== ふたりきりSPA (${FUTARIKIRI.length}名) ===`);
  let ok = 0, ng = 0;
  for (const t of FUTARIKIRI) {
    const storageKey = `futarikiri_${t.imgUrl.split('/').pop()}`;
    let imageUrl = null;
    if (!DRY_RUN) {
      imageUrl = await uploadImage(t.imgUrl, storageKey, 'https://futarikiri-spa.com/');
    }
    console.log(`  ${t.name}: ${imageUrl ? '✅' : '⚠️ null'}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert({
        id: `${shopId}_${t.name}`,
        shop_id: shopId,
        name: t.name,
        image_url: imageUrl,
      }, { onConflict: 'id' });
      if (error) { console.error('    ERROR:', error.message); ng++; } else ok++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`  → ${ok}名登録 / ${ng}件エラー`);
}

async function registerPrime() {
  const shopId = 'nagano_nagano_prime';
  console.log(`\n=== 長野PRIME (${PRIME.length}名) ===`);
  let ok = 0, ng = 0;
  for (const t of PRIME) {
    const imgUrl = `https://nagano-prime.com/photos/${t.lid}/raw_${t.lid}.jpg`;
    const storageKey = `prime_${t.lid}.jpg`;
    let imageUrl = null;
    if (!DRY_RUN) {
      imageUrl = await uploadImage(imgUrl, storageKey, 'https://nagano-prime.com/');
    }
    console.log(`  ${t.name} (lid=${t.lid}): ${imageUrl ? '✅' : '⚠️'}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert({
        id: `${shopId}_${t.name}`,
        shop_id: shopId,
        name: t.name,
        image_url: imageUrl,
      }, { onConflict: 'id' });
      if (error) { console.error('    ERROR:', error.message); ng++; } else ok++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`  → ${ok}名登録 / ${ng}件エラー`);
}

async function registerLunaFemme() {
  const shopId = 'nagano_ueda_luna_femme';
  console.log(`\n=== LunaFemme (${LUNA_FEMME.length}名) ===`);
  let ok = 0, ng = 0;
  for (const t of LUNA_FEMME) {
    const storageKey = `lunafemme_${t.filename}`;
    let imageUrl = null;
    if (!DRY_RUN) {
      imageUrl = await uploadImage(t.imgUrl, storageKey, 'https://luna-femme.jp/');
    }
    console.log(`  ${t.name}: ${imageUrl ? '✅' : '⚠️'}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert({
        id: `${shopId}_${t.name.replace(/\s/g, '')}`,
        shop_id: shopId,
        name: t.name,
        image_url: imageUrl,
      }, { onConflict: 'id' });
      if (error) { console.error('    ERROR:', error.message); ng++; } else ok++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`  → ${ok}名登録 / ${ng}件エラー`);
}

async function registerYumehana() {
  const shopId = 'nagano_nagano_yumehana';
  console.log(`\n=== ゆめはな (${YUMEHANA.length}名・名前のみ) ===`);
  if (DRY_RUN) { YUMEHANA.forEach(n => console.log(`  ${n}`)); return; }
  let ok = 0, ng = 0;
  for (const name of YUMEHANA) {
    const { error } = await supabase.from('therapists').upsert({
      id: `${shopId}_${name}`,
      shop_id: shopId,
      name,
      image_url: null,
    }, { onConflict: 'id' });
    if (error) { console.error(`  ${name} ERROR:`, error.message); ng++; } else { console.log(`  ${name} ✅`); ok++; }
  }
  console.log(`  → ${ok}名登録 / ${ng}件エラー`);
}

async function registerAromaCream() {
  const shopId = 'nagano_matsumoto_aroma_cream';
  const BASE = 'http://www.aroma-cream.com';
  console.log(`\n=== Aroma Cream (${AROMA_CREAM.length}名) ===`);
  let ok = 0, ng = 0;
  for (const t of AROMA_CREAM) {
    const imgUrl = `${BASE}/images/ml_11_1_${t.uid}.${t.ext}`;
    const storageKey = `aromacream_${t.uid}.${t.ext}`;
    let imageUrl = null;
    if (!DRY_RUN) {
      imageUrl = await uploadImage(imgUrl, storageKey, BASE + '/');
    }
    console.log(`  ${t.name} (uid=${t.uid}): ${imageUrl ? '✅' : '⚠️'}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert({
        id: `${shopId}_${t.name}`,
        shop_id: shopId,
        name: t.name,
        image_url: imageUrl,
      }, { onConflict: 'id' });
      if (error) { console.error('    ERROR:', error.message); ng++; } else ok++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`  → ${ok}名登録 / ${ng}件エラー`);
}

async function registerYurara() {
  const shopId = 'nagano_nagano_yurara';
  console.log(`\n=== Yurara (${YURARA.length}名) ===`);
  let ok = 0, ng = 0;
  for (const t of YURARA) {
    const storageKey = `yurara_${t.filename}`;
    let imageUrl = null;
    if (!DRY_RUN) {
      imageUrl = await uploadImage(t.imgUrl, storageKey, 'https://nagano-yurara.com/');
    }
    console.log(`  ${t.name}: ${imageUrl ? '✅' : '⚠️'}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert({
        id: `${shopId}_${t.name}`,
        shop_id: shopId,
        name: t.name,
        image_url: imageUrl,
      }, { onConflict: 'id' });
      if (error) { console.error('    ERROR:', error.message); ng++; } else ok++;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`  → ${ok}名登録 / ${ng}件エラー`);
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== PRODUCTION ===');
  await registerShops();
  await registerFutarikiri();
  await registerPrime();
  await registerLunaFemme();
  await registerYumehana();
  await registerAromaCream();
  await registerYurara();
  console.log('\n=== 完了 ===');
}

main().catch(console.error);
