import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

// 1. Storage エラー確認（1件だけテスト）
const { data: t } = await supabase.from('therapists')
  .select('id,name,image_url').eq('shop_id','kyoto_senbon_sanjo_pure_white').limit(1).single();

console.log(`テスト対象: ${t.name} / ${t.image_url}`);

// 画像fetch
const res = await fetch(t.image_url, {
  headers: { ...ua, 'Referer': 'https://purewhite-aroma.com/' },
  signal: AbortSignal.timeout(10000),
});
console.log(`fetch status: ${res.status}, content-type: ${res.headers.get('content-type')}`);
const buf = Buffer.from(await res.arrayBuffer());
console.log(`buffer size: ${buf.length} bytes`);

// Storage upload
const fileName = `test_pw.jpg`;
const { data: upData, error: upErr } = await supabase.storage.from('therapist-images')
  .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
console.log(`Storage upload error:`, upErr);
console.log(`Storage upload data:`, upData);

// 2. 画像URLの有効期限チェック（タイムスタンプ部分）
const url = t.image_url;
const tsMatch = url.match(/&(\d{9,10})$/);
if (tsMatch) {
  const ts = parseInt(tsMatch[1]);
  const date = new Date(ts * 1000);
  const now = new Date();
  console.log(`\nURLタイムスタンプ: ${ts} = ${date.toISOString()}`);
  console.log(`現在時刻: ${now.toISOString()}`);
  console.log(`有効期限: ${ts * 1000 > Date.now() ? '✅ まだ有効' : '❌ 期限切れ'}`);
}

// 3. 画像が実際に表示可能か（内容確認）
const res2 = await fetch(t.image_url, {
  headers: { 'User-Agent': ua['User-Agent'] },  // Refererなし
  signal: AbortSignal.timeout(10000),
});
console.log(`\nRefererなしでfetch: status=${res2.status}, ct=${res2.headers.get('content-type')}`);
const buf2 = Buffer.from(await res2.arrayBuffer());
console.log(`size: ${buf2.length}`);
// JPEGマジックバイト確認
console.log(`JPEGマジック: ${buf2[0]===0xFF && buf2[1]===0xD8 ? '✅ 正規JPEG' : '❌ 非JPEG (HTMLなど?)'}`);
if (buf2[0] !== 0xFF) console.log(`先頭bytes: ${buf2.slice(0,20).toString('hex')}`);
