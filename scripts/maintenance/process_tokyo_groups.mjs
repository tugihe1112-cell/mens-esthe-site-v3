/**
 * 東京 複数店舗グループ セラピスト登録
 * - Aroma Lunabelle (5店舗)      /cast/ cheerio取得
 * - QUEEN'S COLLECTION (4店舗)   Chrome取得 (2026-05-07) 40名
 * - CREST SPA TOKYO (4店舗)      Chrome取得 (2026-05-07) 81名
 * - GRACE (2店舗)                Chrome取得 (2026-05-07) 28名
 * 実行: node scripts/maintenance/process_tokyo_groups.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const BUCKET = 'therapist-images';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function fetchHtml(url, referer) {
  const res = await fetch(url, {
    headers: { ...UA, Referer: referer || url },
    signal: AbortSignal.timeout(15000),
  });
  return res.text();
}

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, { headers: { ...UA, Referer: referer || imageUrl }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

async function processShops({ shopIds, therapistMap, prefix, referer }) {
  for (const shopId of shopIds) {
    console.log(`\n=== ${shopId} (${therapistMap.size}名) ===`);
    if (DRY_RUN) {
      let i = 0;
      for (const [name, url] of therapistMap) {
        if (i++ < 8) console.log(`  ${name} → ${url ? url.slice(0,70) : '(写真なし)'}`);
      }
      if (therapistMap.size > 8) console.log(`  ... 他${therapistMap.size - 8}名`);
      continue;
    }
    let inserted = 0, skipped = 0, failed = 0;
    for (const [name, imageUrl] of therapistMap) {
      const id = `${shopId}_${name}`;
      const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
      if (existing) { process.stdout.write('='); skipped++; continue; }

      let storageUrl = null;
      if (imageUrl) {
        const base = imageUrl.split('/').pop().split('?')[0];
        const stem = base.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 40);
        const ext = (base.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
        const safeExt = ext === 'jpeg' ? 'jpg' : ext;
        storageUrl = await uploadImage(imageUrl, `${prefix}_${stem}.${safeExt}`, referer);
        await sleep(80);
      }

      const { error } = await supabase.from('therapists').insert({
        id, shop_id: shopId, name, image_url: storageUrl ?? imageUrl ?? null,
      });
      if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
      else { process.stdout.write(imageUrl ? (storageUrl ? '+' : '.') : 'n'); inserted++; }
      await sleep(80);
    }
    console.log(`\n  挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
    await sleep(300);
  }
}

// ─── 1. Aroma Lunabelle (5店舗) ───────────────────────────────────────────────
console.log('【Aroma Lunabelle】 /cast/ 取得中...');
{
  const BASE = 'https://aroma-lunabelle.com';
  const html = await fetchHtml(`${BASE}/cast/`, BASE + '/');
  const text = cheerio.load(html).text();
  const map = new Map();

  // 「名前 (年齢)Xcm Xカップ」パターン
  const regex = /([^\s\n(（]{1,15})\s+\(\d{2,3}\)\d{3}cm/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const name = m[1].trim();
    if (name.length < 2 || name.length > 15) continue;
    if (!/[ぁ-んァ-ヾ一-龯a-zA-Zａ-ｚＡ-Ｚ]/.test(name)) continue;
    if (/ホーム|スケジュール|アクセス|求人|メンズ|エステ|ルナベル|スタッフ|セラピスト|システム|料金|イベント/i.test(name)) continue;
    if (!map.has(name)) map.set(name, null);
  }

  console.log(`  取得: ${map.size}名`);
  await processShops({
    shopIds: [
      'tokyo_minato_azabujuban_lunabelle',
      'tokyo_shinagawa_gotanda_lunabelle',
      'tokyo_shinjuku_shinjuku_lunabelle',
      'tokyo_minato_shinbashi_lunabelle',
      'tokyo_chiyoda_akihabara_aroma_lunabelle_akihabara',
    ],
    therapistMap: map,
    prefix: 'lunabelle',
    referer: BASE + '/',
  });
}

await sleep(1000);

// ─── 2. QUEEN'S COLLECTION (4店舗) ───────────────────────────────────────────
// JS描画サイト。Claude in Chrome で /therapist/ から取得 (2026-05-07) 40名
console.log('\n【QUEEN\'S COLLECTION】 Chrome取得データ (2026-05-07) 40名...');
{
  const map = new Map([
    'フェリス杏樹', '上智ゆりあ', '仁愛える', '一橋咲良', '芦屋いぶ',
    '東京蕾夢', '慈恵みりあ', '学習院つばき', '桃山じゅり', '慶應くれあ',
    '青葉ゆうり', '光華まほ', '白百合 響', '十文字みみ', '京月みやび',
    '森ノ宮さやか', '千歳みづき', '本女にこ', '月見桃菜', '杏林芽郁',
    '星城うみ', '清泉あゆみ', 'めろん♡NH♡', '早稲田真衣', '相模れん',
    '酪農みるく', '灘かりん', '目黒りお', 'お茶の水るい', '天使みゆ',
    '青山あいら', '常葉音羽', '桜美林はな', '桜花つばめ', '成城ひなた',
    '共立りな', '初音カレン', '法政まゆ', 'イエール閻魔', '神戸あやな',
  ].map(n => [n, null]));

  console.log(`  取得: ${map.size}名`);
  await processShops({
    shopIds: [
      'tokyo_chiyoda_jimbocho_queens_collection',
      'tokyo_shinjuku_shinjuku_queens_collection',
      'tokyo_shinjuku_shinjuku_sanchome_queens_collection',
      'tokyo_setagaya_meidaimae_queens_collection',
    ],
    therapistMap: map,
    prefix: 'queens',
    referer: 'https://queens-collection-esthe.com/',
  });
}

await sleep(1000);

// ─── 3. CREST SPA TOKYO (4店舗) ──────────────────────────────────────────────
// JS描画サイト。Claude in Chrome で /therapist/ から取得 (2026-05-07) 81名
// ノイズ「セラピスト大募集中♪」は除外済み
console.log('\n【CREST SPA TOKYO】 Chrome取得データ (2026-05-07) 81名...');
{
  const map = new Map([
    '佐々木 さよ', '桃乃 かぐや', '黒羽 らな', '伊織 せら', '神田 あいか',
    '水野 はれ', '九条 れいな', '宮乃 あやか', '千早 あのん', '雪白 ひめ',
    '桃宮 あかり', '犬飼 むぎ', '花宮 るる', '星空 ののか', '河北 みれい',
    '雨宮 ゆう', '愛坂 れん', '真鍋 すい', '早瀬 めぐみ', '浅海 るみ',
    '白石 りん', '日向 ゆい', '高宮 えれな', '霧里 しずく', '月乃 るな',
    '柊木 しほ', '神咲 さくら', '七泉 まりか', '佐倉 ひなこ', '風見 れお',
    '朝比奈 まゆ', '爆撃 もりこ', '降田 れい', '篠崎 みな', '滝沢 りな',
    '加賀美 るい', '美澄 こころ', '宮園 あいり', '榊 りりあ', '楪 つむぎ',
    '宮下 あいね', '花倉 もな', '霧島 ゆうか', '小倉 ももか', '広瀬 りこ',
    '桜庭 こはる', '東堂 なのは', '高梨 わかな', '愛沢 みなみ', '長瀬 みずな',
    '彩美 かのん', '凪乃 なの', '森 みつき', '新井 よしの', '和泉 せりな',
    '大槻 ゆい', '如月 ゆき', '小笠原 あず', '菊池 みおん', '村野 ありさ',
    '白雪 ゆめ', '西園 まな', '鹿目 みほ', '白波 りか', '瀬良 あおい',
    '桜葉 りお', '美月 なほ', '月城 ゆあ', '神楽 なつき', '一ノ瀬 ねね',
    '加藤 のあ', '桜井 りおな', '湊 なみ', '結城 かれん', '城咲 えり',
    '成瀬 みりあ', '小泉 ひな', '海老原 さよ', '浅倉 ほの', '絢瀬 もね',
    '胡桃 ゆま',
  ].map(n => [n, null]));

  console.log(`  取得: ${map.size}名`);
  await processShops({
    shopIds: [
      'tokyo_kita_crest_spa_tokyo',
      'tokyo_tachikawa_crest_spa_tokyo',
      'tokyo_kita_akabane_crest',
      'tokyo_musashino_kichijoji_crest',
    ],
    therapistMap: map,
    prefix: 'crestspa',
    referer: 'https://crestspa-tokyo.com/',
  });
}

await sleep(1000);

// ─── 4. GRACE (2店舗) ────────────────────────────────────────────────────────
// JS描画サイト。Claude in Chrome で /therapist から取得 (2026-05-07) 28名
console.log('\n【GRACE】 Chrome取得データ (2026-05-07) 28名...');
{
  const map = new Map([
    '山瀬 いおり', '花芽 さち', '能代 すみれ', '一色 しずく', '森 にき',
    '新田 りえ', '伊波 ひな', '伊波 マユ', '月野 あおい', '水島えみり',
    '南 ちか', '有田 カスミ', '荒木 りな', '風間 じゅん', '冬月なな',
    '岡 マルミ', '福富 れな', '星 しほ', '高梨 みゆう', '葉月 りょう',
    '小栗 あやな', '一条さくら', '池田 モエ', '白石 こはる', '滝河 みおり',
    '石原 あやか', '一ノ瀬 レナ', '二ノ宮 あい',
  ].map(n => [n, null]));

  console.log(`  取得: ${map.size}名`);
  await processShops({
    shopIds: ['tokyo_meguro_nakameguro_grace', 'tokyo_meguro_meguro_grace'],
    therapistMap: map,
    prefix: 'grace',
    referer: 'http://grace-meguro.com/',
  });
}

console.log('\n完了');
