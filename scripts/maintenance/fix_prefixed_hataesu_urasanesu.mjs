/**
 * HaTaEsu・UraSanEsu/下北沢 プレフィックス付き名前の写真修正
 * DBの名前に「幡ヶ谷 」「下北沢 」プレフィックスが付いているためマッチできなかったものを修正
 * 実行: node scripts/maintenance/fix_prefixed_hataesu_urasanesu.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// UraSanEsu 北参道: 現在サイトに掲載中の名前→画像URLマップ
const URA_MAP = new Map([
  ['桜木ゆり',   'https://urasanesu.com/therapist_img/345-1.jpg'],
  ['柚木みお',   'https://urasanesu.com/therapist_img/359-1.jpg'],
  ['広瀬ゆず',   'https://urasanesu.com/therapist_img/344-1.jpg'],
  ['泉ねね',     'https://urasanesu.com/therapist_img/109-1.jpg'],
  ['海堂ふみ',   'https://urasanesu.com/therapist_img/350-1.jpg'],
  ['月野れい',   'https://urasanesu.com/therapist_img/378-1.jpg'],
]);

// HaTaEsu 幡ヶ谷: 15名（斎藤ひかる追加）
const HATA_MAP = new Map([
  ['西野みつき', 'https://urasanesu.com/therapist_img/379-1.jpg'],
  ['柏木のぞみ', 'https://urasanesu.com/therapist_img/376-1.jpg'],
  ['伊藤なこ',   'https://urasanesu.com/therapist_img/164-1.jpg'],
  ['望月りな',   'https://urasanesu.com/therapist_img/352-1.jpg'],
  ['工藤ゆうか', 'https://urasanesu.com/therapist_img/331-1.jpg'],
  ['桜木ゆり',   'https://urasanesu.com/therapist_img/345-1.jpg'],
  ['柚木みお',   'https://urasanesu.com/therapist_img/359-1.jpg'],
  ['市川あかり', 'https://urasanesu.com/therapist_img/369-1.jpg'],
  ['川村もか',   'https://urasanesu.com/therapist_img/360-1.jpg'],
  ['広瀬ゆず',   'https://urasanesu.com/therapist_img/344-1.jpg'],
  ['泉ねね',     'https://urasanesu.com/therapist_img/109-1.jpg'],
  ['海堂ふみ',   'https://urasanesu.com/therapist_img/350-1.jpg'],
  ['月野れい',   'https://urasanesu.com/therapist_img/378-1.jpg'],
  ['清水りりか', 'https://urasanesu.com/therapist_img/368-1.jpg'],
  ['斎藤ひかる', 'https://urasanesu.com/therapist_img/363-1.jpg'],
]);

// 大森あやせ: サイト上での担当店舗によってIDが違う可能性があるため両方に同じURLを使用
// urasanesu.com に掲載されていればIDを取得、なければnull
const AYASE_URL = 'https://urasanesu.com/therapist_img/383-1.jpg'; // 仮: 確認が必要な場合はnullにする

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: referer || 'https://urasanesu.com/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { process.stdout.write(`[${res.status}]`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { process.stdout.write(`[E]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR:${e.message.slice(0,20)}]`); return null; }
}

// プレフィックスを除去してコアな名前を取得
function stripPrefix(name) {
  // 「幡ヶ谷 」「下北沢 」「下北沢　」などを除去
  return name
    .replace(/^幡ヶ谷[\s　]+/, '')
    .replace(/^下北沢[\s　]+/, '')
    .replace(/^大森[\s　]+/, '')
    .trim();
}

async function processShop(label, urlPart, dataMap, uploadPrefix, referer) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`【${label}】`);

  const { data: shops } = await supabase.from('shops')
    .select('id, name')
    .ilike('website_url', `%${urlPart}%`);

  if (!shops?.length) { console.log(`${label}: 店舗なし`); return; }

  // label に応じて店舗をフィルタ
  const targetShops = shops.filter(s => {
    if (label.includes('HaTaEsu')) return s.name.includes('HaTaEsu') || s.name.includes('ハタエス');
    if (label.includes('下北沢')) return s.name.includes('下北沢') || s.name.includes('UraSanEsu') || s.name.includes('ウラサネス') || s.name.includes('ShiMoEsu');
    return true;
  });

  if (!targetShops.length) {
    console.log(`${label}: 対象店舗なし（全店舗: ${shops.map(s=>s.name).join(', ')}）`);
    return;
  }

  console.log(`対象店舗: ${targetShops.map(s => s.name).join(', ')}`);
  const shopIds = targetShops.map(s => s.id);

  const { data: nullT } = await supabase.from('therapists')
    .select('id, name, shop_id, image_url')
    .in('shop_id', shopIds)
    .is('image_url', null);

  if (!nullT?.length) { console.log('写真なしなし'); return; }
  console.log(`DB写真なし: ${nullT.length}名`);

  if (DRY_RUN) {
    let matchCount = 0, noMatchCount = 0;
    for (const t of nullT) {
      const coreName = stripPrefix(t.name);
      const url = dataMap.get(coreName);
      if (url) {
        console.log(`  ✅ "${t.name}" → coreName="${coreName}" → ${url.slice(-30)}`);
        matchCount++;
      } else {
        console.log(`  ❓ "${t.name}" → coreName="${coreName}" → 未マッチ`);
        noMatchCount++;
      }
    }
    console.log(`マッチ: ${matchCount}名 / 未マッチ: ${noMatchCount}名`);
    return;
  }

  let updated = 0, notFound = 0, failed = 0;
  const uploadedUrls = new Map(); // imageUrl → storageUrl

  for (const t of nullT) {
    const coreName = stripPrefix(t.name);
    const imageUrl = dataMap.get(coreName);

    if (!imageUrl) { process.stdout.write('?'); notFound++; continue; }

    let storageUrl;
    if (uploadedUrls.has(imageUrl)) {
      storageUrl = uploadedUrls.get(imageUrl);
    } else {
      const therapistId = imageUrl.match(/\/(\d+)-1\.(jpg|png|webp)/)?.[1] || coreName;
      const ext = imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1]?.toLowerCase() || 'jpg';
      const safeExt = ext === 'jpeg' ? 'jpg' : ext;
      const fileName = `${uploadPrefix}_${therapistId}.${safeExt}`;
      storageUrl = await uploadImage(imageUrl, fileName, referer);
      uploadedUrls.set(imageUrl, storageUrl);
      await sleep(150);
    }

    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl ?? imageUrl })
      .eq('id', t.id);
    if (error) { console.log(`\n❌ ${t.name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : '.'); updated++; }
    await sleep(80);
  }

  console.log(`\n更新 ${updated}件 / 未マッチ ${notFound}件 / 失敗 ${failed}件`);
}

// HaTaEsu 幡ヶ谷
await processShop(
  'HaTaEsu 幡ヶ谷',
  'hataesu.com',
  HATA_MAP,
  'hataesu',
  'http://hataesu.com/'
);

// UraSanEsu / 下北沢（shimoesu.com）
// 店舗名に「下北沢」または「UraSanEsu」「ウラサネス」「ShiMoEsu」を含む
await processShop(
  'UraSanEsu/下北沢',
  'shimoesu.com',
  HATA_MAP, // 下北沢も同じHATA_MAPを使用（同一CDN）
  'urasanesu_shimo',
  'https://shimoesu.com/'
);

console.log('\n完了');
