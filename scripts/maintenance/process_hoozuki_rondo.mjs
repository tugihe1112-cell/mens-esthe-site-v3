/**
 * 東京都 Ho・O・Zu・Ki・SPA（蒲田・大森）＋ ロンド（九段下・銀座）セラピスト登録
 * パターン: /images_staff/{id}/{num}.jpg + alt=名前
 * 実行: node scripts/maintenance/process_hoozuki_rondo.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
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
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

async function insertTherapists({ shopIds, nameImagePairs, prefix, referer }) {
  for (const shopId of shopIds) {
    console.log(`\n=== ${shopId} (${nameImagePairs.length}名) ===`);
    if (DRY_RUN) {
      nameImagePairs.slice(0, 8).forEach(([n, u]) => console.log(`  ${n} → ${u ? u.slice(-50) : '(写真なし)'}`));
      if (nameImagePairs.length > 8) console.log(`  ... 他${nameImagePairs.length - 8}名`);
      continue;
    }
    let inserted = 0, skipped = 0, failed = 0;
    for (const [name, imageUrl] of nameImagePairs) {
      const id = `${shopId}_${name}`;
      const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
      if (existing) { process.stdout.write('='); skipped++; continue; }

      let storageUrl = null;
      if (imageUrl && !imageUrl.includes('no_image')) {
        const base = imageUrl.split('/').pop().split('?')[0];
        const stem = base.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 40);
        const ext = (base.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
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

// ─── 1. Ho・O・Zu・Ki・SPA ────────────────────────────────────────────────────
console.log('【Ho・O・Zu・Ki・SPA】 取得中...');
{
  const BASE = 'https://hoozuki-spa.net';
  const html = await fetchHtml(`${BASE}/therapist.php`, BASE + '/');
  const $ = cheerio.load(html);
  const map = new Map();

  $('img[src*="images_staff"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = ($(el).attr('alt') || '').trim();
    if (!alt || alt.length < 2 || alt.length > 12) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;
    if (/ロゴ|logo|icon|banner|写真なし|no.?image/i.test(alt)) return;
    const imageUrl = src.startsWith('http') ? src : `${BASE}${src}`;
    if (!map.has(alt)) map.set(alt, imageUrl);
  });

  console.log(`  取得: ${map.size}名`);
  await insertTherapists({
    shopIds: ['tokyo_ota_kamata_hoozuki', 'tokyo_ota_omori_hoozuki'],
    nameImagePairs: [...map],
    prefix: 'hoozuki',
    referer: BASE + '/',
  });
}

await sleep(1000);

// ─── 2. ロンド（ginza-kiwami.com） ───────────────────────────────────────────
console.log('\n【ロンド】 取得中...');
{
  const BASE = 'https://ginza-kiwami.com';
  const html = await fetchHtml(`${BASE}/staff.php`, BASE + '/');
  const $ = cheerio.load(html);
  const map = new Map();

  $('img[src*="images_staff"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    let alt = ($(el).attr('alt') || '').trim();
    if (!alt) return;
    // 「新人　雛（ひな）」→「雛（ひな）」
    alt = alt.replace(/^新人\s*/, '').trim();
    // 「名前（よみ）」→「名前（よみ）」そのまま登録（括弧ありで統一）
    if (alt.length < 2 || alt.length > 20) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;
    if (/frame|ロゴ|logo|icon|banner/i.test(alt)) return;
    const imageUrl = src.startsWith('http') ? src : `${BASE}${src}`;
    if (!map.has(alt)) map.set(alt, imageUrl);
  });

  console.log(`  取得: ${map.size}名`);
  await insertTherapists({
    shopIds: ['tokyo_chiyoda_kudanshita_rondo', 'tokyo_chuo_ginza_rondo'],
    nameImagePairs: [...map],
    prefix: 'rondo',
    referer: BASE + '/',
  });
}

console.log('\n完了');
