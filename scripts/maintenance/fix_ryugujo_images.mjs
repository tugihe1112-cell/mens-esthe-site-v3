/**
 * 竜宮城 セラピスト写真を Supabase Storage にアップロードして URL 差し替え
 * ホットリンク保護対策
 * 実行: node scripts/maintenance/fix_ryugujo_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'tokyo_chuo_ningyocho_ryugujo';
const BUCKET = 'therapist-images';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

const sleep = ms => new Promise(r => setTimeout(r, ms));

console.log(`バケット "${BUCKET}" 使用`);

async function uploadImage(imageUrl, therapistId) {
  try {
    // esthe-ryugujo.com を Referer に設定してホットリンク回避
    const res = await fetch(imageUrl, {
      headers: {
        ...UA,
        'Referer': 'https://esthe-ryugujo.com/',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error(`    HTTP ${res.status}: ${imageUrl}`);
      return null;
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      console.error(`    非画像 (${ct}): ${imageUrl}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) {
      console.error(`    サイズ小さすぎ (${buf.length}B): ${imageUrl}`);
      return null;
    }
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `${therapistId.replace(/[^\w-]/g, '_')}.${safeExt}`;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) {
      console.error(`    Storage エラー: ${error.message}`);
      return null;
    }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) {
    console.error(`    例外: ${e.message}`);
    return null;
  }
}

// DBから竜宮城のセラピスト一覧取得（image_url が wp-content のもの）
const { data: therapists, error } = await supabase
  .from('therapists')
  .select('id, name, image_url')
  .eq('shop_id', SHOP_ID)
  .like('image_url', '%wp-content%');

if (error) { console.error(`DB取得エラー: ${error.message}`); process.exit(1); }

console.log(`対象: ${therapists.length}名（wp-content 画像あり）`);

if (DRY_RUN) {
  therapists.slice(0, 10).forEach(t => console.log(`  ${t.name} → ${t.image_url}`));
  if (therapists.length > 10) console.log(`  ...他${therapists.length - 10}名`);
  console.log('\n[DRY RUN] 完了');
  process.exit(0);
}

let uploaded = 0, failed = 0;

for (const t of therapists) {
  process.stdout.write(`${t.name} `);
  const newUrl = await uploadImage(t.image_url, t.id);
  if (!newUrl) {
    console.log(`❌ アップロード失敗`);
    failed++;
    await sleep(200);
    continue;
  }
  const { error: updateErr } = await supabase.from('therapists')
    .update({ image_url: newUrl })
    .eq('id', t.id);
  if (updateErr) {
    console.log(`❌ DB更新失敗: ${updateErr.message}`);
    failed++;
  } else {
    console.log(`✅`);
    uploaded++;
  }
  await sleep(100);
}

console.log(`\n完了: アップロード成功 ${uploaded}名 / 失敗 ${failed}名`);
