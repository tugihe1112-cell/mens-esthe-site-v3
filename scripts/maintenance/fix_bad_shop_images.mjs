/**
 * fix_bad_shop_images.mjs
 *
 * shop_icon / logo系の「使えない画像」が設定されている店舗に対して
 * og:image（ロゴ以外）や hero/main visual 画像を取得して上書きする
 *
 * 使い方:
 *   node scripts/maintenance/fix_bad_shop_images.mjs --area=shinjuku [--dry-run]
 *   node scripts/maintenance/fix_bad_shop_images.mjs --area=all [--dry-run]
 *
 * --area には shops.id の部分一致を指定（shinjuku, shibuya, ginza, osaka, ...）
 * --area=all で全店舗対象
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const areaArg  = (process.argv.find(a => a.startsWith('--area=')) || '--area=all').split('=')[1];

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// 「使えない画像」の判定
const isBadImage = (url) => {
  if (!url) return true;                                // null も対象
  if (url.includes('shop_icon')) return true;           // caskan 小アイコン
  const filename = url.split('/').pop().split('?')[0].toLowerCase();
  if (filename.endsWith('.svg')) return true;
  if (filename === 'logo.png' || filename === 'logo.jpg' || filename === 'logo.webp') return true;
  if (/^h+[-_.]?logo\.(png|jpg|webp)$/.test(filename)) return true;       // h-logo, hh-logo
  if (/^header[._-]logo\.(png|jpg|webp)$/.test(filename)) return true;    // header.logo.png, header-logo.png
  if (/^(logo[-_]?hr|footer[-_]logo|logo[-_]main|main[-_]?logo|visual[-_]logo|logo[-_]visual)\.(png|jpg|webp)$/.test(filename)) return true;
  if (/^cropped.*logo.*\.(png|jpg)$/.test(filename)) return true;
  if (/apple.?touch.?icon/i.test(filename)) return true;                  // apple-touch-icon, llapple-touch-icon
  if (/spacer/i.test(filename)) return true;            // spacer900x360.png 等
  if (/^banner\d+x\d+/i.test(filename)) return true;   // banner200x40.png 等の小バナー
  return false;
};

// 「候補として使えない画像」の判定（findBetterImage 内で使用）
const isBadCandidate = (url) => {
  if (!url) return true;
  const filename = url.split('/').pop().split('?')[0].toLowerCase();

  // ベクター・アニメーション
  if (filename.endsWith('.svg') || filename.endsWith('.gif')) return true;

  // ロゴ系
  if (/logo/i.test(filename)) return true;
  if (filename.includes('touch-icon') || filename.includes('touchicon')) return true;

  // spacer / placeholder / blank / noimage
  if (/spacer/i.test(filename)) return true;
  if (/placeholder/i.test(filename)) return true;
  if (/noimage/i.test(filename)) return true;
  if (/^blank\.(png|jpg|webp)$/.test(filename)) return true;

  // ローダー / スピナー
  if (/^load(er|ing)?\.(png|jpg|webp)$/.test(filename)) return true;

  // アイコン類
  if (/^icon/i.test(filename)) return true;      // icon_new.png, icon_system.png, iconZerotwo.png
  if (/^ico_/i.test(filename)) return true;       // ico_line.svg
  if (/^dicon\./i.test(filename)) return true;    // dIcon.png
  if (/\bicon\b/i.test(filename)) return true;    // tel_icon, reserve_icon

  // ナビ・ボタン・UI要素
  if (/^np\b/i.test(filename)) return true;       // np.jpg, np_list05.jpg
  if (/^btn/i.test(filename)) return true;        // btn_realtime.jpg
  if (/drawer/i.test(filename)) return true;
  if (/page.?top/i.test(filename)) return true;   // page-top_off.png
  if (/^back_btn/i.test(filename)) return true;
  if (/title_topic/i.test(filename)) return true; // らんぷ系セクションヘッダー

  // バナー・リクルート
  if (/^bnr/i.test(filename)) return true;        // bnr_mensbz.jpg
  if (/recruit/i.test(filename)) return true;     // img_recruit.jpg
  if (/reserve/i.test(filename)) return true;     // reserve_icon_web.png
  if (/^banner\d/i.test(filename)) return true;   // banner200x40.png

  // 電話・SNS・決済
  if (/^tel\d/i.test(filename)) return true;      // tel20230611.png
  if (/^(x|line|instagram|twitter|facebook|paypay|bluesky|card_brand)\.(png|jpg|webp)$/.test(filename)) return true;
  if (/paypay/i.test(filename)) return true;
  if (/credit/i.test(filename)) return true;      // credit-card-*.jpg, bn_credit.png, banner_credit.jpg
  if (/card_brand/i.test(url)) return true;       // o-pack.jp/images/card_brand/

  // 既知の外部バナードメイン（self-hosted 以外は除外）
  if (/esthe-zukan\.com/i.test(url)) return true;
  if (/fucolle\.com\/photo\/girl/i.test(url)) return true;  // キャスト写真
  if (/ranking-deli\.jp/i.test(url)) return true;
  if (/ad\.qzin\.jp/i.test(url)) return true;
  if (/m-sns\.net\/uploads\/banners/i.test(url)) return true;

  // アフィリエイトリンクバナー (/images/link/link_XXX.jpg)
  if (/\/link\/link_\d+\.(jpg|jpeg|png)$/i.test(url)) return true;
  if (/^link_\d+\.(jpg|jpeg|png)$/.test(filename)) return true;

  // 単数字ファイル名 (1.jpg etc.)
  if (/^\d+\.(png|jpg|webp)$/.test(filename)) return true;

  return false;
};

const toAbsolute = (src, base) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('/')) return new URL(base).origin + src;
  return base.replace(/\/$/, '') + '/' + src;
};

// ページから「良い画像」を探す
const findBetterImage = async (url) => {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();

    // 1. og:image（ロゴ以外）
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
              || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
    if (og && !isBadCandidate(og)) return toAbsolute(og, url);

    // 2. twitter:image（ロゴ以外）
    const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
              || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)?.[1];
    if (tw && !isBadCandidate(tw)) return toAbsolute(tw, url);

    // 3. hero / main-visual / slider 系の画像（CSS bg + img src）
    const heroPatterns = [
      /url\(["']?([^"')]+(?:mv|main[-_]?visual|hero|slider|slide|top[-_]?img|mainimg|fv|firstview|keyvisual|kv)[^"')]*\.(?:jpg|jpeg|png|webp))["']?\)/gi,
      /<img[^>]+src=["']([^"']*(?:mv|main[-_]?visual|hero|slide|fv|firstview|top[-_]?img|mainimg|keyvisual|kv)[^"']*\.(?:jpg|jpeg|png|webp))["']/gi,
    ];
    for (const pat of heroPatterns) {
      const m = pat.exec(html);
      if (m?.[1]) return toAbsolute(m[1], url);
    }

    // 4. uploads / content 系のファイル（同一ドメイン限定・bad候補除外）
    const base = new URL(url).origin;
    const uploadPat = /<img[^>]+src=["']([^"']*(?:uploads|wp-content|images|img|photos)[^"']*\.(?:jpg|jpeg|png))["'][^>]*>/gi;
    let m;
    while ((m = uploadPat.exec(html)) !== null) {
      const src = m[1];
      const abs = toAbsolute(src, url);
      if (abs && (abs.startsWith(base) || src.startsWith('/')) && !isBadCandidate(abs)) {
        return abs;
      }
    }

    // 5. サイト独自ドメインの背景画像（bad候補除外）
    const bgMatch = [...html.matchAll(/url\(["']?([^"')]+\.(?:jpg|jpeg|png|webp))["']?\)/gi)]
      .map(mx => mx[1])
      .find(s => {
        const abs = s.startsWith('/') ? base + s : s;
        return (abs.startsWith(base) || s.startsWith('/')) && !isBadCandidate(abs);
      });
    if (bgMatch) return toAbsolute(bgMatch, url);

    return null;
  } catch {
    return null;
  }
};

// ==============================
// メイン
// ==============================

let query = supabase.from('shops').select('id, name, website_url, image_url');
if (areaArg !== 'all') {
  query = query.ilike('id', `%${areaArg}%`);
}
const { data: shops, error } = await query;
if (error) { console.error(error); process.exit(1); }

const targets = shops.filter(s => isBadImage(s.image_url));

console.log(`${isDryRun ? '[DRY RUN] ' : ''}エリア: ${areaArg}`);
console.log(`bad image 対象: ${targets.length}件 / ${shops.length}件中\n`);

let updated = 0, skipped = 0, failed = 0;

for (const shop of targets) {
  if (!shop.website_url) {
    console.log(`⚠️  ${shop.name} → website_url なし`);
    failed++;
    continue;
  }
  process.stdout.write(`🔍 ${shop.name} ... `);

  const newUrl = await findBetterImage(shop.website_url);

  if (!newUrl) {
    console.log(`❌ 良い画像なし`);
    failed++;
    continue;
  }

  if (newUrl === shop.image_url) {
    console.log(`⏭  変わらず`);
    skipped++;
    continue;
  }

  console.log(`✅ ${newUrl}`);

  if (!isDryRun) {
    const { error: e } = await supabase.from('shops').update({ image_url: newUrl }).eq('id', shop.id);
    if (e) { console.log(`   ❌ DB エラー: ${e.message}`); failed++; }
    else   { updated++; }
  } else {
    updated++;
  }
}

console.log(`\n完了: ${updated}件更新, ${skipped}件スキップ, ${failed}件失敗`);
