/**
 * http:// 画像を持つ全店舗をSupabase Storageに移行
 * ファイル名は元URLのベースネームを使用（衝突防止）
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim();
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));
const BUCKET = 'therapist-images';
const DRY_RUN = process.argv.includes('--dry-run');
const SHOP_FILTER = process.argv.find(a => a.startsWith('--shop='))?.split('=')[1];

async function uploadImage(imageUrl, storageFileName) {
  const domain = new URL(imageUrl).origin + '/';
  const res = await fetch(imageUrl, {
    headers: {
      'Referer': domain,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    }
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = imageUrl.split('.').pop().toLowerCase().split('?')[0];
  const contentType = ['jpg','jpeg'].includes(ext) ? 'image/jpeg' : `image/${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(storageFileName, buffer, {
    contentType, upsert: true,
  });
  if (error) throw new Error(`upload: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(storageFileName).data.publicUrl;
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== 本実行 ===');

  let query = supabase.from('therapists').select('id, name, shop_id, image_url').ilike('image_url', 'http://%');
  if (SHOP_FILTER) {
    query = query.eq('shop_id', SHOP_FILTER);
  }
  const { data: therapists, error } = await query;
  if (error) { console.error(error); return; }
  console.log(`対象: ${therapists.length}件`);

  // 店舗別に集計表示
  const shopCounts = {};
  for (const t of therapists) shopCounts[t.shop_id] = (shopCounts[t.shop_id] || 0) + 1;
  for (const [id, n] of Object.entries(shopCounts).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${n}件 ${id}`);
  }
  if (DRY_RUN) return;

  console.log('\n処理開始...');
  let ok = 0, fail = 0;

  for (const t of therapists) {
    try {
      const baseName = t.image_url.split('/').pop().toLowerCase().split('?')[0];
      const prefix = t.shop_id.replace(/[^\w]/g, '_').substring(0, 30);
      const storageFileName = `${prefix}_${baseName}`;
      const newUrl = await uploadImage(t.image_url, storageFileName);
      await supabase.from('therapists').update({ image_url: newUrl }).eq('id', t.id);
      console.log(`✅ ${t.shop_id} / ${t.name}`);
      ok++;
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.log(`❌ ${t.shop_id} / ${t.name}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n完了: ${ok}件成功 / ${fail}件失敗`);
}

main();
