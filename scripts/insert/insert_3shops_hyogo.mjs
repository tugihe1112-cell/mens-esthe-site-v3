/**
 * 兵庫 3店舗 一括処理
 * - MRS.TENOR / Mrs.melty / lemonade
 * - website_url / schedule_url / price_system 設定
 * - /gals/ からセラピスト挿入 (wcms, 直接URL保存)
 * - 店舗画像設置
 * - 重複旧ID削除
 *
 * 実行: node scripts/insert/insert_3shops_hyogo.mjs [--dry-run]
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

const SHOPS = [
  {
    id: 'hyogo_sannomiya_mrs_tenor',
    name: 'MRS.TENOR',
    base: 'https://esute-tenor.net',
    scheduleUrl: 'https://esute-tenor.net/schedule/',
    price: { "75": 10000, "90": 13000, "120": 17000, "150": 21000, "180": 25000 },
    // h2: "栗花落-つゆり-のご紹介" → ハイフン前
    parseName: (h2) => {
      const m = h2.replace('のご紹介', '').match(/^([^-\s　]{1,10})/);
      return m ? m[1] : null;
    },
  },
  {
    id: 'hyogo_sannomiya_mrs_melty',
    name: 'Mrs.melty',
    base: 'https://melty-salon.com',
    scheduleUrl: 'https://melty-salon.com/schedule/',
    price: { "70": 10000, "100": 13000, "130": 17000, "160": 22000 },
    // h2: "りょうこセラピストのご紹介" → セラピスト前
    parseName: (h2) => {
      const clean = h2.replace('のご紹介', '').replace('セラピスト', '');
      return clean.match(/([ぁ-んァ-ヾ一-龯々]{1,10})/)?.[1] || null;
    },
  },
  {
    id: 'hyogo_sannomiya_lemonade',
    name: 'lemonade',
    base: 'https://kobe-es.net',
    scheduleUrl: 'https://kobe-es.net/schedule/',
    price: { "90": 14000, "120": 18000, "150": 22000, "180": 26000 },
    // h2: "ひなののご紹介" → のご紹介前
    parseName: (h2) => {
      const clean = h2.replace('のご紹介', '');
      return clean.match(/([ぁ-んァ-ヾ一-龯々]{1,10})/)?.[1] || null;
    },
  },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchHtml(url) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function uploadShopLogo(imageUrl, shopId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg','jpeg','png','gif','webp'].includes(ext) ? ext : 'jpg';
    const fileName = `${shopId}.${safeExt}`;
    const { error } = await supabase.storage.from('shop-logos')
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) throw error;
    return supabase.storage.from('shop-logos').getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

// ============================================================
// 重複旧IDを削除
// ============================================================
console.log('=== 重複旧ID削除 ===');
const oldIds = ['1191_1', '1193_1'];
for (const oldId of oldIds) {
  const { data } = await supabase.from('shops').select('id,name').eq('id', oldId).maybeSingle();
  if (data) {
    if (!DRY_RUN) {
      await supabase.from('therapists').delete().eq('shop_id', oldId);
      await supabase.from('shops').delete().eq('id', oldId);
      console.log(`  ✅ 削除: ${oldId} (${data.name})`);
    } else {
      console.log(`  [DRY] 削除予定: ${oldId} (${data.name})`);
    }
  }
}

// ============================================================
// 各店舗処理
// ============================================================
for (const shop of SHOPS) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`店舗: ${shop.name} (${shop.id})`);

  // 1. 店舗情報更新
  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').update({
      website_url: shop.base,
      schedule_url: shop.scheduleUrl,
      price_system: shop.price,
    }).eq('id', shop.id);
    console.log(error ? `  ❌ 基本情報更新失敗: ${error.message}` : `  ✅ website_url / schedule_url / price_system 設定`);
  } else {
    console.log(`  [DRY] price: ${JSON.stringify(shop.price)}`);
  }

  // 2. OGP画像取得 → 店舗ロゴ設定
  try {
    const topHtml = await fetchHtml(shop.base);
    const $top = cheerio.load(topHtml);
    const ogImg = $top('meta[property="og:image"]').attr('content');
    if (ogImg) {
      const fullOgp = ogImg.startsWith('http') ? ogImg : new URL(ogImg, shop.base).href;
      console.log(`  OGP画像: ${fullOgp}`);
      if (!DRY_RUN) {
        const stored = await uploadShopLogo(fullOgp, shop.id);
        if (stored) {
          await supabase.from('shops').update({ image_url: stored }).eq('id', shop.id);
          console.log(`  ✅ 店舗画像: ${stored}`);
        } else {
          console.log(`  ⚠️ 店舗画像アップロード失敗`);
        }
      }
    }
  } catch (e) {
    console.log(`  ⚠️ トップページ取得失敗: ${e.message}`);
  }

  // 3. /gals/ からUID一覧取得
  const galsUrl = `${shop.base}/gals/`;
  let uids = [];
  try {
    const galsHtml = await fetchHtml(galsUrl);
    const $g = cheerio.load(galsHtml);
    const uidSet = new Set();
    $g('a[href*="/gals/profile?uid="]').each((_, el) => {
      const m = ($g(el).attr('href') || '').match(/uid=(\d+)/);
      if (m) uidSet.add(m[1]);
    });
    uids = [...uidSet];
    console.log(`  プロフィールUID: ${uids.length}件`);
  } catch (e) {
    console.log(`  ❌ /gals/ 取得失敗: ${e.message}`);
    continue;
  }

  if (uids.length === 0) { console.log('  UID 0件 → スキップ'); continue; }

  // 4. セラピスト既存確認
  const { count: existing } = await supabase.from('therapists')
    .select('id', { count: 'exact', head: true }).eq('shop_id', shop.id);
  if (existing > 0) {
    console.log(`  既存セラピスト ${existing}名 → 削除して再挿入`);
    if (!DRY_RUN) await supabase.from('therapists').delete().eq('shop_id', shop.id);
  }

  // 5. 各プロフィールページを巡回 → セラピスト挿入
  let inserted = 0, noImage = 0, noName = 0;
  process.stdout.write(`  挿入中: `);

  for (const uid of uids) {
    try {
      const profHtml = await fetchHtml(`${shop.base}/gals/profile?uid=${uid}`);
      const $ = cheerio.load(profHtml);

      // 名前取得
      let name = null;
      $('h2').each((_, el) => {
        const text = $(el).text().trim();
        if (text.includes('のご紹介')) {
          const parsed = shop.parseName(text);
          if (parsed) { name = parsed; return false; }
        }
      });
      if (!name) { noName++; process.stdout.write('?'); continue; }

      // 画像取得 (/wcms/gals/images/{uid}/ 優先)
      let imgUrl = null;
      $(`img[src*="/wcms/gals/images/${uid}/"]`).each((_, el) => {
        const src = $(el).attr('src') || '';
        if (src && !src.includes('np.jpg')) {
          imgUrl = `${shop.base}${src}`;
          return false;
        }
      });
      if (!imgUrl) { noImage++; process.stdout.write('_'); }

      if (DRY_RUN) {
        process.stdout.write(imgUrl ? '.' : '_');
        continue;
      }

      const therapistId = `${shop.id}_${name.replace(/\s+/g, '_')}`;
      const { error } = await supabase.from('therapists').upsert({
        id: therapistId, shop_id: shop.id, name,
        age: null, height: null, cup: null,
        image_url: imgUrl,
      });
      if (!error) { inserted++; process.stdout.write(imgUrl ? '.' : 'o'); }
      else { process.stdout.write('x'); }

      await sleep(150);
    } catch (e) {
      process.stdout.write('!');
    }
  }

  console.log('');
  if (DRY_RUN) {
    console.log(`  [DRY] 対象: ${uids.length}名 (画像なし: ${noImage}, 名前取得失敗: ${noName})`);
  } else {
    console.log(`  ✅ 挿入: ${inserted}/${uids.length}名 (画像なし: ${noImage}, 名前取得失敗: ${noName})`);
  }
}

console.log('\n完了');
