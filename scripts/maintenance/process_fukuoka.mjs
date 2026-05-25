/**
 * 福岡6店舗 処理スクリプト
 *   - 全店舗: website_url / schedule_url / shop画像 を設定
 *   - Lion Heart & Request: セラピスト取得・挿入
 * 実行: node scripts/maintenance/process_fukuoka.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function uploadImage(imageUrl, id) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `${id.replace(/[^\w-]/g, '_')}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return imageUrl;
    return supabase.storage.from('therapist-images').getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

// DBの福岡店舗取得
const { data: dbShops } = await supabase.from('shops')
  .select('id, name, website_url, schedule_url, image_url')
  .filter('raw_data->>prefecture', 'eq', '福岡県')
  .order('id');

// 店舗情報マスター（men-esthe.jpから収集済み）
const shopMaster = [
  {
    match: 'マザーズ',
    website_url: 'https://mothers-hakata.com',
    schedule_url: null,
    image_url: 'https://men-esthe.jp/contents/salon/db698e9fa8a5db5fa3dd9a76252466fc.jpg',
  },
  {
    match: 'フェリーク',
    website_url: 'https://aroma-feerique.com',
    schedule_url: null,
    image_url: 'https://men-esthe.jp/contents/salon/f05d9dfae87f67bc4c4dd5010e8ef66b.jpg',
  },
  {
    match: '博多人妻',
    website_url: 'https://hakatahitozuma.com',
    schedule_url: null,
    image_url: 'https://men-esthe.jp/contents/salon/d2f046c67e51dcb3104250f9ab656bc6.jpg',
  },
  {
    match: 'ライオンハート',
    website_url: 'http://lion-heart.pwchp.com',
    schedule_url: 'http://lion-heart.pwchp.com/schedule.php',
    image_url: 'https://men-esthe.jp/contents/salon/5ff1d10dca8b9c830c6d583cd0f9a458.jpg',
  },
  {
    match: 'リクエスト',
    website_url: 'https://request-hakata.com',
    schedule_url: 'https://request-hakata.com/schedule/',
    image_url: 'https://men-esthe.jp/contents/salon/eb26621e0227eaa61fc56ec1350e2635.jpg',
  },
  {
    match: 'ピンキー',
    website_url: 'http://www.pinky-grazie.com',
    schedule_url: null,
    image_url: 'https://men-esthe.jp/contents/salon/aaa3d808ec9a64a1adff684a26cb1dd0.jpg',
  },
];

// ============================================================
// 1. 全店舗: shop情報更新
// ============================================================
console.log('=== 1. 全店舗 shop情報更新 ===');
const seen = new Set();
for (const db of dbShops) {
  if (seen.has(db.id)) { console.log(`  スキップ（重複）: ${db.name}`); continue; }
  seen.add(db.id);

  const master = shopMaster.find(m => db.name.includes(m.match));
  if (!master) { console.log(`  マスター未定義: ${db.name}`); continue; }

  const updates = {};
  if (!db.website_url && master.website_url) updates.website_url = master.website_url;
  if (!db.schedule_url && master.schedule_url) updates.schedule_url = master.schedule_url;
  if (!db.image_url && master.image_url) updates.image_url = master.image_url;

  if (Object.keys(updates).length === 0) { console.log(`  設定済み: ${db.name}`); continue; }

  if (DRY_RUN) {
    console.log(`  [DRY] ${db.name}: ${JSON.stringify(updates)}`);
  } else {
    const { error } = await supabase.from('shops').update(updates).eq('id', db.id);
    if (!error) console.log(`  ✅ ${db.name}: ${Object.keys(updates).join(', ')} 更新`);
    else console.log(`  ❌ ${db.name}: ${error.message}`);
  }
  await sleep(100);
}

// ============================================================
// 2. Lion Heart セラピスト取得
// ============================================================
console.log('\n=== 2. Lion Heart セラピスト取得 ===');
{
  const db = dbShops.find(s => s.name.includes('ライオンハート'));
  const SHOP_ID = db?.id;
  console.log(`shop_id: ${SHOP_ID}`);

  const res = await fetch('http://lion-heart.pwchp.com/therapist.php', { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seenNames = new Set();

  $('img[src*="images_staff"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';

    // 【NEW】【GOLD】などのランク表記を除去
    let name = alt.replace(/【[^】]*】/g, '').trim();
    // 姓名の間のスペースは保持
    name = name.replace(/\s+/g, ' ').trim();

    if (!name || seenNames.has(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    if (name.length > 15) return;
    seenNames.add(name);

    const fullSrc = src.startsWith('http') ? src : `https://pwchp.com${src}`;
    therapists.push({ name, imgSrc: fullSrc });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgSrc.slice(0, 60)}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  if (!DRY_RUN && therapists.length > 0) {
    const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID);
    if (count > 0) { await supabase.from('therapists').delete().eq('shop_id', SHOP_ID); console.log(`既存${count}名削除`); }
    let inserted = 0;
    process.stdout.write('挿入中: ');
    for (const t of therapists) {
      const tid = `${SHOP_ID}_${t.name}`;
      const imgUrl = await uploadImage(t.imgSrc, tid);
      const { error } = await supabase.from('therapists').upsert({ id: tid, shop_id: SHOP_ID, name: t.name, image_url: imgUrl });
      if (!error) { inserted++; process.stdout.write('.'); } else process.stdout.write('x');
      await sleep(80);
    }
    console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
  }
}

await sleep(500);

// ============================================================
// 3. Request セラピスト取得
// ============================================================
console.log('\n=== 3. Request セラピスト取得 ===');
{
  const db = dbShops.find(s => s.name.includes('リクエスト'));
  const SHOP_ID = db?.id;
  console.log(`shop_id: ${SHOP_ID}`);

  const res = await fetch('https://request-hakata.com/therapist/', { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seenNames = new Set();
  const seenImgs = new Set();

  $('img[src*="cast"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (seenImgs.has(src)) return; // 重複画像スキップ
    seenImgs.add(src);

    // 親テキストから名前抽出: "ゆあ Diamond(22) T160..." → "ゆあ"
    const parentText = $(el).closest('li, div, article, tr').text().trim().replace(/\s+/g, ' ');
    const nameMatch = parentText.match(/^([ぁ-んァ-ヾ一-龯a-zA-Z]{1,10})\s/);
    if (!nameMatch) return;
    const name = nameMatch[1].trim();

    if (!name || seenNames.has(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seenNames.add(name);

    therapists.push({ name, imgSrc: src });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgSrc.slice(0, 60)}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  if (!DRY_RUN && therapists.length > 0) {
    const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID);
    if (count > 0) { await supabase.from('therapists').delete().eq('shop_id', SHOP_ID); console.log(`既存${count}名削除`); }
    let inserted = 0;
    process.stdout.write('挿入中: ');
    for (const t of therapists) {
      const tid = `${SHOP_ID}_${t.name}`;
      const imgUrl = await uploadImage(t.imgSrc, tid);
      const { error } = await supabase.from('therapists').upsert({ id: tid, shop_id: SHOP_ID, name: t.name, image_url: imgUrl });
      if (!error) { inserted++; process.stdout.write('.'); } else process.stdout.write('x');
      await sleep(80);
    }
    console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
  }
}

console.log('\n完了');
