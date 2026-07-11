/**
 * check_therapist_image_health.mjs — セラピスト画像の健全性チェック（R2整合性監査）
 *
 * 「写真が表示されない」が (A)image_urlがnull＝写真そのものが無い(正常) なのか
 * (B)image_urlはR2 URLなのにR2に実物が無い＝真性404(バグ) なのかを**確定**する。
 *
 * ※HEADチェックだとr2.devのレート制限(429)を404と誤認するため、
 *   R2バケットの全キーをListObjectsV2で取得してDBのimage_urlキーと突合する（ノイズゼロの決定的手法）。
 *
 * 実行:
 *   node scripts/debug/check_therapist_image_health.mjs
 *   node scripts/debug/check_therapist_image_health.mjs tokyo_adachi_kitasenju_remis_君島みやび   # 特定IDを詳細表示
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const env = fs.readFileSync('.env', 'utf-8');
const E = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(E('VITE_SUPABASE_URL'), E('SUPABASE_SERVICE_ROLE_KEY'));

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${E('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: E('R2_ACCESS_KEY_ID'), secretAccessKey: E('R2_SECRET_ACCESS_KEY') },
});
const R2_BUCKET = E('R2_BUCKET') || 'mens-esthe-images';
const specificId = process.argv.slice(2).find((a) => !a.startsWith('--'));

const isR2 = (u) => u && (u.includes('.r2.dev') || u.includes('r2.cloudflarestorage.com'));
const keyFromUrl = (u) => { try { return new URL(u).pathname.replace(/^\/+/, ''); } catch { return null; } };

async function listAllR2Keys() {
  const keys = new Set();
  let token;
  let pages = 0;
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, ContinuationToken: token, MaxKeys: 1000 }));
    for (const o of r.Contents || []) keys.add(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
    if (++pages % 10 === 0) process.stdout.write(`\r  R2キー取得中… ${keys.size}`);
  } while (token);
  process.stdout.write(`\r  R2キー総数: ${keys.size}                    \n`);
  return keys;
}

async function fetchAll(table) {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select('id, image_url').range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

async function main() {
  console.log('\n🔎 R2整合性監査（DBのimage_url ↔ R2実オブジェクト）\n');
  const r2keys = await listAllR2Keys();

  if (specificId) {
    const { data } = await supabase.from('therapists').select('id, name, image_url').eq('id', specificId).maybeSingle();
    console.log('\n── 特定セラピスト ──');
    if (!data) console.log(`  ❓ ${specificId} は therapists に無い`);
    else {
      const k = isR2(data.image_url) ? keyFromUrl(data.image_url) : null;
      console.log(`  ${data.name}  image_url: ${data.image_url || '(null＝写真無し=NO IMAGEが正常)'}`);
      if (k) console.log(`  R2キー ${k} は実在? → ${r2keys.has(k) ? '✅ ある(表示されるはず=バグ)' : '❌ 無い(真性404=要null化)'}`);
    }
    console.log('');
  }

  for (const table of ['therapists', 'shops']) {
    const rows = await fetchAll(table);
    let nNull = 0, nR2ok = 0, nR2missing = 0, nExt = 0;
    const missing = [];
    for (const r of rows) {
      const u = (r.image_url || '').trim();
      if (!u) { nNull++; continue; }
      if (!isR2(u)) { nExt++; continue; }
      const k = keyFromUrl(u);
      if (k && r2keys.has(k)) nR2ok++;
      else { nR2missing++; if (missing.length < 10) missing.push(`${r.id} → ${u}`); }
    }
    console.log(`── ${table} (計${rows.length}) ──`);
    console.log(`  R2実在 ${nR2ok} / R2欠損(真性404=バグ) ${nR2missing} / null(写真無し=正常) ${nNull} / 外部(未移行) ${nExt}`);
    if (missing.length) { console.log('  欠損の例:'); missing.forEach((m) => console.log(`    ${m}`)); }
  }
  console.log('\n判定: 「R2欠損」が0付近なら「写真が出ない=nullで正常」＝表示バグでない（残りはr2.devの一時429→P1リトライで対処）。');
  console.log('      「R2欠損」が多いなら移行で欠けた＝該当をnull化 or 再移行が必要。\n');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
