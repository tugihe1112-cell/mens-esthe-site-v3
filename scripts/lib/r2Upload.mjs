// 新規画像アップロードを Cloudflare R2 に向ける共有ヘルパー
// ─────────────────────────────────────────────────────────────
// 【重要】新規の店舗/セラピスト登録スクリプトは、各自でSupabase Storageに
// アップする uploadImage() を書かず、このファイルの uploadImage を import して使うこと。
// これで Supabase Storage は二度と増えない（2026-06 の1GB超過事故の恒久対策）。
//
//   import { uploadImage } from '../lib/r2Upload.mjs';
//   const url = await uploadImage(srcImageUrl, storageKey, referer);   // ← R2公開URLが返る
//   // 例: storageKey='prime_1234.jpg' → 返り値 'https://pub-xxxx.r2.dev/therapist-images/prime_1234.jpg'
//
// 旧Supabase版と同じシグネチャ(imageUrl, storageKey, referer)。返り値もそのままimage_urlに保存すればOK。
// フロントの imageUrl.js は R2 URL を自動で wsrv.nl 経由（リサイズ+WebP）にするのでコード変更不要。
// ─────────────────────────────────────────────────────────────
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const env = fs.readFileSync('.env', 'utf-8');
const E = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const R2_ACCOUNT_ID = E('R2_ACCOUNT_ID');
const R2_AK = E('R2_ACCESS_KEY_ID');
const R2_SK = E('R2_SECRET_ACCESS_KEY');
const R2_BUCKET = E('R2_BUCKET') || 'mens-esthe-images';               // 実バケット名
const R2_PUBLIC_BASE = (E('R2_PUBLIC_BASE') || '').replace(/\/+$/, ''); // 例: https://pub-xxxx.r2.dev

if (!R2_ACCOUNT_ID || !R2_AK || !R2_SK || !R2_PUBLIC_BASE) {
  throw new Error('R2の.env設定が不足: R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_PUBLIC_BASE を確認して');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_AK, secretAccessKey: R2_SK },
});

const mimeFromKey = (k) => {
  const e = (k || '').toLowerCase().split('.').pop();
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' })[e] || 'image/jpeg';
};

/**
 * 元画像をfetchしてR2にアップし、R2公開URLを返す（旧 uploadImage の差し替え）。
 * @param {string} imageUrl  取得元の画像URL
 * @param {string} storageKey  保存ファイル名（例 'prime_1234.jpg'）。※URLのベースネーム推奨（衝突回避）
 * @param {string|null} referer  ホットリンク保護対策のRefererヘッダー
 * @param {string} logicalBucket  R2キーの接頭辞（既存と揃えるため既定 'therapist-images'。店ロゴは 'shop-logos'）
 * @returns {Promise<string|null>}  R2公開URL、失敗時 null
 */
export async function uploadImage(imageUrl, storageKey, referer = null, logicalBucket = 'therapist-images') {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imageUrl, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || mimeFromKey(storageKey);
    const key = `${logicalBucket}/${storageKey}`; // 例 therapist-images/prime_1234.jpg（移行済みURLと同形式）
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buf,
      ContentType: ct,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    return `${R2_PUBLIC_BASE}/${key}`;
  } catch (e) {
    console.error('  R2 upload error:', e.message);
    return null;
  }
}

// 生バッファを直接R2へ（canvasで加工した画像など、fetch経由でない場合用）
export async function uploadBuffer(buf, storageKey, contentType = null, logicalBucket = 'therapist-images') {
  try {
    const key = `${logicalBucket}/${storageKey}`;
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buf,
      ContentType: contentType || mimeFromKey(storageKey),
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    return `${R2_PUBLIC_BASE}/${key}`;
  } catch (e) {
    console.error('  R2 upload error:', e.message);
    return null;
  }
}
