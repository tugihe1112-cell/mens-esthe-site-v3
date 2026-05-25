/**
 * 京都ショップ画像修正
 * - Pure White: Storage公開URLをimage_urlに設定
 * - ゆりかご 京都: OGP画像を取得してアップロード
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const supabase = createClient(SUPABASE_URL, getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

// 現在のDB確認
const { data: shops } = await supabase.from('shops').select('id,name,image_url')
  .in('id', ['kyoto_senbon_sanjo_pure_white', 'shiga_otsu_station_yurikago']);
console.log('現在のimage_url:');
for (const s of (shops || [])) console.log(`  ${s.name}: ${s.image_url || 'null'}`);

// ============================================================
// 1. Pure White
// ============================================================
console.log('\n=== Pure White ===');
const PW_ID = 'kyoto_senbon_sanjo_pure_white';

// Storage公開URLを構築（すでにアップロード済み想定）
const pwStorageUrl = `${SUPABASE_URL}/storage/v1/object/public/shop-logos/${PW_ID}.png`;

// URLが実際に存在するか確認
const pwCheck = await fetch(pwStorageUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) }).catch(() => null);
console.log(`  Storage URL: ${pwStorageUrl}`);
console.log(`  Status: ${pwCheck?.status}`);

if (pwCheck?.ok) {
  const { error } = await supabase.from('shops').update({ image_url: pwStorageUrl }).eq('id', PW_ID);
  console.log(error ? `  ❌ DB更新失敗: ${error.message}` : `  ✅ image_url設定完了`);
} else {
  // Storageに存在しない場合は再アップロード
  console.log('  Storageに存在しない → 再アップロード中...');
  const IMG_URL = 'https://purewhite-aroma.com/upload/back_image/12.png';
  const res = await fetch(IMG_URL, { headers: ua, signal: AbortSignal.timeout(10000) }).catch(() => null);
  if (!res?.ok) {
    console.log(`  ❌ 画像取得失敗: ${IMG_URL}`);
  } else {
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) { console.log('  ❌ 画像ではない'); }
    else {
      const buf = Buffer.from(await res.arrayBuffer());
      const { error: upErr } = await supabase.storage.from('shop-logos')
        .upload(`${PW_ID}.png`, buf, { contentType: 'image/png', upsert: true });
      if (upErr) { console.log(`  ❌ アップロード失敗: ${upErr.message}`); }
      else {
        const publicUrl = supabase.storage.from('shop-logos').getPublicUrl(`${PW_ID}.png`).data.publicUrl;
        const { error } = await supabase.from('shops').update({ image_url: publicUrl }).eq('id', PW_ID);
        console.log(error ? `  ❌ DB更新失敗` : `  ✅ 再アップロード+DB更新: ${publicUrl}`);
      }
    }
  }
}

// ============================================================
// 2. ゆりかご 京都
// ============================================================
console.log('\n=== ゆりかご 京都 ===');
const YK_ID = 'shiga_otsu_station_yurikago';
const YK_BASE = 'https://yurikago-kyoto.com';

// OGP画像取得
const ykTopRes = await fetch(YK_BASE, { headers: ua, signal: AbortSignal.timeout(10000) }).catch(() => null);
if (!ykTopRes?.ok) {
  console.log(`  ❌ トップページ取得失敗: status=${ykTopRes?.status}`);
} else {
  const ykTopHtml = await ykTopRes.text();
  const $yk = cheerio.load(ykTopHtml);
  const ogImg = $yk('meta[property="og:image"]').attr('content');
  console.log(`  og:image: ${ogImg}`);

  if (!ogImg) {
    // OGPがない場合、最初のwp-content画像を探す
    let fallbackImg = null;
    $yk('img').each((_, el) => {
      const src = $yk(el).attr('src') || '';
      if (!fallbackImg && src.includes('wp-content') && src.match(/\.(jpg|jpeg|png|webp)/i)) {
        fallbackImg = src.startsWith('http') ? src : new URL(src, YK_BASE).href;
      }
    });
    console.log(`  fallback img: ${fallbackImg}`);
    if (fallbackImg) {
      const { error } = await supabase.from('shops').update({ image_url: fallbackImg }).eq('id', YK_ID);
      console.log(error ? `  ❌ DB更新失敗` : `  ✅ fallback image設定: ${fallbackImg}`);
    } else {
      console.log('  ❌ 画像が見つからない');
    }
  } else {
    const fullOgp = ogImg.startsWith('http') ? ogImg : new URL(ogImg, YK_BASE).href;
    const imgRes = await fetch(fullOgp, { headers: ua, signal: AbortSignal.timeout(10000) }).catch(() => null);
    if (!imgRes?.ok) {
      console.log(`  ❌ OGP画像取得失敗`);
      // Storage URLをDBに直接セット
      const { error } = await supabase.from('shops').update({ image_url: fullOgp }).eq('id', YK_ID);
      console.log(error ? `  ❌ DB更新失敗` : `  ✅ 直接URL設定: ${fullOgp}`);
    } else {
      const ct = imgRes.headers.get('content-type') || '';
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (!ct.startsWith('image/') || buf.length < 512) {
        console.log(`  ❌ 無効な画像 (ct=${ct}, size=${buf.length})`);
      } else {
        const ext = (fullOgp.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
        const safeExt = ext === 'jpeg' ? 'jpg' : ext;
        const { error: upErr } = await supabase.storage.from('shop-logos')
          .upload(`${YK_ID}.${safeExt}`, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
        if (upErr) {
          console.log(`  ⚠️ Storage失敗: ${upErr.message} → 直接URL設定`);
          const { error } = await supabase.from('shops').update({ image_url: fullOgp }).eq('id', YK_ID);
          console.log(error ? `  ❌ DB更新失敗` : `  ✅ 直接URL設定: ${fullOgp}`);
        } else {
          const publicUrl = supabase.storage.from('shop-logos').getPublicUrl(`${YK_ID}.${safeExt}`).data.publicUrl;
          const { error } = await supabase.from('shops').update({ image_url: publicUrl }).eq('id', YK_ID);
          console.log(error ? `  ❌ DB更新失敗` : `  ✅ アップロード+DB更新: ${publicUrl}`);
        }
      }
    }
  }
}

console.log('\n完了');
