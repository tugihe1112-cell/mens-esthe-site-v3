/**
 * Feerique + ピンキーグラッツェ セラピスト挿入
 * 実行: node scripts/maintenance/process_feerique_pinky.mjs [--dry-run]
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

async function insertTherapists(shopId, therapists) {
  const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shopId);
  if (count > 0) { await supabase.from('therapists').delete().eq('shop_id', shopId); console.log(`既存${count}名削除`); }
  let inserted = 0;
  process.stdout.write('挿入中: ');
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const imgUrl = t.imgSrc ? await uploadImage(t.imgSrc, tid) : null;
    const { error } = await supabase.from('therapists').upsert({ id: tid, shop_id: shopId, name: t.name, image_url: imgUrl });
    if (!error) { inserted++; process.stdout.write('.'); } else process.stdout.write('x');
    await sleep(80);
  }
  console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
}

// ============================================================
// 1. Feerique
// ============================================================
console.log('=== 1. Feerique (フェリーク) ===');
{
  const BASE = 'https://aroma-feerique.com';
  const { data: shopData } = await supabase.from('shops')
    .select('id, schedule_url')
    .ilike('name', '%フェリーク%')
    .filter('raw_data->>prefecture', 'eq', '福岡県')
    .single();
  const SHOP_ID = shopData?.id;
  console.log(`shop_id: ${SHOP_ID}`);

  // schedule_url更新
  if (!shopData?.schedule_url) {
    const scheduleUrl = `${BASE}/schedule`;
    if (!DRY_RUN) {
      await supabase.from('shops').update({ schedule_url: scheduleUrl }).eq('id', SHOP_ID);
      console.log(`✅ schedule_url: ${scheduleUrl}`);
    } else {
      console.log(`[DRY] schedule_url: ${scheduleUrl}`);
    }
  }

  const res = await fetch(`${BASE}/therapist`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  // alt="♡あむ♡" → ♡を除去して名前取得
  $('img[src*="/photos/"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    if (/logo|banner|icon|noimage/i.test(src)) return;

    let name = alt.replace(/♡/g, '').replace(/[💛🖤❤️♥]/g, '').trim();
    name = name.replace(/\s+/g, ' ').trim();

    if (!name || seen.has(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    if (name.length > 12) return;
    seen.add(name);

    const fullSrc = src.startsWith('http') ? src : `${BASE}${src}`;
    therapists.push({ name, imgSrc: fullSrc });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgSrc.slice(0, 60)}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  if (!DRY_RUN && therapists.length > 0) await insertTherapists(SHOP_ID, therapists);
  else if (DRY_RUN) console.log('[DRY] 完了');
}

await sleep(500);

// ============================================================
// 2. ピンキーグラッツェ
// ============================================================
console.log('\n=== 2. ピンキーグラッツェ ===');
{
  const BASE = 'http://www.pinky-grazie.com';
  const { data: shopData } = await supabase.from('shops')
    .select('id, schedule_url')
    .ilike('name', '%ピンキー%')
    .filter('raw_data->>prefecture', 'eq', '福岡県')
    .single();
  const SHOP_ID = shopData?.id;
  console.log(`shop_id: ${SHOP_ID}`);

  // schedule_url更新
  if (!shopData?.schedule_url) {
    const scheduleUrl = `${BASE}/schedule/`;
    if (!DRY_RUN) {
      await supabase.from('shops').update({ schedule_url: scheduleUrl }).eq('id', SHOP_ID);
      console.log(`✅ schedule_url: ${scheduleUrl}`);
    } else {
      console.log(`[DRY] schedule_url: ${scheduleUrl}`);
    }
  }

  const res = await fetch(`${BASE}/staff/`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  // img[alt*="さんの写真"] + background-image（Mrs Crystalと同パターン）
  $('img[alt*="さんの写真"], img[alt*="さん"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const style = $(el).attr('style') || '';

    // 名前抽出: 絵文字・ランク名・「さんの写真」を除去
    let name = alt
      .replace(/さんの写真.*$/, '')
      .replace(/さん$/, '')
      // 絵文字除去
      .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
      .replace(/[💛🖤❤️♥💕💗]/g, '')
      // ランク名除去
      .replace(/レジェンドセラピスト|プレミアセラピスト|セラピスト|プレミア|レジェンド/g, '')
      // 括弧内（デビュー日等）除去
      .replace(/\([^()]*\)/g, '')
      .replace(/（[^（）]*）/g, '')
      .trim();

    if (!name || seen.has(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    if (name.length > 15) return;
    seen.add(name);

    // background-imageからURL抽出
    const imgPath = style.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || '';
    const imgUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `${BASE}${imgPath}`) : null;

    therapists.push({ name, imgSrc: imgUrl });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgSrc?.slice(0, 60) ?? '（画像なし）'}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  if (!DRY_RUN && therapists.length > 0) await insertTherapists(SHOP_ID, therapists);
  else if (DRY_RUN) console.log('[DRY] 完了');
}

console.log('\n完了');
