/**
 * Number9のノイズ除去 + milk reposの名前クリーンアップ
 * 実行: node scripts/maintenance/fix_number9_milkrepos_names.mjs [--dry-run]
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

// ============================================================
// 1. Number9 — ノイズ除去して再取得
// ============================================================
console.log('=== 1. Number9 ノイズ除去 ===');
{
  const BASE = 'https://nagoya-number9.com';
  const SHOP_ID = 'aichi_kanayama_number9';

  const res = await fetch(`${BASE}/cast_list/`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  // ノイズフィルター: 日本語名前のみ（「」で始まるものや記号を含む長い文字列を除外）
  const isNoiseName = (name) => {
    if (name.startsWith('「') || name.startsWith('【')) return true;
    if (name.length > 10) return true;
    if (/day|Day|DAY|！|キャンペーン|イベント|割引|特典|限定/.test(name)) return true;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return true;
    return false;
  };

  $('img[alt*="ナンバーナイン】"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    const match = alt.match(/】\s*(.+)$/);
    if (!match) return;
    const name = match[1].trim();
    if (!name || seen.has(name) || isNoiseName(name)) return;
    seen.add(name);
    const fullSrc = src.startsWith('http') ? src : new URL(src, BASE).href;
    const origSrc = fullSrc.replace(/-\d+x\d+(\.\w+)$/, '$1');
    therapists.push({ name, imgSrc: origSrc });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  if (DRY_RUN) {
    console.log('[DRY] 完了');
  } else {
    const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID);
    if (count > 0) {
      await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
      console.log(`既存${count}名削除`);
    }
    let inserted = 0;
    process.stdout.write('挿入中: ');
    for (const t of therapists) {
      const tid = `${SHOP_ID}_${t.name}`;
      const imgUrl = await uploadImage(t.imgSrc, tid);
      const { error } = await supabase.from('therapists').upsert({
        id: tid, shop_id: SHOP_ID, name: t.name, image_url: imgUrl,
      });
      if (!error) { inserted++; process.stdout.write('.'); }
      else process.stdout.write('x');
      await sleep(80);
    }
    console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
  }
}

await sleep(500);

// ============================================================
// 2. milk repos — 「 セラピスト写真」を名前から除去して再取得
// ============================================================
console.log('\n=== 2. milk repos 名前クリーンアップ ===');
{
  const BASE = 'https://milkrepos.com';
  const SHOP_ID = 'aichi_meieki_milk_repos';

  const res = await fetch(`${BASE}/staff.php`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  $('img[src*="images_staff"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';

    if (/logo|banner|icon|求人|LINE|recruit/i.test(alt + src)) return;

    // "天音 セラピスト写真" → "天音"
    let name = alt.trim();
    name = name.replace(/\s*セラピスト写真.*$/, '').trim();
    name = name.replace(/\s*スタッフ写真.*$/, '').trim();
    // その他のゴミも除去
    if (name.includes('♡')) name = name.split('♡')[0].trim();
    if (name.includes('★')) name = name.split('★')[0].trim();
    name = name.replace(/【.*?】/g, '').replace(/\(.*?\)/g, '').trim();

    if (!name || name.length < 1 || seen.has(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seen.add(name);

    const fullSrc = src.startsWith('http') ? src : new URL(src, BASE).href;
    therapists.push({ name, imgSrc: fullSrc });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 8).forEach(t => console.log(`  ${t.name}`));
  if (therapists.length > 8) console.log(`  ...他${therapists.length - 8}名`);

  if (DRY_RUN) {
    console.log('[DRY] 完了');
  } else {
    const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID);
    if (count > 0) {
      await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
      console.log(`既存${count}名削除`);
    }
    let inserted = 0;
    process.stdout.write('挿入中: ');
    for (const t of therapists) {
      const tid = `${SHOP_ID}_${t.name}`;
      const imgUrl = await uploadImage(t.imgSrc, tid);
      const { error } = await supabase.from('therapists').upsert({
        id: tid, shop_id: SHOP_ID, name: t.name, image_url: imgUrl,
      });
      if (!error) { inserted++; process.stdout.write('.'); }
      else process.stdout.write('x');
      await sleep(80);
    }
    console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
  }
}

console.log('\n完了');
