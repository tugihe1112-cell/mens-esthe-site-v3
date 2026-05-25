/**
 * Mrs Crystal セラピスト写真を background-image から取得してDBに反映
 * 実行: node scripts/maintenance/fix_mrscrystal_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BASE = 'http://www.mrs-crystal.com';
const SHOP_ID = 'aichi_tsurumai_mrs_crystal';
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `${therapistId.replace(/[^\w-]/g, '_')}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return imageUrl;
    return supabase.storage.from('therapist-images').getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

// サイト取得
const res = await fetch(`${BASE}/staff/`, { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

const therapists = [];
const seen = new Set();

// img[alt*="さんの写真"] かつ style に background-image を持つ要素
$('img[alt*="さんの写真"]').each((_, el) => {
  const alt = $(el).attr('alt') || '';
  const style = $(el).attr('style') || '';

  // 名前抽出（括弧を繰り返し除去）
  let name = alt.replace(/さんの写真$/, '');
  for (let i = 0; i < 5; i++) name = name.replace(/\([^()]*\)/g, '');
  name = name.trim();

  if (!name || seen.has(name)) return;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
  seen.add(name);

  // background-image URL 抽出
  const imgPath = style.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || '';
  const imgUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `${BASE}${imgPath}`) : null;

  therapists.push({ name, imgUrl });
});

console.log(`取得: ${therapists.length}名`);
therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgUrl}`));
if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

if (DRY_RUN) {
  console.log('\n[DRY] 完了');
  process.exit(0);
}

// DB更新（名前でマッチして image_url だけ更新）
let updated = 0, failed = 0;
process.stdout.write('更新中: ');
for (const t of therapists) {
  const tid = `${SHOP_ID}_${t.name}`;
  const imgUrl = t.imgUrl ? await uploadImage(t.imgUrl, tid) : null;

  const { error } = await supabase.from('therapists')
    .update({ image_url: imgUrl })
    .eq('id', tid);

  if (!error) { updated++; process.stdout.write('.'); }
  else { failed++; process.stdout.write('x'); }
  await sleep(80);
}
console.log(`\n✅ ${updated}名更新 / ❌ ${failed}名失敗`);
console.log('完了');
