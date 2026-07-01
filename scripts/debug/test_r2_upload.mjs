// 新規アップロードのR2向け化が機能するか検証（scripts/lib/r2Upload.mjs のテスト）
// 実行: node scripts/debug/test_r2_upload.mjs
// → 出たURLをブラウザで開いて画像が表示されれば、新規登録のR2化はOK。
import fs from 'fs';
import { uploadImage } from '../lib/r2Upload.mjs';

const env = fs.readFileSync('.env', 'utf-8');
const E = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const BASE = (E('R2_PUBLIC_BASE') || '').replace(/\/+$/, '');

// 既にR2に在る画像を取得元にして、テストキーで再アップロード（fetch→R2 Put→URL の全経路を検証）
const src = `${BASE}/therapist-images/acro_0164158.jpg`;
console.log('取得元:', src);

const url = await uploadImage(src, '_r2_helper_test.jpg', null);
console.log('結果URL:', url);
console.log(url
  ? '✅ 成功。上のURLをブラウザで開いて写真が出れば、新規登録のR2化は完成。\n   （テストファイル _r2_helper_test.jpg はR2に残るが無害。気になれば後で消してOK）'
  : '❌ 失敗。.env の R2_* を確認して');
