/**
 * Marigold + Mrs Crystal 処理
 * 実行: node scripts/maintenance/process_marigold_mrscrystal.mjs [--dry-run]
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
// 1. Marigold
// ============================================================
console.log('=== 1. Marigold ===');
{
  const BASE = 'https://mari-gold.biz';

  // shop_id取得
  const { data: shopData } = await supabase.from('shops')
    .select('id,name,schedule_url')
    .ilike('name', '%Marigold%')
    .filter('raw_data->>prefecture', 'eq', '愛知県')
    .single();
  const SHOP_ID = shopData?.id;
  console.log(`shop_id: ${SHOP_ID}`);

  // ノイズaltフィルター
  const isNoiseAlt = (alt) => {
    if (!alt || alt.length === 0) return true;
    if (!/[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(alt)) return true;
    if (/割引|割$|テンプレ|求人|LINE|Twitter|icon|logo|ロゴ|banner|バナー|お昼|フリー|新人割|アンケ|水曜|キャンペ|イベント|お得|限定|特典|facebook|instagram|X(旧|公式)/i.test(alt)) return true;
    return false;
  };

  // /girl ページからセラピスト取得
  const res = await fetch(`${BASE}/girl`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  $('img[src*="/photos/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (isNoiseAlt(alt)) return;

    // alt = "遠藤まひな" などそのまま名前として使用
    const name = alt.trim();
    if (!name || seen.has(name)) return;
    seen.add(name);

    // URLからタイムスタンプクエリを除去
    const cleanSrc = src.replace(/\?.*$/, '');
    const fullSrc = cleanSrc.startsWith('http') ? cleanSrc : new URL(cleanSrc, BASE).href;
    therapists.push({ name, imgSrc: fullSrc });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgSrc.slice(0, 60)}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  // schedule_url設定（既存確認）
  if (!shopData?.schedule_url) {
    if (!DRY_RUN) {
      await supabase.from('shops').update({ schedule_url: `${BASE}/schedule` }).eq('id', SHOP_ID);
      console.log(`✅ schedule_url: ${BASE}/schedule`);
    } else {
      console.log(`[DRY] schedule_url: ${BASE}/schedule`);
    }
  } else {
    console.log(`✅ schedule_url 設定済み`);
  }

  if (!DRY_RUN && therapists.length > 0) {
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
// 2. Mrs Crystal
// ============================================================
console.log('\n=== 2. Mrs Crystal ===');
{
  const BASE = 'http://www.mrs-crystal.com';

  // shop_id取得
  const { data: shopData } = await supabase.from('shops')
    .select('id,name,image_url,schedule_url')
    .ilike('name', '%Crystal%')
    .filter('raw_data->>prefecture', 'eq', '愛知県')
    .single();
  const SHOP_ID = shopData?.id;
  console.log(`shop_id: ${SHOP_ID}`);

  // shop画像 + schedule_url設定
  if (!DRY_RUN) {
    const updates = {};
    if (!shopData?.schedule_url) updates.schedule_url = `${BASE}/schedule/`;
    // ロゴ画像をホームページから取得
    if (!shopData?.image_url) {
      try {
        const topRes = await fetch(BASE, { headers: ua, signal: AbortSignal.timeout(10000) });
        const topHtml = await topRes.text();
        const $top = cheerio.load(topHtml);
        let logoUrl = '';
        $top('img').each((_, el) => {
          if (logoUrl) return;
          const src = $top(el).attr('src') || '';
          const alt = $top(el).attr('alt') || '';
          if (/logo|Logo|ロゴ|crystal/i.test(src + alt) && !/spacer/i.test(src)) {
            logoUrl = src.startsWith('http') ? src : new URL(src, BASE).href;
          }
        });
        if (!logoUrl) {
          // 最初の非スペーサー画像
          $top('img').each((_, el) => {
            if (logoUrl) return;
            const src = $top(el).attr('src') || '';
            if (src && !/spacer/i.test(src) && /\.(jpg|jpeg|png|webp)/i.test(src)) {
              logoUrl = src.startsWith('http') ? src : new URL(src, BASE).href;
            }
          });
        }
        if (logoUrl) updates.image_url = logoUrl;
      } catch {}
    }
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('shops').update(updates).eq('id', SHOP_ID);
      if (!error) {
        if (updates.schedule_url) console.log(`✅ schedule_url: ${updates.schedule_url}`);
        if (updates.image_url) console.log(`✅ shop画像: ${updates.image_url.slice(0, 60)}`);
      }
    }
  } else {
    console.log(`[DRY] schedule_url: ${BASE}/schedule/`);
  }

  // /staff/ からalt属性で名前取得（画像なし）
  const res = await fetch(`${BASE}/staff/`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  $('img[alt*="さんの写真"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    // "優香(新人)さんの写真" → "優香"
    // "響 ひびき(新人)さんの写真" → "響 ひびき"
    // "舞(新人)(4(月)~7(木)一宮)さんの写真" → "舞"（ネスト括弧対応）
    // "麗香さんの写真" → "麗香"
    let name = alt.replace(/さんの写真$/, '');

    // ネストされた括弧も含め、括弧内を繰り返し除去
    for (let i = 0; i < 5; i++) {
      name = name.replace(/\([^()]*\)/g, '');
    }
    name = name.trim();

    if (!name || name.length < 1 || seen.has(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seen.add(name);
    therapists.push({ name, imgSrc: null });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 8).forEach(t => console.log(`  ${t.name}`));
  if (therapists.length > 8) console.log(`  ...他${therapists.length - 8}名`);

  if (!DRY_RUN && therapists.length > 0) {
    const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID);
    if (count > 0) {
      await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
      console.log(`既存${count}名削除`);
    }
    let inserted = 0;
    process.stdout.write('挿入中: ');
    for (const t of therapists) {
      const tid = `${SHOP_ID}_${t.name}`;
      const { error } = await supabase.from('therapists').upsert({
        id: tid, shop_id: SHOP_ID, name: t.name, image_url: null,
      });
      if (!error) { inserted++; process.stdout.write('.'); }
      else process.stdout.write('x');
      await sleep(50);
    }
    console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
  }
}

console.log('\n完了');
