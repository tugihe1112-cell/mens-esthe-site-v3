/**
 * Request (リクエスト) セラピスト再取得・修正版
 * 実行: node scripts/maintenance/fix_request_therapists.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'fukuoka_hakata_request';
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

const res = await fetch('https://request-hakata.com/therapist/', { headers: ua, signal: AbortSignal.timeout(12000) });
const html = await res.text();
const $ = cheerio.load(html);

const therapists = [];
const seenSrc = new Set();
const seenNames = new Set();

$('img[src*="cast"]').each((_, el) => {
  const src = $(el).attr('src') || '';
  if (seenSrc.has(src)) return; // 同一画像の重複スキップ
  seenSrc.add(src);

  const parentText = $(el).closest('li, div, article, tr, section').text().trim().replace(/\s+/g, ' ');

  // 名前はDiamond/Premium/Premiuｍの直前にある日本語
  // パターン: "ゆあ Diamond..." or "11:00 ～ 27:00 みみ Premium..."
  const nameMatch = parentText.match(/([ぁ-んァ-ヾ一-龯]{2,8})\s*(?:Diamond|Premium|Premiuｍ|GOLD|Silver|gold|silver)/);
  if (!nameMatch) return;

  const name = nameMatch[1].trim();
  if (!name || seenNames.has(name)) return;
  seenNames.add(name);

  therapists.push({ name, imgSrc: src });
});

console.log(`取得: ${therapists.length}名`);
therapists.slice(0, 8).forEach(t => console.log(`  ${t.name} | ...${t.imgSrc.slice(-40)}`));
if (therapists.length > 8) console.log(`  ...他${therapists.length - 8}名`);

if (DRY_RUN) {
  console.log('[DRY] 完了');
  process.exit(0);
}

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
console.log('完了');
