/**
 * テアワセ 画像失敗分の修正 + SALON BLANCA セラピスト数確認
 * 実行: node scripts/maintenance/fix_teawase_images.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const BUCKET = 'therapist-images';
const SHOP_ID = 'tokyo_minato_hamamatsucho_teawase';

// 画像URLをSHA1でハッシュ化してASCIIファイル名に変換
function safeStoragePath(prefix, imageUrl) {
  const hash = crypto.createHash('sha1').update(imageUrl).digest('hex').slice(0, 12);
  const ext = imageUrl.split('?')[0].split('.').pop().toLowerCase().replace(/[^a-z]/, 'jpg');
  return `${prefix}_${hash}.${ext}`;
}

async function uploadImage(storagePath, imageUrl, referer) {
  const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: storagePath });
  if (existing?.some(f => f.name === storagePath)) {
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return publicUrl;
  }
  const res = await fetch(imageUrl, { headers: { Referer: referer } });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
    contentType: res.headers.get('content-type') || 'image/jpeg',
    upsert: true,
  });
  if (error) { console.error(`  upload error: ${error.message}`); return null; }
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}

async function getTeawaseImage(slug) {
  const url = `https://teawase.tokyo/therapist/${encodeURIComponent(slug)}/`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  return $('img[src*="wp-content/uploads"]').not('[src*="logo"]').not('[src*="favicon"]').first().attr('src') || null;
}

const FAILED = [
  { name: '白坂すみれ', slug: '白坂すみれ' },
  { name: '桐生 玲',   slug: '桐生-玲' },
  { name: '山崎えま',  slug: '山崎えま' },
  { name: '桃田つばさ', slug: '桃田つばさ' },
];

async function main() {
  console.log('テアワセ 失敗分 修正\n');

  for (const t of FAILED) {
    process.stdout.write(`${t.name} 画像取得中...`);
    const imgUrl = await getTeawaseImage(t.slug);
    if (!imgUrl) { console.log(' 画像URL取得失敗（スキップ）'); continue; }

    const storagePath = safeStoragePath('teawase', imgUrl);
    const storedUrl = await uploadImage(storagePath, imgUrl, 'https://teawase.tokyo/');
    process.stdout.write(storedUrl ? ' OK\n' : ' upload失敗\n');

    if (storedUrl) {
      const { error } = await supabase.from('therapists')
        .update({ image_url: storedUrl })
        .eq('id', `${SHOP_ID}_${t.name}`);
      if (error) console.error(`  DB更新失敗: ${error.message}`);
      else console.log(`  → ${t.name} 更新完了`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // SALON BLANCAの状況確認
  console.log('\n── SALON BLANCA セラピスト数 ──');
  const { data: shops } = await supabase.from('shops').select('id,name').ilike('name', '%BLANCA%').not('name', 'ilike', '%Aroma%');
  for (const shop of shops || []) {
    const { count } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', shop.id);
    console.log(`${count}名\t${shop.name}\t${shop.id}`);
  }
}

main().catch(console.error);
