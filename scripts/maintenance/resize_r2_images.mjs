/**
 * resize_r2_images.mjs — R2上の画像を軽量化（同キーに上書きリサイズ）
 *
 * 外部→R2移行で原寸のまま入った画像を、最大600px・WebPに縮小してR2へ上書きする。
 * カード(~200px)も詳細ページ(~320px)も600pxで十分＝転送量を大幅削減＝表示が軽くなる。
 *
 * 【この方式を選んだ理由】別キー(_w400.webp)に併置してフロントで参照切替だと、未処理分が
 * 404→NO IMAGEになるリスクがある。同キー上書きなら未処理でも既存URLがそのまま生き、
 * imageUrl.js/LazyImageの変更も不要（URLは不変・中身だけ軽くなる。ブラウザはContent-Typeで判定）。
 *
 * 冪等: 既にWebPかつ幅<=MAXなら再処理しない（--force で無視）。再実行で残りだけ処理。
 * ⚠️上書きなので原寸は失われる（このサイトでは600px超は不要）。まず --limit で少数テストし表示を確認してから全実行。
 *
 * 前提: npm i sharp（初回のみ）／ .env に VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_*（r2Upload.mjsと同じ）
 * 実行:
 *   node scripts/maintenance/resize_r2_images.mjs --dry-run                 # 対象ユニークキー数だけ表示
 *   node scripts/maintenance/resize_r2_images.mjs --limit=30                # まず30枚だけ（表示確認用）
 *   node scripts/maintenance/resize_r2_images.mjs                           # 全実行（数万枚・時間かかる）
 * オプション: --max-width=600 / --quality=78 / --concurrency=5 / --force
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const env = fs.readFileSync('.env', 'utf-8');
const E = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const supabase = createClient(E('VITE_SUPABASE_URL'), E('SUPABASE_SERVICE_ROLE_KEY'));

const R2_ACCOUNT_ID = E('R2_ACCOUNT_ID');
const R2_BUCKET = E('R2_BUCKET') || 'mens-esthe-images';
const R2_PUBLIC_BASE = (E('R2_PUBLIC_BASE') || '').replace(/\/+$/, '');
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: E('R2_ACCESS_KEY_ID'), secretAccessKey: E('R2_SECRET_ACCESS_KEY') },
});

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0);
const MAXW = Number(args.find((a) => a.startsWith('--max-width='))?.split('=')[1] || 600);
const Q = Number(args.find((a) => a.startsWith('--quality='))?.split('=')[1] || 78);
const CONC = Number(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || 5);

const isR2 = (u) => u && (u.includes('.r2.dev') || u.includes('r2.cloudflarestorage.com'));
// 公開URL → R2オブジェクトキー（例 https://pub-xxx.r2.dev/therapist-images/x.jpg → therapist-images/x.jpg）
const keyFromUrl = (u) => { try { return new URL(u).pathname.replace(/^\/+/, ''); } catch { return null; } };

async function fetchAllImageUrls(table) {
  const urls = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select('image_url').range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    for (const r of data) if (isR2((r.image_url || '').trim())) urls.push(r.image_url.trim());
    if (data.length < PAGE) break;
  }
  return urls;
}

const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
};

async function processKey(key, stats) {
  try {
    const got = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const buf = await streamToBuffer(got.Body);
    const meta = await sharp(buf).metadata();
    // 既にWebPで十分小さいならスキップ（冪等）
    if (!FORCE && meta.format === 'webp' && (meta.width || 0) <= MAXW) { stats.skip++; return; }
    const out = await sharp(buf)
      .rotate() // EXIF回転を反映
      .resize({ width: MAXW, withoutEnlargement: true })
      .webp({ quality: Q })
      .toBuffer();
    // 元より大きくなるなら上書きしない（稀に極小画像で発生）
    if (out.length >= buf.length && meta.format === 'webp') { stats.skip++; return; }
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET, Key: key, Body: out,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    stats.done++;
    stats.saved += Math.max(0, buf.length - out.length);
  } catch (e) {
    stats.err++;
  }
}

async function runPool(keys, stats) {
  let i = 0;
  async function next() {
    while (i < keys.length) {
      const idx = i++;
      await processKey(keys[idx], stats);
      const total = stats.done + stats.skip + stats.err;
      if (total % 500 === 0) console.log(`  進捗 ${total}/${keys.length}  (縮小:${stats.done} skip:${stats.skip} 失敗:${stats.err} 削減:${(stats.saved / 1e6).toFixed(1)}MB)`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, keys.length) }, next));
}

async function main() {
  console.log(`\n🗜  R2画像リサイズ  ${DRY ? '[DRY-RUN]' : ''}  max=${MAXW}px q=${Q} 並行=${CONC}${FORCE ? ' [FORCE]' : ''}`);
  const [tUrls, sUrls] = await Promise.all([fetchAllImageUrls('therapists'), fetchAllImageUrls('shops')]);
  // ユニークキー（複数セラピストが同一画像を共有＝同一キーは1回だけ処理）
  let keys = [...new Set([...tUrls, ...sUrls].map(keyFromUrl).filter(Boolean))];
  console.log(`  R2参照ユニークキー: ${keys.length}件`);
  if (LIMIT) keys = keys.slice(0, LIMIT);
  if (DRY) { console.log(`  🟡 dry-run: 実行しません（${LIMIT ? `--limit=${LIMIT}` : '全' + keys.length}件が対象）\n`); return; }

  const stats = { done: 0, skip: 0, err: 0, saved: 0 };
  await runPool(keys, stats);
  console.log(`\n✅ 完了: 縮小 ${stats.done} / skip ${stats.skip} / 失敗 ${stats.err} / 転送量削減 約${(stats.saved / 1e6).toFixed(1)}MB\n`);
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
