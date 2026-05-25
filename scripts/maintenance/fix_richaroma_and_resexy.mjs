/**
 * RICH AROMA セラピスト画像修正 + RESEXY 新規処理
 * 実行: node scripts/maintenance/fix_richaroma_and_resexy.mjs [--dry-run]
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
    if (error) return imageUrl; // Storage失敗時は直接URL
    return supabase.storage.from('therapist-images').getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

function isValidName(name) {
  if (!name || name.length < 1 || name.length > 15) return false;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return false;
  if (/休業|定休|エラー|エステ|セラピ|メンズ|ノーイメージ|スタッフ|アカウント|バナー|求人|スケジュール|臨時/.test(name)) return false;
  return true;
}

// ============================================================
// 1. RICH AROMA: data-src を使って画像再取得 + schedule_url修正
// ============================================================
console.log('=== 1. RICH AROMA ===');
{
  const SHOP_ID = 'aichi_sakae_rich_aroma';
  const BASE = 'https://richaroma.nagoya';

  // schedule_url修正
  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').update({ schedule_url: `${BASE}/schedule.php` }).eq('id', SHOP_ID);
    console.log(error ? `❌ schedule_url更新失敗` : `✅ schedule_url: ${BASE}/schedule.php`);
  } else {
    console.log(`[DRY] schedule_url: ${BASE}/schedule.php`);
  }

  // セラピスト再取得
  const res = await fetch(`${BASE}/therapist.php`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  $('.item.clearfix').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim().replace(/\s+/g, ' ');

    // "北川(きたがわ)（26歳）" → "北川"
    const nameMatch = text.match(/^([ぁ-んァ-ヾ一-龯々]{1,8})[（(（(]/);
    if (!nameMatch) return;
    const name = nameMatch[1].trim();
    if (!isValidName(name) || seen.has(name)) return;
    seen.add(name);

    // 年齢
    const ageMatch = text.match(/[）)]\s*[（(](\d{2,3})歳?[）)]/);

    // 画像: data-src を優先、wakaba.png は除外
    const imgEl = $el.find('img').first();
    let imgSrc = imgEl.attr('data-src') || imgEl.attr('src') || '';
    if (/wakaba\.png/i.test(imgSrc)) imgSrc = '';
    // "assets/customer/lazy/..." パターン（base64ハッシュ風のlazyは実URLではない）もスキップ
    if (/assets\/customer\/lazy\//i.test(imgSrc)) imgSrc = '';
    const fullSrc = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, BASE).href) : '';

    therapists.push({ name, imgSrc: fullSrc, age: ageMatch ? parseInt(ageMatch[1]) : null });
  });

  console.log(`取得: ${therapists.length}名 (画像あり: ${therapists.filter(t => t.imgSrc).length}名)`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name}(${t.age || '?'}) ${t.imgSrc ? t.imgSrc.slice(0, 60) : '（画像なし）'}`));

  if (!DRY_RUN && therapists.length > 0) {
    // 既存削除
    const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', SHOP_ID);
    if (count > 0) {
      await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
      console.log(`既存${count}名削除`);
    }
    let inserted = 0;
    process.stdout.write('挿入中: ');
    for (const t of therapists) {
      const tid = `${SHOP_ID}_${t.name}`;
      const imgUrl = t.imgSrc ? await uploadImage(t.imgSrc, tid) : null;
      const { error } = await supabase.from('therapists').upsert({
        id: tid, shop_id: SHOP_ID, name: t.name,
        age: t.age || null,
        image_url: imgUrl,
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
// 2. RESEXY: images_staff パターン、alt="氷室 みな"形式
// ============================================================
console.log('\n=== 2. RESEXY ===');
{
  const SHOP_ID = 'aichi_sakae_resexy'; // 実際のIDを確認
  const BASE = 'https://resexy.info';

  // 実際のshop IDを取得
  const { data: shopData } = await supabase.from('shops')
    .select('id,name,website_url')
    .ilike('name', '%RESEXY%')
    .filter('raw_data->>prefecture', 'eq', '愛知県')
    .single();

  if (!shopData) {
    console.log('❌ RESEXY店舗がDBに見つかりません');
    process.exit(1);
  }
  const actualShopId = shopData.id;
  console.log(`shop_id: ${actualShopId}`);

  // schedule_url + shop logo設定
  if (!DRY_RUN) {
    // og:imageがなかったのでトップページのロゴを使う
    const topRes = await fetch(BASE, { headers: ua, signal: AbortSignal.timeout(10000) });
    const topHtml = await topRes.text();
    const $top = cheerio.load(topHtml);
    const logoSrc = $top('img[src*="logo"]').first().attr('src') || '';
    const logoUrl = logoSrc ? (logoSrc.startsWith('http') ? logoSrc : new URL(logoSrc, BASE).href) : '';

    const updates = { schedule_url: `${BASE}/schedule.php` };
    // shop logoはfix_aichi_missing_imagesで設定済みの可能性があるのでimageは更新しない（既にあれば）
    const { data: shopNow } = await supabase.from('shops').select('image_url').eq('id', actualShopId).single();
    if (!shopNow?.image_url && logoUrl) {
      updates.image_url = logoUrl;
    }
    const { error } = await supabase.from('shops').update(updates).eq('id', actualShopId);
    console.log(error ? `❌ shop更新失敗` : `✅ schedule_url: ${BASE}/schedule.php`);
  } else {
    console.log(`[DRY] schedule_url: ${BASE}/schedule.php`);
  }

  // /staff.php からセラピスト取得
  const res = await fetch(`${BASE}/staff.php`, { headers: ua, signal: AbortSignal.timeout(12000) });
  const html = await res.text();
  const $ = cheerio.load(html);

  const therapists = [];
  const seen = new Set();

  $('img[src*="images_staff"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';

    // alt="氷室 みな" → 名前として使用（スペース除去または保持）
    // スペースを保持: "氷室 みな" (姓+名)
    const name = alt.trim().replace(/\s+/g, ' ');
    if (!name || name.length < 1) return;
    // ノイズ除外
    if (/セラピスト|スタッフ|ロゴ|バナー|画像|エステ|new|NEW/i.test(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    if (seen.has(name)) return;
    seen.add(name);

    const fullSrc = src.startsWith('http') ? src : new URL(src, BASE).href;
    therapists.push({ name, imgSrc: fullSrc });
  });

  console.log(`取得: ${therapists.length}名`);
  therapists.slice(0, 5).forEach(t => console.log(`  ${t.name} | ${t.imgSrc.slice(0, 60)}`));
  if (therapists.length > 5) console.log(`  ...他${therapists.length - 5}名`);

  if (!DRY_RUN && therapists.length > 0) {
    const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', actualShopId);
    if (count > 0) {
      await supabase.from('therapists').delete().eq('shop_id', actualShopId);
      console.log(`既存${count}名削除`);
    }
    let inserted = 0;
    process.stdout.write('挿入中: ');
    for (const t of therapists) {
      const tid = `${actualShopId}_${t.name.replace(/\s/g, '_')}`;
      const imgUrl = await uploadImage(t.imgSrc, tid);
      const { error } = await supabase.from('therapists').upsert({
        id: tid, shop_id: actualShopId, name: t.name,
        image_url: imgUrl,
      });
      if (!error) { inserted++; process.stdout.write('.'); }
      else process.stdout.write('x');
      await sleep(80);
    }
    console.log(`\n✅ ${inserted}/${therapists.length}名挿入`);
  }
}

console.log('\n完了');
