/**
 * 大阪 俺の家 セラピスト登録
 * パターン: images_staff + alt【名前】形式
 * 実行: node scripts/maintenance/process_orenoie.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_umeda_orenoie';
const BASE = 'https://ore-no-ie.com';
const BUCKET = 'therapist-images';
const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://ore-no-ie.com/',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// ノイズチェック
const isNoise = (name) => {
  if (!name || name.length === 0) return true;
  if (name.length > 12) return true;
  if (/イベント|キャンペーン|求人|体験入店|新規|スタート|LINE|Twitter|banner|logo|icon/i.test(name)) return true;
  if (!/[ぁ-んァ-ヾ一-龯a-zA-Zａ-ｚＡ-Ｚ]/.test(name)) return true;
  return false;
};

// 画像アップロード
async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    // ファイル名はURLのベースネームを使用（衝突防止）
    const base = imageUrl.split('/').pop().split('?')[0];
    const ext = (base.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const stem = base.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_');
    const fileName = `orenoie_${stem}.${safeExt}`;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

// スクレイプ
console.log('staff.php 取得中...');
const res = await fetch(`${BASE}/staff.php`, { headers: UA, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);

// 名前→最初の画像URL マップ（重複名は先勝ち）
const therapistMap = new Map(); // name → imageUrl

$('img[src*="images_staff"]').each((_, el) => {
  let alt = $(el).attr('alt') || '';
  let src = $(el).attr('src') || '';

  // 【名前】→ 名前 / 【名前(年齢)】→ 名前 / 【REMI(れみ)】→ REMI(れみ)
  alt = alt.replace(/^【|】.*$/g, '').trim();
  // 括弧内が年齢数字なら除去
  alt = alt.replace(/\(\d+\)$/, '').trim();

  if (isNoise(alt)) return;
  if (!src.startsWith('http')) src = `${BASE}${src}`;

  if (!therapistMap.has(alt)) {
    therapistMap.set(alt, src);
  }
});

console.log(`取得: ${therapistMap.size}名`);
if (DRY_RUN) {
  for (const [name, url] of therapistMap) {
    console.log(`  ${name} → ${url}`);
  }
}

if (!DRY_RUN) {
  let inserted = 0, skipped = 0, failed = 0;

  for (const [name, imageUrl] of therapistMap) {
    const id = `${SHOP_ID}_${name}`;
    // 既存チェック
    const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
    if (existing) { process.stdout.write('='); skipped++; continue; }

    // 画像アップロード
    const storageUrl = await uploadImage(imageUrl, id);
    await sleep(80);

    const { error } = await supabase.from('therapists').insert({
      id,
      shop_id: SHOP_ID,
      name,
      image_url: storageUrl ?? imageUrl,
    });

    if (error) {
      console.log(`\n❌ ${name}: ${error.message}`);
      failed++;
    } else {
      process.stdout.write(storageUrl ? '+' : '.');
      inserted++;
    }
    await sleep(80);
  }

  console.log(`\n\n完了: 挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
} else {
  console.log(`\n[DRY RUN] 挿入予定: ${therapistMap.size}名`);
}
