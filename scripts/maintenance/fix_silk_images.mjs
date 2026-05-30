/**
 * Silk (シルク) セラピスト画像をSupabase Storageに移行
 * http:// → Supabase Storage URL に変換
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim();

const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));
const BUCKET = 'therapist-images';
const DRY_RUN = process.argv.includes('--dry-run');

async function uploadImage(imageUrl) {
  const res = await fetch(imageUrl, {
    headers: {
      'Referer': 'http://www.ms-silk.tokyo/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  // URLのファイル名をそのまま使う（衝突防止）
  const baseName = imageUrl.split('/').pop().toLowerCase();
  const storageFileName = `silk_${baseName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storageFileName, buffer, {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: true,
  });
  if (error) throw new Error(`upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storageFileName);
  return publicUrl;
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== 本実行 ===');

  const { data: all, error } = await supabase
    .from('therapists')
    .select('id, name, image_url')
    .ilike('shop_id', '%silk%');

  if (error) { console.error(error); return; }
  const therapists = all.filter(t => t.image_url && t.image_url.startsWith('http://'));
  console.log(`対象: ${therapists.length}件 (silk全体: ${all.length}件)`);

  let ok = 0, fail = 0;
  for (const t of therapists) {
    try {
      if (DRY_RUN) {
        console.log(`[DRY] ${t.name} | ${t.image_url}`);
        continue;
      }
      const newUrl = await uploadImage(t.image_url);
      await supabase.from('therapists').update({ image_url: newUrl }).eq('id', t.id);
      console.log(`✅ ${t.name}`);
      ok++;
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(`❌ ${t.name}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n完了: ${ok}件成功 / ${fail}件失敗`);
}

main();
