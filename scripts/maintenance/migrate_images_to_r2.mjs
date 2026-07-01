// Supabase Storage → Cloudflare R2 画像移行
// 前提: Supabaseの制限解除済み(Pro)。.env に R2_* 設定済み。 npm i -D @aws-sdk/client-s3
//
// フェーズ(この順で実行):
//   node scripts/maintenance/migrate_images_to_r2.mjs --dry-run        # 件数・バケット内訳だけ確認(書込みなし)
//   node scripts/maintenance/migrate_images_to_r2.mjs                  # ①コピー(Supabase→R2)。再実行で続きから
//   node scripts/maintenance/migrate_images_to_r2.mjs --update-db      # ②DBのimage_urlをR2に張替え(R2に在る分だけ)
//   （ここでサイトを開いて画像が出るか確認）
//   node scripts/maintenance/migrate_images_to_r2.mjs --delete-supabase # ③Supabaseから削除(R2に在る分だけ)
//
// 安全設計: ②③とも「R2に実在するファイルだけ」を対象にする。コピー未完のものは触らない＝消失事故が起きない。
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
// @aws-sdk/client-s3 は dry-run では不要なので動的import（未インストールでも --dry-run は動く）
let S3Client, PutObjectCommand, ListObjectsV2Command;

const env = fs.readFileSync('.env', 'utf-8');
const E = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SB_URL = E('VITE_SUPABASE_URL');
const SB_KEY = E('SUPABASE_SERVICE_ROLE_KEY');
const R2_ACCOUNT_ID = E('R2_ACCOUNT_ID');
const R2_AK = E('R2_ACCESS_KEY_ID');
const R2_SK = E('R2_SECRET_ACCESS_KEY');
const R2_BUCKET = E('R2_BUCKET');
const R2_PUBLIC_BASE = (E('R2_PUBLIC_BASE') || '').replace(/\/+$/, ''); // 例: https://pub-xxxx.r2.dev

const FLAGS = process.argv.slice(2);
const DRY = FLAGS.includes('--dry-run');
const UPDATE_DB = FLAGS.includes('--update-db');
const DELETE_SB = FLAGS.includes('--delete-supabase');

if (!SB_URL || !SB_KEY) { console.error('❌ .env に VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が必要'); process.exit(1); }
if (!DRY && [R2_ACCOUNT_ID, R2_AK, R2_SK, R2_BUCKET, R2_PUBLIC_BASE].some(x => !x)) {
  console.error('❌ .env に R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_BASE を設定して');
  process.exit(1);
}

const HOST = SB_URL.replace(/^https?:\/\//, '');
const PUBLIC_MARK = '/storage/v1/object/public/';
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
let s3 = null;
async function initR2() {
  ({ S3Client, PutObjectCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3'));
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_AK, secretAccessKey: R2_SK },
  });
}

const mime = (k) => {
  const e = k.toLowerCase().split('.').pop();
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' })[e] || 'application/octet-stream';
};

// 簡易並列プール
async function pool(items, n, fn, onTick) {
  let i = 0, done = 0; const errs = [];
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const it = items[i++];
      try { await fn(it); } catch (e) { errs.push({ item: it?.key || it, err: e.message }); }
      done++; if (onTick && done % 25 === 0) onTick(done);
    }
  }));
  return errs;
}

// therapists + shops から Supabase Storage を指す image_url を集める
async function gatherKeys() {
  const keys = new Set(); const rows = [];
  for (const table of ['therapists', 'shops']) {
    let from = 0; const PAGE = 1000;
    while (true) {
      const { data, error } = await sb.from(table).select('id,image_url')
        .ilike('image_url', `%${HOST}${PUBLIC_MARK}%`).range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || !data.length) break;
      for (const r of data) {
        const u = (r.image_url || '').split('?')[0];
        const idx = u.indexOf(PUBLIC_MARK);
        if (idx < 0) continue;
        const key = u.slice(idx + PUBLIC_MARK.length); // 'bucket/path...'
        if (key && key.includes('/')) { keys.add(key); rows.push({ table, id: r.id, key }); }
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }
  }
  return { keys: [...keys], rows };
}

// R2に既に在るキー一覧（再実行のスキップ判定に使う）
async function listR2Keys() {
  const set = new Set(); let token;
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, ContinuationToken: token, MaxKeys: 1000 }));
    (r.Contents || []).forEach(o => set.add(o.Key));
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return set;
}

async function copyPhase(keys) {
  const have = await listR2Keys();
  const todo = keys.filter(k => !have.has(k));
  console.log(`①コピー: 全${keys.length} / 既にR2 ${have.size} / 今回 ${todo.length}`);
  let copied = 0, bytes = 0;
  const errs = await pool(todo, 8, async (key) => {
    const s = key.indexOf('/'); const bucket = key.slice(0, s), path = key.slice(s + 1);
    const { data, error } = await sb.storage.from(bucket).download(path);
    if (error) throw new Error('DL ' + key + ': ' + (error.message || JSON.stringify(error)));
    const buf = Buffer.from(await data.arrayBuffer());
    await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: mime(key), CacheControl: 'public, max-age=31536000, immutable' }));
    copied++; bytes += buf.length;
  }, (d) => process.stdout.write(`\r  ${d}/${todo.length}  copied=${copied} (${(bytes / 1e6).toFixed(0)}MB)   `));
  console.log(`\n✅ コピー完了: ${copied}件 ${(bytes / 1e6).toFixed(0)}MB / 失敗 ${errs.length}`);
  if (errs.length) { fs.writeFileSync('r2_copy_errors.json', JSON.stringify(errs, null, 2)); console.log('  失敗ログ → r2_copy_errors.json（再実行で再挑戦）'); }
}

async function updateDbPhase(rows) {
  const have = await listR2Keys();
  const todo = rows.filter(r => have.has(r.key));
  const skip = rows.length - todo.length;
  console.log(`②URL張替え: 対象行${rows.length} / R2に在る ${todo.length} / 未コピーでスキップ ${skip}`);
  if (skip > 0) console.log(`  ⚠️ ${skip}行はR2未コピー。先に①を完走させてから再実行して`);
  let ok = 0, fail = 0;
  const errs = await pool(todo, 12, async (r) => {
    const { error } = await sb.from(r.table).update({ image_url: `${R2_PUBLIC_BASE}/${r.key}` }).eq('id', r.id);
    if (error) { fail++; throw new Error(r.table + ' ' + r.id + ': ' + error.message); }
    ok++;
  }, (d) => process.stdout.write(`\r  ${d}/${todo.length}  ok=${ok} fail=${fail}   `));
  console.log(`\n✅ 張替え完了: ${ok}件 / 失敗 ${errs.length}`);
}

// Supabaseの全バケット名
async function listBuckets() {
  const { data, error } = await sb.storage.listBuckets();
  if (error) throw new Error('listBuckets: ' + error.message);
  return data.map(b => b.name);
}

// バケット内の全ファイルパスを再帰列挙（フラット構造前提だがフォルダも辿る）
async function listBucketFiles(bucket) {
  const out = [];
  async function walk(prefix) {
    let offset = 0; const LIMIT = 1000;
    while (true) {
      const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: LIMIT, offset, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
      if (!data || !data.length) break;
      for (const it of data) {
        const full = prefix ? `${prefix}/${it.name}` : it.name;
        if (!it.id) { await walk(full); }   // id無し = フォルダ → 再帰
        else out.push(full);
      }
      if (data.length < LIMIT) break;
      offset += LIMIT;
    }
  }
  await walk('');
  return out;
}

// ③ Supabaseバケットを直接列挙し、R2に実在するファイルだけ削除（DB参照に依存しない）
async function deletePhase() {
  const have = await listR2Keys(); // Set of 'bucket/path'（R2にある物）
  console.log(`R2に存在するファイル: ${have.size} 件`);
  const buckets = await listBuckets();
  console.log(`Supabaseバケット: ${buckets.join(', ')}`);
  let totalDel = 0, totalProtected = 0;
  for (const bucket of buckets) {
    let files;
    try { files = await listBucketFiles(bucket); }
    catch (e) { console.log(`  ${bucket}: list失敗 → スキップ (${e.message})`); continue; }
    const safe = files.filter(p => have.has(`${bucket}/${p}`));
    const prot = files.length - safe.length;
    totalProtected += prot;
    console.log(`${bucket}: 全${files.length} / R2確認済み(削除可) ${safe.length} / R2未存在(保護) ${prot}`);
    let del = 0;
    for (let i = 0; i < safe.length; i += 500) {
      const chunk = safe.slice(i, i + 500);
      const { error } = await sb.storage.from(bucket).remove(chunk);
      if (error) { console.log(`  削除エラー ${bucket}: ${error.message}`); continue; }
      del += chunk.length; totalDel += chunk.length;
      process.stdout.write(`\r  ${bucket} 削除 ${del}/${safe.length}   `);
    }
    if (safe.length) process.stdout.write('\n');
  }
  console.log(`✅ Supabase削除完了: 計${totalDel}件 (R2未存在で保護=${totalProtected})`);
  console.log('  Usage の Storage が1GB以下になれば制限解除＆Pro→Freeに戻せる（反映に最大1時間）');
}

(async () => {
  console.log('=== Supabase Storage → Cloudflare R2 移行 ===');
  console.log('mode:', DRY ? 'DRY-RUN' : UPDATE_DB ? '②UPDATE-DB' : DELETE_SB ? '③DELETE-SUPABASE' : '①COPY');
  // ③削除はDB参照でなくSupabaseバケットを直接見るので gatherKeys 不要
  if (DELETE_SB) { await initR2(); return deletePhase(); }
  const { keys, rows } = await gatherKeys();
  console.log(`Supabase Storage参照: ユニークファイル ${keys.length} / DB行 ${rows.length}`);
  if (DRY) {
    const b = {}; for (const k of keys) { const n = k.split('/')[0]; b[n] = (b[n] || 0) + 1; }
    console.log('バケット内訳:', b);
    console.log('サンプルキー:', keys.slice(0, 5));
    console.log('（実容量はコピー時に判明。Usage上は約2.3GB）');
    return;
  }
  await initR2(); // ①コピー / ②張替え は R2 必須（ここで動的import）
  if (UPDATE_DB) return updateDbPhase(rows);
  return copyPhase(keys);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
