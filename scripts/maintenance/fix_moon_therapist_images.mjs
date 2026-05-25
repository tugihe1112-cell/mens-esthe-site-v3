/**
 * ミセスムーンR セラピスト画像取得
 * /gals/profile?uid=xxx を巡回して画像を取得→DBを更新
 *
 * 実行: node scripts/maintenance/fix_moon_therapist_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const BASE = 'https://moor-kobe.jp';
const SHOP_ID = 'hyogo_kobe_mrs_moon';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl}`); return null; }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) { console.log(`\n  NG content-type: ${contentType}`); return null; }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 512) { console.log(`\n  NG size: ${buffer.length}`); return null; }
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg','jpeg','png','gif','webp'].includes(ext) ? ext : 'jpg';
    // ファイル名はASCIIのみ (日本語はURLのパス末尾から抽出)
    const safeId = therapistId.replace(/[^\w-]/g, '_');
    const fileName = `${safeId}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { console.log(`\n  Storage error: ${error.message} (file: ${fileName})`); throw error; }
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) { if (!e.message?.includes('Storage error')) console.log(`\n  catch: ${e.message}`); return null; }
}

// 1. /gals/ から全プロフィールUIDを取得
console.log('/gals/ からUID一覧取得中...');
const listRes = await fetch(`${BASE}/gals/`, { headers: ua });
const listHtml = await listRes.text();
const $list = cheerio.load(listHtml);

const profileUids = new Set();
$list('a[href*="/gals/profile?uid="]').each((_, el) => {
  const href = $list(el).attr('href') || '';
  const m = href.match(/uid=(\d+)/);
  if (m) profileUids.add(m[1]);
});

console.log(`プロフィールUID: ${profileUids.size}件`);

// 2. 既存セラピストのDB取得（名前→IDのマップ）
const { data: dbTherapists } = await supabase.from('therapists')
  .select('id, name, image_url')
  .eq('shop_id', SHOP_ID);

const nameToId = {};
for (const t of (dbTherapists || [])) {
  nameToId[t.name] = t.id;
}
console.log(`DB登録済み: ${dbTherapists?.length || 0}名`);

// 3. 各プロフィールページを巡回
let updated = 0, notFound = 0, noImage = 0;

for (const uid of [...profileUids]) {
  try {
    const profUrl = `${BASE}/gals/profile?uid=${uid}`;
    const profRes = await fetch(profUrl, { headers: ua, signal: AbortSignal.timeout(10000) });
    const profHtml = await profRes.text();
    const $ = cheerio.load(profHtml);

    // 名前取得: h2 "江玲奈　えれなのご紹介" → "江玲奈"
    let name = null;
    $('h2').each((_, el) => {
      const text = $(el).text().trim();
      // "名前　読みのご紹介" パターン
      const m = text.match(/^([ぁ-んァ-ヾ一-龯々]{1,8})[\s　]/);
      if (m) { name = m[1]; return false; }
    });

    if (!name) {
      // h2テキストを全部表示してデバッグ
      const h2texts = $('h2').map((_, el) => $(el).text().trim()).get();
      console.log(`\n  uid=${uid} h2一覧:`, JSON.stringify(h2texts));
      notFound++;
      continue;
    }

    // 画像取得: /wcms/gals/images/{uid}/ のみ対象（np.jpg は除外）
    let imgUrl = null;
    $('img[src*="/wcms/gals/images/"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src && !src.includes('np.jpg')) {
        imgUrl = src.startsWith('http') ? src : `${BASE}${src}`;
        return false;
      }
    });

    if (!imgUrl) { noImage++; process.stdout.write('_'); continue; }

    // DBのセラピストIDを探す
    const therapistId = nameToId[name] || `${SHOP_ID}_${name.replace(/\s+/g, '_')}`;
    const isNew = !nameToId[name];

    if (DRY_RUN) {
      console.log(`  [DRY${isNew ? ' NEW' : ''}] ${name} → ${imgUrl}`);
      if (isNew) notFound++;
      continue;
    }

    if (isNew) {
      // 新規挿入
      const { error } = await supabase.from('therapists').upsert({
        id: therapistId, shop_id: SHOP_ID, name,
        age: null, height: null, cup: null,
        image_url: imgUrl,
      });
      if (!error) { updated++; process.stdout.write('+'); }
      else { console.log(`\n  新規挿入失敗: ${error.message}`); process.stdout.write('x'); }
    } else {
      // 既存更新
      const { error } = await supabase.from('therapists').update({ image_url: imgUrl }).eq('id', therapistId);
      if (!error) { updated++; process.stdout.write('.'); }
      else { console.log(`\n  DB更新失敗: ${error.message}`); process.stdout.write('x'); }
    }

    await sleep(200); // 過負荷防止
  } catch (e) {
    process.stdout.write('!');
  }
}

console.log(`\n\n✅ 更新/新規挿入: ${updated}名`);
console.log(`⚠️ 画像なし: ${noImage}名`);
console.log(`❓ 名前取得失敗: ${notFound}名`);
console.log('完了');
